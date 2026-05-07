"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "@/lib/utils";

function Capsule({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="capsule"
      className={cn("inline-flex w-fit shrink-0", className)}
      {...props}
    />
  );
}

function CapsuleOption({
  className,
  children,
  ...props
}: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="capsule-option"
      className={cn(
        "relative inline-flex h-8 cursor-pointer items-center justify-center whitespace-nowrap border border-input bg-muted px-3 text-sm font-medium text-muted-foreground transition-colors outline-none -ml-px first-of-type:ml-0 first-of-type:rounded-l-lg last-of-type:rounded-r-lg not-data-checked:hover:bg-background not-data-checked:hover:text-foreground disabled:pointer-events-none disabled:opacity-50 focus-visible:z-10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:z-10 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-checked:hover:bg-primary/90 dark:bg-input/50 dark:not-data-checked:hover:bg-input/30",
        className,
      )}
      {...props}
    >
      {children}
    </RadioPrimitive.Root>
  );
}

export { Capsule, CapsuleOption };
