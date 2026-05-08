"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Capsule, CapsuleOption } from "@/components/ui/capsule";
import { TextField } from "@/components/form/text-field";
import { CheckboxField } from "@/components/form/checkbox-field";
import { DatePicker } from "@/components/form/date-picker";
import { FormRow } from "@/components/form/form-row";
import {
  createEmployee,
  updateEmployee,
  type EmployeeFormConfig,
  type EmployeeRow,
  type ScheduleDefaults,
} from "./actions";
import { SalaryDialogButton } from "./salary-dialog-button";
import { WorkingScheduleDialogButton } from "./working-schedule-dialog-button";
import {
  useEmployeeDraftStore,
  EMPTY_DRAFT_VALUES,
  type EmployeeDraftValues,
} from "./employee-draft-store";
import { Label } from "@/components/ui/label";

function LeaveInput({
  value,
  disabled,
  onChange,
  onBlur,
  inputId,
}: {
  value: unknown;
  disabled: boolean;
  onChange: (next: unknown) => void;
  onBlur: () => void;
  inputId: string;
}) {
  const numericValue =
    typeof value === "number" && Number.isFinite(value) ? value : null;
  const [text, setText] = React.useState(
    numericValue === null || numericValue === 0 ? "" : String(numericValue),
  );
  React.useEffect(() => {
    if (numericValue === null) {
      setText("");
      return;
    }
    if (numericValue === 0) return;
    if (Number(text) !== numericValue) setText(String(numericValue));
  }, [numericValue, text]);

  return (
    <Input
      id={inputId}
      type="number"
      inputMode="numeric"
      min={0}
      step={1}
      disabled={disabled}
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (raw === "") {
          onChange(0);
          return;
        }
        const n = Number(raw);
        onChange(Number.isFinite(n) ? Math.trunc(n) : 0);
      }}
      onBlur={onBlur}
      clearable
    />
  );
}
import { PlusIcon } from "lucide-react";
import type { SalaryRates } from "@/components/salary-dialog";
import type { DaySchedule } from "@/components/working-schedule-dialog";
import { PositionSheet } from "../positions/position-sheet";
import { DepartmentSheet } from "../departments/department-sheet";

function scheduleDayFromExisting(
  start: string | null,
  end: string | null,
  brk: string | null,
  defaults: ScheduleDefaults,
): DaySchedule {
  return {
    workStart: start ?? defaults.workStart,
    workEnd: end ?? defaults.workEnd,
    breakStart: brk ?? "12:00",
    breakEnabled: brk != null,
  };
}

const NullableNonEmpty = z
  .string()
  .trim()
  .min(1, "Required when checked")
  .nullable();

const Schema = z
  .object({
    name: z.string().trim().min(1, "Required").max(120),
    dob: NullableNonEmpty,
    gender: z.enum(["Male", "Female"]).nullable(),
    positionId: z.number().int().positive("Required when checked").nullable(),
    departmentId: z
      .number()
      .int()
      .positive("Required when checked")
      .nullable(),
    ic: NullableNonEmpty,
    passport: NullableNonEmpty,
    nationality: z.enum(["Local", "International"]).nullable(),
    contactNumber: NullableNonEmpty,
    email: z.string().trim().email("Invalid email").nullable(),
    totalAnnualLeave: z.number().int().nonnegative().nullable(),
    totalSickLeave: z.number().int().nonnegative().nullable(),
  })
  .refine((d) => !(d.nationality === "International" && d.ic !== null), {
    message: "International employees can't have an Identity Card",
    path: ["ic"],
  });

