"use client";

import * as React from "react";
import type { AnyFieldApi } from "@tanstack/react-form";

type FormWithField = {
  Field: React.ComponentType<{
    name: string;
    children: (field: AnyFieldApi) => React.ReactNode;
  }>;
};
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

type RenderArgs = {
  field: AnyFieldApi;
  disabled: boolean;
  inputId: string;
  value: unknown;
  onChange: (next: unknown) => void;
  onBlur: () => void;
};

export type CheckboxFieldProps = {
  form: FormWithField;
  name: string;
  label: string;
  description?: string;
  defaultEnabledValue?: unknown;
  labelExtras?: React.ReactNode;
  children: (args: RenderArgs) => React.ReactNode;
};

function errorMessage(e: unknown): string | undefined {
  if (!e) return undefined;
  if (typeof e === "string") return e;
  if (typeof e === "object" && e !== null && "message" in e) {
    const m = (e as { message?: unknown }).message;
    return typeof m === "string" ? m : undefined;
  }
  return undefined;
}

export function CheckboxField({
  form,
  name,
  label,
  description,
  defaultEnabledValue = "",
  labelExtras,
  children,
}: CheckboxFieldProps) {
  const FieldComp = form.Field;

  return (
    <FieldComp name={name}>
      {(field) => {
        const v = field.state.value;
        const enabled = v !== null && v !== undefined;
        const cbId = `${name}-toggle`;
        const inputId = `${name}-input`;
        const errors = (field.state.meta.errors ?? []) as unknown[];

        const onToggle = (next: boolean) => {
          field.handleChange(next ? defaultEnabledValue : null);
        };

        const errorList = errors
          .map((e) => ({ message: errorMessage(e) }))
          .filter((e) => e.message);
        return (
          <Field data-disabled={!enabled}>
            <div className="flex items-center gap-2">
              <Checkbox
                id={cbId}
                checked={enabled}
                onCheckedChange={(c) => onToggle(Boolean(c))}
                className="not-data-checked:border-foreground"
              />
              <FieldLabel
                htmlFor={enabled ? inputId : cbId}
                className="cursor-pointer"
              >
                {label}
              </FieldLabel>
              {enabled && labelExtras}
              {enabled && errorList.length > 0 && (
                <FieldError className="m-0" errors={errorList} />
              )}
            </div>
            {description && <FieldDescription>{description}</FieldDescription>}
            <div className={enabled ? "" : "pointer-events-none opacity-50"}>
              {children({
                field,
                disabled: !enabled,
                inputId,
                value: v,
                onChange: (next) => field.handleChange(next),
                onBlur: () => field.handleBlur(),
              })}
            </div>
          </Field>
        );
      }}
    </FieldComp>
  );
}
