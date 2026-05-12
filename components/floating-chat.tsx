"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  DownloadIcon,
  Loader2Icon,
  SendIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExportToolOutput = {
  data?: string;
  contentType?: string;
  filename?: string;
  rowCount?: number;
  salaryType?: string;
  areaName?: string;
  error?: string;
};

const EXPORT_TOOL_NAMES = new Set(["tool-exportEmployees"]);
const LOOKUP_TOOL_NAMES = new Set([
  "tool-lookupEmployees",
  "tool-calculateMonthlyPay",
  "tool-calculateExtraPay",
]);

const EXAMPLE_PROMPTS = [
  "Andy has 10 overtime hours, how much should I pay?",
  "How much will Amirul earn in March 2026?",
  "Export Excel of boilermen with their restday and hourly pay",
];

export function FloatingChat() {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const transport = React.useMemo(
    () =>
      new DefaultChatTransport({
        body: () => {
          const params = new URLSearchParams(window.location.search);
          const raw = params.get("area");
          const areaId = raw ? Number(raw) : null;
          return {
            areaId: Number.isFinite(areaId) ? areaId : null,
          };
        },
      }),
    [],
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    transport,
    experimental_throttle: 50,
  });

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 120) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, open]);

  const busy = status === "submitted" || status === "streaming";

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen((v) => !v)}
        size="icon"
        className={cn(
          "fixed right-4 bottom-4 z-50 h-12 w-12 rounded-full shadow-lg",
          "transition-transform hover:scale-105",
          open && "scale-90",
        )}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <XIcon className="size-5" />
        ) : (
          <SparklesIcon className="size-5" />
        )}
      </Button>

      {open && (
        <div
          className={cn(
            "fixed right-4 bottom-20 z-50 flex flex-col",
            "h-[min(600px,calc(100vh-6rem))] w-[min(400px,calc(100vw-2rem))]",
            "bg-background border-border rounded-lg border shadow-2xl",
          )}
          role="dialog"
          aria-label="HR assistant chat"
        >
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <SparklesIcon className="text-primary size-4" />
              <span className="text-sm font-medium">HR Assistant</span>
            </div>
            <span className="text-muted-foreground text-xs">
              {status === "streaming"
                ? "thinking…"
                : status === "submitted"
                  ? "sending…"
                  : "ready"}
            </span>
          </div>

          <div
            ref={scrollerRef}
            className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
          >
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground px-1 text-xs">
                  Ask me anything about HR. I can also export employee data,
                  salary breakdowns, and schedules to Excel.
                </p>
                {EXAMPLE_PROMPTS.map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => submit(p)}
                    className="bg-muted/50 hover:bg-muted block w-full rounded-md px-2 py-1.5 text-left text-xs"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {error.message}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="border-border flex items-center gap-2 border-t p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me to export Excel…"
              disabled={busy}
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring h-9 flex-1 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
            />
            {busy ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => stop()}
                aria-label="Stop"
              >
                <Loader2Icon className="size-4 animate-spin" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim()}
                aria-label="Send"
              >
                <SendIcon className="size-4" />
              </Button>
            )}
          </form>
        </div>
      )}
    </>
  );
}

const MessageBubble = React.memo(function MessageBubble({
  message,
}: {
  message: ReturnType<typeof useChat>["messages"][number];
}) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] space-y-2 rounded-lg px-3 py-2 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return <TextContent key={i} text={part.text} />;
          }
          if (EXPORT_TOOL_NAMES.has(part.type)) {
            return <ToolPart key={i} part={part as ToolPartLike} />;
          }
          if (LOOKUP_TOOL_NAMES.has(part.type)) {
            return <LookupPart key={i} part={part as ToolPartLike} />;
          }
          return null;
        })}
      </div>
    </div>
  );
});

type Block =
  | { kind: "para"; text: string }
  | { kind: "list"; items: string[] };

