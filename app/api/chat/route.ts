import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getAccessibleAreas } from "@/lib/authz";
import {
  buildCustomEmployeesWorkbook,
  listScopeMetadata,
  COLUMN_KEYS,
  type ColumnKey,
} from "@/lib/excel-exports";
import { listEmployeesForChat } from "@/lib/chat-queries";
import {
  calculateExtraPayForChat,
  calculateMonthlyPayForChat,
  normalizeExtraPayType,
} from "@/lib/payroll-calc";

export const maxDuration = 60;

const SalaryTypeEnum = z
  .enum(["hour", "monthly", "other", "all"])
  .describe(
    'Filter by salary type. "hour" = hourly paid, "monthly" = monthly paid, "other" = other type, "all" = no filter.',
  );

const ColumnEnum = z.enum(COLUMN_KEYS);

const ExtraPayTypeEnum = z.enum([
  "overtime",
  "ot",
  "restday",
  "rd",
  "od",
  "offday",
  "off-day",
  "off_day",
  "holiday",
  "ph",
  "publicholiday",
  "public-holiday",
  "public_holiday",
  "double",
  "2x",
  "triple",
  "3x",
]);

const IneligibleHandlingEnum = z.enum(["skip", "zero", "compute-anyway"]);

const RestdayEnum = z
  .enum([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    "none",
  ])
  .describe(
    "Filter by employees whose restday array CONTAINS this day. e.g. 'sunday' matches anyone resting on Sunday (possibly along with other days).",
  );

const DEFAULT_COLUMNS: ColumnKey[] = [
  "name",
  "area",
  "position",
  "department",
  "salaryType",
  "salaryHour",
  "salaryMonth",
  "estimatedMonthly",
];

