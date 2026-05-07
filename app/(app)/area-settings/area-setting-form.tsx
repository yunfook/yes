"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateAreaSetting, type AreaSettingValues } from "./actions";

const Schema = z.object({
  otRate: z.number().nonnegative("Must be ≥ 0"),
  rdRate: z.number().nonnegative("Must be ≥ 0"),
  phRate: z.number().nonnegative("Must be ≥ 0"),
});

type RateKey = keyof AreaSettingValues;

const FIELDS: { key: RateKey; label: string; description: string }[] = [
  { key: "otRate", label: "Overtime rate", description: "Multiplier for overtime hours." },
  { key: "rdRate", label: "Rest day rate", description: "Multiplier for rest day work." },
  { key: "phRate", label: "Public holiday rate", description: "Multiplier for public holiday work." },
];

export function AreaSettingForm({
  areaId,
  initial,
}: {
  areaId: number;
  initial: AreaSettingValues;
}) {
  const form = useForm({
    defaultValues: initial,
    validators: { onChange: Schema },
    onSubmit: async ({ value }) => {
      try {
        await updateAreaSetting(areaId, value);
        toast.success("Settings saved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    },
  });

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Rates</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          {FIELDS.map((f) => (
            <form.Field key={f.key} name={f.key}>
              {(field) => {
                const errs = (field.state.meta.errors ?? []) as Array<{
                  message?: string;
                }>;
                return (
                  <Field>
                    <FieldLabel htmlFor={f.key}>{f.label}</FieldLabel>
                    <Input
                      id={f.key}
                      type="number"
                      min={0}
                      step="0.01"
                      value={
                        Number.isFinite(field.state.value)
                          ? String(field.state.value)
                          : ""
                      }
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        field.handleChange(Number.isFinite(n) ? n : 0);
                      }}
                      onBlur={() => field.handleBlur()}
                    />
                    <FieldDescription>{f.description}</FieldDescription>
                    {errs.length > 0 && (
                      <FieldError errors={errs.map((e) => ({ message: e.message }))} />
                    )}
                  </Field>
                );
              }}
            </form.Field>
          ))}

          <div className="flex items-center gap-2 pt-2">
            <Button type="submit" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
