import * as React from "react";
import { cn } from "@/lib/utils";

export function FormRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="form-row"
      className={cn("flex gap-5 [&>*]:flex-1", className)}
      {...props}
    />
  );
}
