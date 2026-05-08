"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { TextField } from "@/components/form/text-field";
import { createUser, updateUser } from "./actions";
import { emailToUsername } from "@/lib/user-email";
import type { UserItem } from "./users-table";
import type { AnyFieldApi } from "@tanstack/react-form";

const Schema = z.object({
  username: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(120),
  password: z.string(),
  isAdmin: z.boolean(),
  areaIds: z.array(z.number().int().positive()),
});

export function UserSheet({
  open,
  onOpenChange,
  existing,
  areas,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: UserItem;
  areas: { id: number; name: string }[];
}) {
  const isEdit = !!existing;
  const form = useForm({
    defaultValues: {
      username: existing ? emailToUsername(existing.email) : "",
      name: existing?.name ?? "",
      password: "",
      isAdmin: existing?.isAdmin ?? false,
      areaIds: existing?.areas.map((a) => a.id) ?? [],
    },
    validators: { onChange: Schema },
    onSubmit: async ({ value }) => {
      try {
        if (isEdit) {
          await updateUser(existing!.id, value);
        } else {
          if (!value.password || value.password.length < 6) {
            toast.error("Password is required (min 6 chars) for new users.");
            return;
          }
          await createUser({ ...value, password: value.password });
        }
        toast.success(isEdit ? "User updated" : "User created");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        username: existing ? emailToUsername(existing.email) : "",
        name: existing?.name ?? "",
        password: "",
        isAdmin: existing?.isAdmin ?? false,
        areaIds: existing?.areas.map((a) => a.id) ?? [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existing?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "New user"}</DialogTitle>
          <DialogDescription>
            Super admins automatically see all areas; regular users only see
            areas explicitly assigned below.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex max-h-[60vh] flex-1 flex-col gap-4 overflow-y-auto"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <TextField form={form} name="username" label="Username" required />
          <TextField form={form} name="name" label="Name" required />
          <TextField
            form={form}
            name="password"
            label={isEdit ? "Password (leave blank to keep)" : "Password"}
            type="password"
            required={!isEdit}
          />

          <form.Field name="isAdmin">
            {(field: AnyFieldApi) => (
              <Field>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isAdmin"
                    checked={Boolean(field.state.value)}
                    onCheckedChange={(c) => field.handleChange(Boolean(c))}
                  />
                  <FieldLabel htmlFor="isAdmin">Super admin</FieldLabel>
                </div>
              </Field>
            )}
          </form.Field>

          <form.Subscribe selector={(s) => s.values.isAdmin}>
            {(isAdmin) =>
              isAdmin ? null : (
                <form.Field name="areaIds">
                  {(field: AnyFieldApi) => {
                    const selected = (field.state.value as number[]) ?? [];
                    const toggle = (id: number, on: boolean) => {
                      const next = on
                        ? [...selected, id]
                        : selected.filter((x) => x !== id);
                      field.handleChange(next);
                    };
                    return (
                      <Field>
                        <FieldLabel>Assigned areas</FieldLabel>
                        <div className="flex flex-col gap-2 rounded-md border p-3">
                          {areas.length === 0 && (
                            <span className="text-sm text-muted-foreground">
                              No areas exist yet.
                            </span>
                          )}
                          {areas.map((a) => (
                            <label
                              key={a.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Checkbox
                                checked={selected.includes(a.id)}
                                onCheckedChange={(c) => toggle(a.id, Boolean(c))}
                              />
                              {a.name}
                            </label>
                          ))}
                        </div>
                      </Field>
                    );
                  }}
                </form.Field>
              )
            }
          </form.Subscribe>
        </form>
        <DialogFooter>
          <Button
            type="button"
            disabled={form.state.isSubmitting}
            onClick={() => void form.handleSubmit()}
          >
            {form.state.isSubmitting ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
