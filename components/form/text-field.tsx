"use client";

import * as React from "react";
import type { AnyFieldApi } from "@tanstack/react-form";

type FormWithField = {
  Field: React.ComponentType<{
    name: string;
    children: (field: AnyFieldApi) => React.ReactNode;
  }>;
};
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

function errorMessage(e: unknown): string | undefined {
  if (!e) return undefined;
  if (typeof e === "string") return e;
  if (typeof e === "object" && e !== null && "message" in e) {
    const m = (e as { message?: unknown }).message;
    return typeof m === "string" ? m : undefined;
  }
  return undefined;
}

export function TextField({
  form,
  name,
  label,
  description,
  type = "text",
  placeholder,
  required,
  clearable = true,
}: {
  form: FormWithField;
  name: string;
  label: string;
  description?: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  required?: boolean;
  clearable?: boolean;
}) {
  const FieldComp = form.Field;

  return (
    <FieldComp name={name}>
      {(field) => {
        const errors = (field.state.meta.errors ?? []) as unknown[];
        const errorList = errors
          .map((e) => ({ message: errorMessage(e) }))
          .filter((e) => e.message);
        return (
          <Field>
            <div className="flex items-center gap-2">
              <FieldLabel htmlFor={name}>
                {label}
                {required && <span className="text-destructive">*</span>}
              </FieldLabel>
              {errorList.length > 0 && (
                <FieldError className="m-0" errors={errorList} />
              )}
            </div>
            {description && <FieldDescription>{description}</FieldDescription>}
            <Input
              id={name}
              type={type}
              placeholder={placeholder}
              value={(field.state.value as string | undefined) ?? ""}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={() => field.handleBlur()}
              clearable={clearable}
            />
          </Field>
        );
      }}
    </FieldComp>
  );
}