function parseTextBlocks(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let paraBuf: string[] = [];
  let listBuf: string[] = [];

  const flushPara = () => {
    if (paraBuf.length === 0) return;
    blocks.push({ kind: "para", text: paraBuf.join("\n") });
    paraBuf = [];
  };
  const flushList = () => {
    if (listBuf.length === 0) return;
    blocks.push({ kind: "list", items: listBuf });
    listBuf = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const m = line.match(/^\s*-\s+(.*)$/);
    if (m) {
      flushPara();
      listBuf.push(m[1]);
    } else {
      flushList();
      paraBuf.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}

function TextContent({ text }: { text: string }) {
  const blocks = React.useMemo(() => parseTextBlocks(text), [text]);
  return (
    <div className="space-y-1.5 leading-snug">
      {blocks.map((b, i) =>
        b.kind === "list" ? (
          <ul key={i} className="list-disc space-y-0.5 pl-4">
            {b.items.map((item, j) => (
              <li key={j} className="whitespace-pre-wrap">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className="whitespace-pre-wrap">
            {b.text}
          </p>
        ),
      )}
    </div>
  );
}

type ToolPartLike = {
  type: string;
  state?: string;
  output?: unknown;
  errorText?: string;
};

function ToolPart({ part }: { part: ToolPartLike }) {
  const label = labelForTool(part.type);
  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <Loader2Icon className="size-3 animate-spin" />
        Preparing {label}…
      </div>
    );
  }
  if (part.state === "output-error") {
    return (
      <div className="text-xs text-red-600">
        {part.errorText ?? `Failed to build ${label}`}
      </div>
    );
  }
  if (part.state === "output-available") {
    const out = part.output as ExportToolOutput;
    if (out?.error) {
      return <div className="text-xs text-red-600">{out.error}</div>;
    }
    if (!out?.data || !out.filename) return null;
    return (
      <div className="space-y-1">
        <div className="text-xs opacity-80">
          {label} · {out.rowCount ?? 0} rows
        </div>
        <button
          type="button"
          onClick={() => triggerDownload(out)}
          className="bg-background text-foreground hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium"
        >
          <DownloadIcon className="size-3" />
          {out.filename}
        </button>
      </div>
    );
  }
  return null;
}

function triggerDownload(out: ExportToolOutput) {
  if (!out.data || !out.filename) return;
  const binary = atob(out.data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], {
    type:
      out.contentType ??
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = out.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function labelForTool(type: string) {
  switch (type) {
    case "tool-exportEmployees":
      return "Excel export";
    default:
      return "export";
  }
}

function LookupPart({ part }: { part: ToolPartLike }) {
  const isMonthlyCalc = part.type === "tool-calculateMonthlyPay";
  const isExtraCalc = part.type === "tool-calculateExtraPay";
  if (part.state !== "output-available") {
    const label = isMonthlyCalc
      ? "Calculating monthly pay…"
      : isExtraCalc
        ? "Calculating multiplier pay…"
        : "Looking up employees…";
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <Loader2Icon className="size-3 animate-spin" />
        {label}
      </div>
    );
  }
  if (isMonthlyCalc) {
    const out = part.output as {
      period?: string;
      totalPay?: number | null;
      totalHours?: number;
      workingDays?: number;
    };
    if (!out || (out.totalPay == null && !out.period)) return null;
    return (
      <div className="text-muted-foreground text-[10px] opacity-70">
        Calculated {out.period}: {out.workingDays} working days,{" "}
        {out.totalHours} hrs
      </div>
    );
  }
  if (isExtraCalc) {
    const out = part.output as {
      ok?: boolean;
      label?: string;
      hours?: number;
      multiplier?: number;
      totalPay?: number;
    };
    if (!out?.ok) return null;
    return (
      <div className="text-muted-foreground text-[10px] opacity-70">
        {out.label} · {out.hours}hr × {out.multiplier}x = {out.totalPay}
      </div>
    );
  }
  const out = part.output as { totalMatching?: number; returned?: number };
  return (
    <div className="text-muted-foreground text-[10px] opacity-70">
      Looked up {out?.returned ?? 0} of {out?.totalMatching ?? 0} matching
      employees
    </div>
  );
}
