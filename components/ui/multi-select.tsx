"use client";

import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { ChevronDownIcon } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type MultiSelectItem<V> = {
  value: V;
  label: string;
  disabled?: boolean;
};

type MultiSelectProps<V> = {
  items: ReadonlyArray<MultiSelectItem<V>>;
  value: V[];
  onValueChange: (value: V[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};

function MultiSelectInner<V>({
  items,
  value,
  onValueChange,
  placeholder = "Select...",
  emptyMessage = "No results.",
  disabled,
  id,
  className,
}: MultiSelectProps<V>) {
  const selectedItems = React.useMemo(
    () => items.filter((i) => value.some((v) => v === i.value)),
    [items, value],
  );

  const displayText = selectedItems.map((i) => i.label).join(", ");

  return (
    <ComboboxPrimitive.Root<MultiSelectItem<V>, true>
      multiple
      items={items}
      value={selectedItems}
      onValueChange={(picked) => onValueChange(picked.map((p) => p.value))}
      disabled={disabled}
    >
      <ComboboxPrimitive.Trigger
        id={id}
        className={cn(
          "flex h-8 w-84 items-center justify-between gap-2 rounded-lg border border-foreground bg-transparent px-2.5 py-1 text-left text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-input disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30",
          className,
        )}
      >
        <span
          className={cn(
            "flex-1 truncate",
            selectedItems.length === 0 && "text-muted-foreground",
          )}
        >
          {selectedItems.length === 0 ? placeholder : displayText}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </ComboboxPrimitive.Trigger>
      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner sideOffset={4} className="isolate z-50">
          <ComboboxPrimitive.Popup
            data-slot="multi-select-content"
            className="relative isolate z-50 max-h-(--available-height) min-w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          >
            <ComboboxPrimitive.Empty className="px-2 py-1.5 text-sm text-muted-foreground">
              {emptyMessage}
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List>
              {(item: MultiSelectItem<V>) => {
                const isChecked = value.some((v) => v === item.value);
                return (
                  <ComboboxPrimitive.Item
                    key={String(item.value)}
                    value={item}
                    disabled={item.disabled}
                    className="group/item flex cursor-default items-center gap-2 rounded-md px-2 py-1 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:text-muted-foreground"
                  >
                    <Checkbox
                      checked={isChecked}
                      tabIndex={-1}
                      className="pointer-events-none not-data-checked:border-foreground group-data-disabled/item:border-muted-foreground/40 group-data-disabled/item:bg-muted group-data-disabled/item:text-muted-foreground"
                    />
                    <span className="flex-1">{item.label}</span>
                  </ComboboxPrimitive.Item>
                );
              }}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  );
}

export { MultiSelectInner as MultiSelect };
export type { MultiSelectItem };
