"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { MultiSelect } from "@/components/ui/multi-select";
import {
  createEmployee,
  updateEmployee,
  type EmployeeFormConfig,
  type EmployeeRow,
} from "./actions";
import { RESTDAY_VALUES, type RestdayValue } from "./restday";
import { useSalaryStore } from "./salary-store";
import { SalaryDialogButton } from "./salary-dialog-button";
import { Label } from "@/components/ui/label";
import type { SalaryRates } from "@/components/salary-dialog";

const NullableNonEmpty = z
  .string()
  .trim()
  .min(1, "Required when checked")
  .nullable();

const Schema = z.object({
  name: z.string().trim().min(1, "Required").max(120),
  dob: NullableNonEmpty,
  gender: z.enum(["male", "female"]).nullable(),
  positionId: z.number().int().positive("Required when checked").nullable(),
  departmentId: z
    .number()
    .int()
    .positive("Required when checked")
    .nullable(),
  ic: NullableNonEmpty,
  passport: NullableNonEmpty,
  nationality: z.enum(["local", "international"]).nullable(),
  restday: z
    .array(z.enum(RESTDAY_VALUES))
    .min(1, "Required when checked")
    .nullable(),
});

type FormValues = z.infer<typeof Schema>;

export function EmployeeForm({
  areaId,
  positions,
  departments,
  config,
  rates,
  existing,
}: {
  areaId: number;
  positions: { id: number; name: string }[];
  departments: { id: number; name: string }[];
  config: EmployeeFormConfig;
  rates: SalaryRates;
  existing?: EmployeeRow;
}) {
  const router = useRouter();
  const isEdit = !!existing;
  const setSalary = useSalaryStore((s) => s.setSalary);
  const resetSalary = useSalaryStore((s) => s.reset);

  React.useEffect(() => {
    if (existing?.salaryType) {
      setSalary({
        type: existing.salaryType,
        hour: existing.salaryHour,
        day: existing.salaryDay,
        month: existing.salaryMonth,
      });
    } else {
      resetSalary();
    }
    return () => resetSalary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  const initial: FormValues = {
    name: existing?.name ?? "",
    dob: existing?.dob ?? null,
    gender: existing?.gender ?? null,
    positionId: existing?.positionId ?? null,
    departmentId: existing?.departmentId ?? null,
    ic: existing?.ic ?? null,
    passport: existing?.passport ?? null,
    nationality: existing?.nationality ?? null,
    restday: existing?.restday ?? null,
  };

  const form = useForm({
    defaultValues: initial,
    validators: { onChange: Schema },
    onSubmit: async ({ value }) => {
      try {
        const salary = useSalaryStore.getState().salary;
        const payload = { ...value, salary };
        if (isEdit) await updateEmployee(existing!.id, areaId, payload);
        else await createEmployee(areaId, payload);
        toast.success(isEdit ? "Employee updated" : "Employee created");
        router.push(`/employees?area=${areaId}`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FormRow>
        <TextField form={form} name="name" label="Name" required />

        {config.gender && <CheckboxField
          form={form}
          name="gender"
          label="Gender"
          defaultEnabledValue="male"
        >
          {({ value, disabled, onChange }) => (
            <Capsule
              disabled={disabled}
              value={(value as string | null) ?? ""}
              onValueChange={(v) => onChange(v)}
            >
              <CapsuleOption value="male">Male</CapsuleOption>
              <CapsuleOption value="female">Female</CapsuleOption>
            </Capsule>
          )}
        </CheckboxField>}

        {config.nationality && <CheckboxField
          form={form}
          name="nationality"
          label="Nationality"
          defaultEnabledValue="local"
        >
          {({ value, disabled, onChange }) => (
            <Capsule
              disabled={disabled}
              value={(value as string | null) ?? ""}
              onValueChange={(v) => onChange(v)}
            >
              <CapsuleOption value="local">Local</CapsuleOption>
              <CapsuleOption value="international">International</CapsuleOption>
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
              placeholder="e.g. 900512-10-1234"
              disabled={disabled}
              value={(value as string | null) ?? ""}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
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
              placeholder="e.g. P12345678"
              disabled={disabled}
              value={(value as string | null) ?? ""}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
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

      {config.restday && <CheckboxField
        form={form}
        name="restday"
        label="Rest day"
        defaultEnabledValue={[] as RestdayValue[]}
      >
        {({ value, disabled, onChange, inputId }) => {
          const selected = (value as RestdayValue[] | null) ?? [];
          const hasNone = selected.includes("none");
          const items: { value: RestdayValue; label: string; disabled?: boolean }[] = [
            { value: "none", label: "No Restday" },
            { value: "monday", label: "Monday", disabled: hasNone },
            { value: "tuesday", label: "Tuesday", disabled: hasNone },
            { value: "wednesday", label: "Wednesday", disabled: hasNone },
            { value: "thursday", label: "Thursday", disabled: hasNone },
            { value: "friday", label: "Friday", disabled: hasNone },
            { value: "saturday", label: "Saturday", disabled: hasNone },
            { value: "sunday", label: "Sunday", disabled: hasNone },
          ];
          return (
            <MultiSelect<RestdayValue>
              id={inputId}
              disabled={disabled}
              items={items}
              value={selected}
              onValueChange={(next) => {
                const justAddedNone =
                  next.includes("none") && !selected.includes("none");
                onChange(justAddedNone ? ["none"] : next);
              }}
              placeholder="Pick rest days"
              emptyMessage="No matching options."
            />
          );
        }}
      </CheckboxField>}

      <FormRow>
        <div className="flex flex-col gap-1.5">
          <Label>Salary Information</Label>
          <SalaryDialogButton rates={rates} />
        </div>
      </FormRow>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : "Create employee"}
        </Button>
        <Button
          type="button"
          variant="outline"
          render={<Link href={`/employees?area=${areaId}`} />}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