function sanitize(name: string) {
  return name.replace(/[^a-z0-9_-]+/gi, "-").slice(0, 60);
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!session.isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }

  const accessibleAreas = await getAccessibleAreas(session);
  if (accessibleAreas.length === 0) {
    return Response.json({ error: "No accessible areas" }, { status: 403 });
  }

  const body = (await req.json()) as {
    messages: UIMessage[];
    areaId?: number | null;
  };
  const { messages } = body;

  const requestedAreaId =
    typeof body.areaId === "number" && Number.isFinite(body.areaId)
      ? body.areaId
      : null;

  const currentArea =
    (requestedAreaId !== null
      ? accessibleAreas.find((a) => a.id === requestedAreaId)
      : null) ?? null;

  const scopedAreaIds = currentArea
    ? [currentArea.id]
    : accessibleAreas.map((a) => a.id);

  const scopeLabel = currentArea
    ? `the "${currentArea.name}" area`
    : `all accessible areas (${accessibleAreas.map((a) => a.name).join(", ")})`;

  const { positions: scopePositions, departments: scopeDepartments } =
    await listScopeMetadata(scopedAreaIds);

  const lookupEmployees = tool({
    description:
      "Look up employees from the database to answer questions in plain text (e.g. 'who is paid the least?', 'how many boilermen are there?'). Returns structured JSON for you to summarise. Use this ONLY for answering questions — do NOT call it when the user explicitly asks to export/download/get a file.",
    inputSchema: z.object({
      salaryType: SalaryTypeEnum.default("all"),
      positionName: z
        .string()
        .nullable()
        .default(null)
        .describe(
          "EXACT position name (case-insensitive). Must match one of the available positions in the system prompt. e.g. 'BOILERMAN' not 'boiler'. Pass null for any.",
        ),
      departmentName: z
        .string()
        .nullable()
        .default(null)
        .describe(
          "EXACT department name (case-insensitive). Must match one of the available departments. Pass null for any.",
        ),
      nameSearch: z
        .string()
        .nullable()
        .default(null)
        .describe("Case-insensitive substring match against employee name."),
      restday: RestdayEnum.nullable().default(null),
      sortBy: z
        .enum(["name", "salaryHour", "salaryMonth", "estimatedMonthly"])
        .default("name")
        .describe(
          "Sort key. Use 'estimatedMonthly' to compare hourly vs monthly fairly (hourly is converted to monthly using hoursPerDay × daysPerMonth).",
        ),
      sortOrder: z.enum(["asc", "desc"]).default("asc"),
      limit: z.number().int().min(1).max(100).default(20),
    }),
    execute: async (input) => {
      const result = await listEmployeesForChat({
        areaIds: scopedAreaIds,
        salaryType: input.salaryType,
        positionName: input.positionName,
        departmentName: input.departmentName,
        nameSearch: input.nameSearch,
        restday: input.restday,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
        limit: input.limit,
      });
      return {
        scope: scopeLabel,
        totalMatching: result.totalMatching,
        returned: result.rows.length,
        employees: result.rows,
      };
    },
  });

  const calculateMonthlyPay = tool({
    description: [
      "Calculate one employee's pay for a specific calendar month using the real calendar.",
      "Iterates each date in the month, looks up the weekday's schedule (start/end/break) for that employee, skips restdays and unscheduled days, and sums hours × hourly rate.",
      "Use this for questions like 'how much will Amirul earn in March 2026?', 'what is Amirul's March salary?', 'calculate pay for X in <month>'.",
      "Returns a per-day breakdown so you can summarise total hours, working days, total pay.",
    ].join(" "),
    inputSchema: z.object({
      employeeName: z
        .string()
        .min(1)
        .describe(
          "Employee name (case-insensitive substring match). If multiple match, the tool will return candidates and you must ask the user to pick.",
        ),
      year: z
        .number()
        .int()
        .min(2000)
        .max(2100)
        .describe(
          "Calendar year. If the user didn't specify, default to the current year from your context.",
        ),
      month: z
        .number()
        .int()
        .min(1)
        .max(12)
        .describe("Month 1-12 (1=January, 12=December)."),
    }),
    execute: async (input) => {
      const res = await calculateMonthlyPayForChat({
        areaIds: scopedAreaIds,
        employeeName: input.employeeName,
        year: input.year,
        month: input.month,
      });
      if (!res.ok) {
        return { error: res.error, candidates: res.candidates };
      }
      const r = res.result;
      // Trim breakdown to a compact summary — full per-day list bloats tokens.
      const workdaysByWeekday: Record<string, { count: number; hours: number }> = {};
      for (const d of r.breakdown) {
        if (d.status !== "work") continue;
        const w = d.weekday;
        if (!workdaysByWeekday[w]) workdaysByWeekday[w] = { count: 0, hours: 0 };
        workdaysByWeekday[w].count++;
        workdaysByWeekday[w].hours += d.hours;
      }
      return {
        employee: r.employee,
        period: `${r.monthName} ${r.year}`,
        daysInMonth: r.daysInMonth,
        workingDays: r.workingDays,
        restDays: r.restDays,
        unscheduledDays: r.unscheduledDays,
        totalHours: r.totalHours,
        totalPay: r.totalPay,
        monthlySalaryIfMonthlyPaid: r.monthlySalary,
        workdaysByWeekday,
        sampleDays: r.breakdown.filter((d) => d.status === "work").slice(0, 3),
      };
    },
  });

  const calculateExtraPay = tool({
    description: [
      "Calculate overtime / restday / holiday / double / triple pay for one employee given a number of hours.",
      "Formula: pay = hourly_rate × hours × multiplier.",
      "Use this for questions like 'andy has 10 overtime hours, how much should i pay?', 'X worked 4 hours on holiday', 'pay for 8 hours restday'.",
      "The tool checks (1) area-level enablement (otRate/rdRate/phRate) and (2) the employee's eligibility flag (hasOvertime/hasRestday/...). If either is off, the tool still returns the math but adds a warning — relay the warning to the user.",
    ].join(" "),
    inputSchema: z.object({
      employeeName: z
        .string()
        .min(1)
        .describe(
          "Employee name (case-insensitive substring match). If multiple match, the tool returns candidates and you must ask the user.",
        ),
      hours: z
        .number()
        .positive()
        .describe("Number of hours worked at this multiplier rate."),
      type: z
        .enum([
          "overtime",
          "ot",
          "restday",
          "rd",
          "od",
          "offday",
          "off-day",
          "off_day",
          "holiday",
          "ph",
          "publicholiday",
          "public-holiday",
          "public_holiday",
          "double",
          "2x",
          "triple",
          "3x",
        ])
        .describe(
          "Pay type. Accepts canonical names + common shortcuts: overtime/ot (1.5x default), restday/rd/od/offday (2x), holiday/ph (3x public holiday), double/2x, triple/3x. Multipliers come from the area's pay_multiplier table.",
        ),
    }),
    execute: async (input) => {
      const canonicalType = normalizeExtraPayType(input.type);
      const res = await calculateExtraPayForChat({
        areaIds: scopedAreaIds,
        employeeName: input.employeeName,
        hours: input.hours,
        type: canonicalType,
      });
      return res;
    },
  });

  const exportEmployees = tool({
    description: [
      "Export filtered employee data to an Excel (.xlsx) file. The file is streamed back to the user's browser for direct download.",
      "Use this whenever the user asks to download/export/get a file/spreadsheet/Excel of employees.",
      "You choose:",
      "- filters: which employees to include (by salary type, position, department, name search)",
      "- columns: which fields to include in the Excel. Pick the columns the user asked for.",
      "Example for 'export boilermen with restday and hourly pay':",
      '  filters: { positionName: "boiler" }, columns: ["name", "position", "restday", "salaryHour", "dailyPay"]',
    ].join(" "),
    inputSchema: z.object({
      filters: z
        .object({
          salaryType: SalaryTypeEnum.optional(),
          positionName: z
            .string()
            .nullable()
            .default(null)
            .describe(
              "EXACT position name (case-insensitive). Must match one from the system prompt's position list.",
            ),
          departmentName: z
            .string()
            .nullable()
            .default(null)
            .describe(
              "EXACT department name (case-insensitive). Must match one from the system prompt's department list.",
            ),
          nameSearch: z.string().nullable().default(null),
          restday: RestdayEnum.nullable().default(null),
        })
        .default(() => ({
          positionName: null,
          departmentName: null,
          nameSearch: null,
          restday: null,
        })),
      columns: z
        .array(ColumnEnum)
        .min(1)
        .default(DEFAULT_COLUMNS)
        .describe(
          "Excel columns in order. Pick what the user asked for. 'dailyPay' is auto-computed (hourly: salaryHour×hoursPerDay; monthly: salaryMonth÷daysPerMonth). 'estimatedMonthly' normalises hourly to monthly. 'schedule' is a multi-line cell with all 7 days. 'extraPay' is the per-row computed pay = hourlyRate × extraPay.hours × multiplier(extraPay.type) — requires the extraPay input.",
        ),
      sheetTitle: z
        .string()
        .nullable()
        .default(null)
        .describe(
          "Short title for the worksheet tab and filename (e.g. 'Boilermen', 'Hourly Staff'). Keep under 30 chars.",
        ),
      extraPay: z
        .object({
          hours: z
            .number()
            .positive()
            .describe("Hours worked at this multiplier rate."),
          type: ExtraPayTypeEnum.describe(
            "Pay type: overtime/ot=1.5x, restday/rd/od/offday=2x, holiday/ph=3x, double/2x, triple/3x.",
          ),
          ineligibleHandling: IneligibleHandlingEnum.nullable()
            .default(null)
            .describe(
              "What to do for employees not flagged eligible (hasOvertime/hasRestday/...): skip=exclude, zero=show with pay 0, compute-anyway=include and compute. Leave null to let the tool ask the user.",
            ),
        })
        .nullable()
        .default(null)
        .describe(
          "Set this when the user wants a computed pay column based on hours × multiplier (e.g. 'export office staff with OT pay for 5 hours'). Include 'extraPay' in columns to display the result.",
        ),
    }),
    execute: async (input) => {
      const extraPay = input.extraPay
        ? {
            hours: input.extraPay.hours,
            type: normalizeExtraPayType(input.extraPay.type),
            ineligibleHandling: input.extraPay.ineligibleHandling,
          }
        : undefined;
      const result = await buildCustomEmployeesWorkbook({
        areaIds: scopedAreaIds,
        filters: input.filters,
        columns: input.columns,
        sheetTitle: input.sheetTitle ?? undefined,
        extraPay,
      });
      if (result.kind === "needs-eligibility-clarification") {
        return {
          needsClarification: true as const,
          clarificationReason: "ineligible-employees" as const,
          label: result.label,
          ineligibleCount: result.ineligibleCount,
          ineligibleNames: result.ineligibleNames,
          eligibleCount: result.eligibleCount,
        };
      }
      const stamp = new Date().toISOString().slice(0, 10);
      const scope = currentArea ? sanitize(currentArea.name) : "all-areas";
      const base = input.sheetTitle
        ? sanitize(input.sheetTitle)
        : "employees";
      const filename = `${base}-${scope}-${stamp}.xlsx`;
      return {
        data: result.buffer.toString("base64"),
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename,
        rowCount: result.rowCount,
        skippedCount: result.skippedCount,
        scope: scopeLabel,
        appliedFilters: input.filters,
        columns: input.columns,
      };
    },
    // Keep the workbook bytes out of the model's context — Gemini only needs
    // a short confirmation (or the clarification details) to write its
    // follow-up text.
    toModelOutput: ({ output }) => {
      if ("needsClarification" in output && output.needsClarification) {
        return {
          type: "text",
          value: [
            `Export paused — needs clarification.`,
            `${output.ineligibleCount} employee(s) are NOT flagged eligible for ${output.label}: ${output.ineligibleNames.join(", ")}.`,
            `${output.eligibleCount} are eligible.`,
            `Ask the user: skip them, include with pay=0, or compute anyway? Then re-call exportEmployees with extraPay.ineligibleHandling set ("skip" | "zero" | "compute-anyway").`,
          ].join(" "),
        };
      }
      const skipped =
        output.skippedCount && output.skippedCount > 0
          ? ` (${output.skippedCount} ineligible employees skipped)`
          : "";
      return {
        type: "text",
        value: `Generated ${output.filename} with ${output.rowCount} rows${skipped}. The user can download it directly from the chat UI.`,
      };
    },
  });

  const positionsHint =
    scopePositions.length > 0
      ? `Available positions in scope: ${scopePositions.join(", ")}.`
      : "There are no defined positions in this scope.";
  const departmentsHint =
    scopeDepartments.length > 0
      ? `Available departments in scope: ${scopeDepartments.join(", ")}.`
      : "There are no defined departments in this scope.";

  const area5InScope = scopedAreaIds.includes(5);
  const terminologyHints: string[] = [];
  if (area5InScope) {
    terminologyHints.push(
      `AREA 5 TERMINOLOGY (current scope ${currentArea?.id === 5 ? "is" : "includes"} area 5):`,
      `- "staff" → monthly-paid employees. Apply filters.salaryType = "monthly".`,
      `- "pekerja", "clerk", "worker" → hourly-paid employees. Apply filters.salaryType = "hour".`,
      `These are local terms. If the user says "list of staff" or "export staff" while area 5 is in scope, treat it as the salary-type filter above. Do not ask for clarification when these terms are used.`,
    );
  }

  const result = streamText({
    model: google(GEMINI_MODEL),
    system: [
      `You are a friendly HR assistant for ${session.name}.`,
      `Today's date is ${new Date().toISOString().slice(0, 10)}.`,
      `Current scope: ${scopeLabel}. All data and exports are restricted to this scope.`,
      ``,
      `OUTPUT FORMAT — Mostly plain text with simple bullets only. Strict rules:`,
      `- NEVER use **bold**, *italic*, _underline_, or backticks for emphasis. Just write the word plainly.`,
      `- BULLET LISTS ARE ALLOWED with a hyphen prefix only: a line starting with "- " becomes a styled bullet in the UI. Use these for listing employees, items, options, or anything sequential. Never use "*" as the bullet marker.`,
      `- NEVER use markdown headings (# Heading).`,
      `- NEVER use markdown tables.`,
      `- Use plain numbers and currency (e.g. "65.60") without code fences or backticks.`,
      `- Line breaks via newlines are fine.`,
      `Example list format:`,
      `  - ALFONSIUS: 8.2/hr × 8hr = 65.60`,
      `  - ANDRI WIJAYA: 8.2/hr × 8hr = 65.60`,
      positionsHint,
      departmentsHint,
      ...(terminologyHints.length > 0 ? ["", ...terminologyHints] : []),
      ``,
      `DEFAULT BEHAVIOR: Answer conversationally in plain text.`,
      ``,
      `FOUR TOOLS:`,
      `1. lookupEmployees — answer questions about employees ("who is paid least?", "how many boilermen?"). Returns JSON; summarise in plain text.`,
      `2. calculateMonthlyPay — calculate one employee's pay for a specific calendar month using the real calendar + their schedule + restdays. Use for "what is Amirul's March salary", "how much will <name> earn in <month>". Today's date is in your context — if the user says just a month, default the year to the current year.`,
      `3. calculateExtraPay — calculate overtime / restday / holiday / double / triple pay given hours. Use for "X has 10 overtime hours, how much to pay", "pay Y for 4 hours holiday work". The tool accepts both canonical names and shortcuts: ot=overtime, rd/od/offday=restday, ph/publicholiday=holiday, 2x=double, 3x=triple. Pass whichever the user used; the tool normalises internally.`,
      `4. exportEmployees — ONLY when the user asks to download/export/get a file/spreadsheet/Excel.`,
      ``,
      `WHEN BUILDING EXPORTS:`,
      `- Always pick the columns that match what the user mentioned. e.g. "with restday and hourly pay" → include "restday" and "salaryHour". "with daily pay" → include "dailyPay".`,
      `- Position and department filters are EXACT (case-insensitive). Always pick the matching name from the position/department lists above. e.g. user says "boilerman" → check the list and use exactly "BOILERMAN", not "boiler" (substring matches would also capture "BOILER INCHARGEMAN").`,
      `- For "employees whose restday is on Sunday" or "who rests on Friday", use filters.restday = "sunday"/"friday" (always lowercase). This matches anyone with that day in their restday list (employees can have multiple restdays).`,
      `- If multiple positions could fit (e.g. user says "boiler" and both "BOILERMAN" and "BOILER INCHARGEMAN" exist), ASK the user which one — do NOT guess.`,
      `- If a position/department the user mentions doesn't appear in the lists above, tell them so before exporting an empty file.`,
      `- Always include "name" as the first column unless the user says otherwise.`,
      `- Set sheetTitle to a short descriptive name (e.g. "Boilermen").`,
      ``,
      `EXTRA-PAY EXPORTS (computed "amount to pay" column):`,
      `When the user asks to export employees with a pay calculation for N hours at some rate (e.g. "office staff OT 5 hours on PH, export with amount to pay", "all hourly workers, restday 8 hours, export"):`,
      `- Set extraPay = { hours, type } on the exportEmployees tool.`,
      `- Include "extraPay" in the columns array. Suggested columns when the user asks for "name, hourrate, amount to pay": ["name", "salaryHour", "extraPay"].`,
      `- Map natural language to type: OT/overtime → "overtime", restday/off day/OD → "restday", PH/public holiday → "holiday", 2x/double → "double", 3x/triple → "triple".`,
      `- AMBIGUOUS MULTIPLIERS — if the user mentions more than one multiplier trigger in the same phrase (e.g. "OT on public holiday", "OT on restday", "OT on PH"), DO NOT guess. STOP and ask the user which rate to apply: "You said OT on a public holiday. Should I use the PH rate (3x) or the OT rate (1.5x)?" Wait for their reply, then call the tool with the chosen type. PH usually supersedes OT in real-world payroll, but always confirm.`,
      `- ELIGIBILITY: leave extraPay.ineligibleHandling = null on the first call. If the tool returns { needsClarification: true, ineligibleNames }, list those employees to the user and ask: "These employees aren't flagged eligible for <label>: <names>. Should I (a) skip them, (b) show them with pay = 0, or (c) compute anyway?" Then re-call exportEmployees with extraPay.ineligibleHandling set to "skip" | "zero" | "compute-anyway".`,
      `- Example resolved call for "office, OT 5 hours on PH, export name/hourrate/pay" (after the user picks PH 3x and "skip" for ineligible):`,
      `    filters: { departmentName: "Office" }, columns: ["name", "salaryHour", "extraPay"], extraPay: { hours: 5, type: "holiday", ineligibleHandling: "skip" }, sheetTitle: "Office PH Pay"`,
      ``,
      `COMPARING PAY: hourly and monthly salaries aren't comparable as raw numbers. For "highest/lowest paid", use sortBy="estimatedMonthly".`,
      ``,
      `MULTI-EMPLOYEE CALCULATIONS: When the user asks a pay/hours/calculation question involving more than one employee in a single message (e.g. "X and Y worked 8 hours yesterday, how much to pay?"):`,
      `1. Look up or calculate each employee's pay individually.`,
      `2. Show the per-employee breakdown.`,
      `3. ALWAYS finish with a "Total: <sum>" line summing all employees. Do not omit the total even if individual figures are obvious.`,
      `Example output (use - bullets for the per-employee lines):`,
      `  - ALFONSIUS: 8.2/hr × 8hr = 65.60`,
      `  - ANDRI WIJAYA: 8.2/hr × 8hr = 65.60`,
      `  Total: 131.20`,
      ``,
      `Be concise. After exportEmployees returns, confirm the file is ready with the row count and the applied filters. Don't restate the URL — the UI shows a Download button.`,
    ].join("\n"),
    messages: await convertToModelMessages(messages),
    tools: {
      lookupEmployees,
      calculateMonthlyPay,
      calculateExtraPay,
      exportEmployees,
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
