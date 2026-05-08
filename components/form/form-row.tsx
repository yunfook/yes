import * as React from "react";
import { cn } from "@/lib/utils";

export function FormRow({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const hasChild = React.Children.toArray(children).some(Boolean);
  if (!hasChild) return null;
  return (
    <div
      data-slot="form-row"
      className={cn("flex gap-5 [&>*]:flex-1", className)}
      {...props}
    >
      {children}
    </div>
  );
}
