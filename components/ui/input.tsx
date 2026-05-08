"use client";

import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

const inputClass =
  "h-8 w-full min-w-0 rounded-lg border-[1.5px] border-foreground bg-transparent px-2.5 py-1 text-base transition-colors outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-input disabled:bg-input/50 disabled:opacity-50 read-only:border-input read-only:bg-muted/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:read-only:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

type InputProps = Omit<React.ComponentProps<"input">, "type"> & {
  type?: React.HTMLInputTypeAttribute | "money";
  clearable?: boolean;
};

function Input({ className, type, clearable = false, ...props }: InputProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const isMoney = type === "money";
  const showClear = clearable && !props.readOnly && !props.disabled;

  const clear = () => {
    const el = inputRef.current;
    if (!el) return;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(el, "");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.focus();
  };

  return (
    <div className={cn("relative w-full", className)}>
      {isMoney && (
        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs font-medium text-muted-foreground">
          RM
        </span>
      )}
      <InputPrimitive
        ref={inputRef}
        type={isMoney ? "number" : type}
        inputMode={isMoney ? "decimal" : undefined}
        step={isMoney ? "0.01" : undefined}
        min={isMoney ? 0 : undefined}
        data-slot="input"
        className={cn(inputClass, isMoney && "pl-9", showClear && "pr-9")}
        {...props}
      />
      {showClear && (
        <InputButton onClick={clear} aria-label="Clear">
          <RotateCcw className="size-3.5 text-muted-foreground" />
        </InputButton>
      )}
    </div>
  );
}

function InputButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const isEmpty = !children;
  return (
    <button
      type="button"
      data-slot="input-button"
      tabIndex={isEmpty ? -1 : undefined}
      aria-hidden={isEmpty || undefined}
      className={cn(
        "absolute top-1/2 right-1 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors disabled:pointer-events-none disabled:opacity-50",
        isEmpty ? "pointer-events-none" : "hover:bg-muted hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export { Input, InputButton };