export function EmployeeForm({
  areaId,
  positions,
  departments,
  otherSalaryTypes,
  config,
  rates,
  scheduleDefaults,
  existing,
}: {
  areaId: number;
  positions: { id: number; name: string }[];
  departments: { id: number; name: string }[];
  otherSalaryTypes: { id: number; name: string }[];
  config: EmployeeFormConfig;
  rates: SalaryRates;
  scheduleDefaults: ScheduleDefaults;
  existing?: EmployeeRow;
}) {
  const router = useRouter();
  const isEdit = !!existing;

  const initialValues = React.useMemo<EmployeeDraftValues>(() => {
    if (existing) {
      return {
        name: existing.name ?? "",
        dob: existing.dob ?? null,
        gender: existing.gender ?? null,
        positionId: existing.positionId ?? null,
        departmentId: existing.departmentId ?? null,
        ic: existing.ic ?? null,
        passport: existing.passport ?? null,
        nationality: existing.nationality ?? null,
        contactNumber: existing.contactNumber ?? null,
        email: existing.email ?? null,
        totalAnnualLeave: existing.totalAnnualLeave ?? null,
        totalSickLeave: existing.totalSickLeave ?? null,
      };
    }
    return useEmployeeDraftStore.getState().values;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  React.useEffect(() => {
    const store = useEmployeeDraftStore.getState();
    if (existing) {
      store.setValues(initialValues);
      store.setSalary(
        existing.salaryType
          ? {
              type: existing.salaryType,
              hour: existing.salaryHour,
              day: existing.salaryDay,
              week: existing.salaryWeek,
              month: existing.salaryMonth,
              otherTypeId: existing.otherSalaryTypeId,
              hasOvertime: existing.hasOvertime ?? true,
              hasRestday: existing.hasRestday ?? true,
              hasHoliday: existing.hasHoliday ?? true,
            }
          : null,
      );
      store.setSchedule(
        existing.restday
          ? {
              restday: existing.restday,
              breakType: existing.breakType ?? "1h",
              days: {
                monday: scheduleDayFromExisting(
                  existing.mondayStart,
                  existing.mondayEnd,
                  existing.mondayBreak,
                  scheduleDefaults,
                ),
                tuesday: scheduleDayFromExisting(
                  existing.tuesdayStart,
                  existing.tuesdayEnd,
                  existing.tuesdayBreak,
                  scheduleDefaults,
                ),
                wednesday: scheduleDayFromExisting(
                  existing.wednesdayStart,
                  existing.wednesdayEnd,
                  existing.wednesdayBreak,
                  scheduleDefaults,
                ),
                thursday: scheduleDayFromExisting(
                  existing.thursdayStart,
                  existing.thursdayEnd,
                  existing.thursdayBreak,
                  scheduleDefaults,
                ),
                friday: scheduleDayFromExisting(
                  existing.fridayStart,
                  existing.fridayEnd,
                  existing.fridayBreak,
                  scheduleDefaults,
                ),
                saturday: scheduleDayFromExisting(
                  existing.saturdayStart,
                  existing.saturdayEnd,
                  existing.saturdayBreak,
                  scheduleDefaults,
                ),
                sunday: scheduleDayFromExisting(
                  existing.sundayStart,
                  existing.sundayEnd,
                  existing.sundayBreak,
                  scheduleDefaults,
                ),
              },
            }
          : null,
      );
      return () => {
        useEmployeeDraftStore.getState().reset();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  const form = useForm({
    defaultValues: initialValues,
    validators: { onChange: Schema },
    listeners: {
      onChange: ({ formApi }) => {
        useEmployeeDraftStore.getState().setValues(formApi.state.values);
      },
    },
    onSubmit: async ({ value }) => {
      try {
        const { salary, schedule } = useEmployeeDraftStore.getState();
        if (!isEdit) {
          if (!salary) {
            toast.error("Please set salary information");
            return;
          }
          if (!schedule) {
            toast.error("Please set working schedule");
            return;
          }
        }
        const payload = {
          ...value,
          salary,
          schedule,
        };
        if (isEdit) await updateEmployee(existing!.id, areaId, payload);
        else await createEmployee(areaId, payload);
        toast.success(isEdit ? "Employee updated" : "Employee created");
        useEmployeeDraftStore.getState().reset();
        router.push(`/employees?area=${areaId}`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    },
  });

  const handleClear = () => {
    useEmployeeDraftStore.getState().reset();
    form.reset(EMPTY_DRAFT_VALUES);
  };

  const [addPositionOpen, setAddPositionOpen] = React.useState(false);
  const [addDepartmentOpen, setAddDepartmentOpen] = React.useState(false);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await form.handleSubmit();
        const errs = form.state.errors;
        const flat = Array.isArray(errs)
          ? errs.flatMap((e) => (e ? Object.values(e) : []))
          : [];
        const first = flat.find(Boolean) as
          | { message?: string }
          | string
          | undefined;
        if (first) {
          const msg =
            typeof first === "string" ? first : first.message ?? "Form invalid";
          toast.error(msg);
        }
      }}
    >
      <FormRow>
        <TextField form={form} name="name" label="Name" required />

        {config.gender && <CheckboxField
          form={form}
          name="gender"
          label="Gender"
          defaultEnabledValue="Male"
        >
          {({ value, disabled, onChange }) => (
            <Capsule
              disabled={disabled}
              value={(value as string | null) ?? ""}
              onValueChange={(v) => onChange(v)}
            >
              <CapsuleOption value="Male">Male</CapsuleOption>
              <CapsuleOption value="Female">Female</CapsuleOption>
            </Capsule>
          )}
        </CheckboxField>}

        {config.nationality && <CheckboxField
          form={form}
          name="nationality"
          label="Nationality"
          defaultEnabledValue="Local"
        >
          {({ value, disabled, onChange }) => (
            <Capsule
              disabled={disabled}
              value={(value as string | null) ?? ""}
              onValueChange={(v) => {
                onChange(v);
                if (v === "International") {
                  form.setFieldValue("ic", null);
                }
              }}
            >
              <CapsuleOption value="Local">Local</CapsuleOption>
              <CapsuleOption value="International">International</CapsuleOption>
            </Capsule>
          )}
        </CheckboxField>}
      </FormRow>

      <FormRow>
        {config.dob && <CheckboxField
          form={form}
          name="dob"
          label="Date of birth"
          defaultEnabledValue=""
        >
          {({ value, disabled, onChange, inputId }) => (
            <DatePicker
              id={inputId}
              disabled={disabled}
              value={value as string | null}
              onChange={(v) => onChange(v)}
            />
          )}
        </CheckboxField>}

        {config.ic && <CheckboxField
          form={form}
          name="ic"
          label="Identity Card"
          defaultEnabledValue=""
        >
          {({ value, disabled, onChange, onBlur, inputId }) => (
            <Input
              id={inputId}
              disabled={disabled}
              value={(value as string | null) ?? ""}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              clearable
            />
          )}
        </CheckboxField>}

        {config.passport && <CheckboxField
          form={form}
          name="passport"
          label="Passport"
          defaultEnabledValue=""
        >
          {({ value, disabled, onChange, onBlur, inputId }) => (
            <Input
              id={inputId}
              disabled={disabled}
              value={(value as string | null) ?? ""}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              clearable
            />
          )}
        </CheckboxField>}
      </FormRow>

      <FormRow>
        {config.contactNumber && <CheckboxField
          form={form}
          name="contactNumber"
          label="Contact number"
          defaultEnabledValue=""
        >
          {({ value, disabled, onChange, onBlur, inputId }) => (
            <Input
              id={inputId}
              type="tel"
              disabled={disabled}
              value={(value as string | null) ?? ""}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              clearable
            />
          )}
        </CheckboxField>}

        {config.email && <CheckboxField
          form={form}
          name="email"
          label="Email"
          defaultEnabledValue=""
        >
          {({ value, disabled, onChange, onBlur, inputId }) => (
            <Input
              id={inputId}
              type="email"
              disabled={disabled}
              value={(value as string | null) ?? ""}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              clearable
            />
          )}
        </CheckboxField>}
      </FormRow>

      <FormRow>
        {config.positions && <CheckboxField
          form={form}
          name="positionId"
          label="Position"
          defaultEnabledValue={0}
          labelExtras={
            <Button
              type="button"
              size="xs"
              onClick={() => setAddPositionOpen(true)}
            >
              <PlusIcon /> Add
            </Button>
          }
        >
          {({ value, disabled, onChange, inputId }) => (
            <Autocomplete<number>
              id={inputId}
              disabled={disabled || positions.length === 0}
              items={positions.map((p) => ({ value: p.id, label: p.name }))}
              value={typeof value === "number" && value > 0 ? value : null}
              onValueChange={(v) => onChange(v ?? 0)}
              placeholder={
                positions.length === 0
                  ? "No positions in this area"
                  : "Select position"
              }
              emptyMessage="No matching positions."
            />
          )}
        </CheckboxField>}

        {config.departments && <CheckboxField
          form={form}
          name="departmentId"
          label="Department"
          defaultEnabledValue={0}
          labelExtras={
            <Button
              type="button"
              size="xs"
              onClick={() => setAddDepartmentOpen(true)}
            >
              <PlusIcon /> Add
            </Button>
          }
        >
          {({ value, disabled, onChange, inputId }) => (
            <Autocomplete<number>
              id={inputId}
              disabled={disabled || departments.length === 0}
              items={departments.map((d) => ({ value: d.id, label: d.name }))}
              value={typeof value === "number" && value > 0 ? value : null}
              onValueChange={(v) => onChange(v ?? 0)}
              placeholder={
                departments.length === 0
                  ? "No departments in this area"
                  : "Select department"
              }
              emptyMessage="No matching departments."
            />
          )}
        </CheckboxField>}
      </FormRow>

      <FormRow>
        {config.totalAnnualLeave && <CheckboxField
          form={form}
          name="totalAnnualLeave"
          label="Total Annual Leave"
          defaultEnabledValue={0}
        >
          {({ value, disabled, onChange, onBlur, inputId }) => (
            <LeaveInput
              inputId={inputId}
              value={value}
              disabled={disabled}
              onChange={onChange}
              onBlur={onBlur}
            />
          )}
        </CheckboxField>}

        {config.totalSickLeave && <CheckboxField
          form={form}
          name="totalSickLeave"
          label="Total Sick Leave"
          defaultEnabledValue={0}
        >
          {({ value, disabled, onChange, onBlur, inputId }) => (
            <LeaveInput
              inputId={inputId}
              value={value}
              disabled={disabled}
              onChange={onChange}
              onBlur={onBlur}
            />
          )}
        </CheckboxField>}
      </FormRow>

      <FormRow>
        <div className="flex items-center gap-3">
          <Label className="shrink-0">Salary Information</Label>
          <SalaryDialogButton
            rates={rates}
            otherTypes={otherSalaryTypes}
            areaId={areaId}
          />
        </div>
      </FormRow>

      <FormRow>
        <div className="flex items-center gap-3">
          <Label className="shrink-0">Working Schedule</Label>
          <WorkingScheduleDialogButton defaults={scheduleDefaults} />
        </div>
      </FormRow>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={handleClear}>
          Clear form
        </Button>
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : "Create employee"}
        </Button>
      </div>

      <PositionSheet
        open={addPositionOpen}
        onOpenChange={(o) => {
          setAddPositionOpen(o);
          if (!o) router.refresh();
        }}
        areaId={areaId}
      />
      <DepartmentSheet
        open={addDepartmentOpen}
        onOpenChange={(o) => {
          setAddDepartmentOpen(o);
          if (!o) router.refresh();
        }}
        areaId={areaId}
      />
    </form>
  );
}
