"use client";

import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type AutocompleteItem<V> = { value: V; label: string };

type AutocompleteProps<V> = {
  items: ReadonlyArray<AutocompleteItem<V>>;
  value: V | null;
  onValueChange: (value: V | null) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};

function Autocomplete<V>({
  items,
  value,
  onValueChange,
  placeholder = "Select...",
  emptyMessage = "No results.",
  disabled,
  id,
  className,
}: AutocompleteProps<V>) {
  return (
    <ComboboxPrimitive.Root<AutocompleteItem<V>>
      items={items}
      value={items.find((i) => i.value === value) ?? null}
      onValueChange={(item) => onValueChange(item?.value ?? null)}
      disabled={disabled}
      autoHighlight
    >
      <ComboboxPrimitive.Input
        id={id}
        placeholder={placeholder}
        className={cn(
          "flex h-8 w-full items-center rounded-lg border border-input bg-transparent py-2 pr-8 pl-2.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:hover:bg-input/50",
          className,
        )}
      />
      <ComboboxPrimitive.Trigger
        aria-label="Toggle"
        className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted-foreground"
      >
        <ChevronDownIcon className="size-4" />
      </ComboboxPrimitive.Trigger>
      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner
          sideOffset={4}
          className="isolate z-50"
        >
          <ComboboxPrimitive.Popup
            data-slot="autocomplete-content"
            className="relative isolate z-50 max-h-(--available-height) min-w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          >
            <ComboboxPrimitive.Empty className="px-2 py-1.5 text-sm text-muted-foreground empty:p-0">
              {emptyMessage}
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List>
              {(item: AutocompleteItem<V>) => (
                <ComboboxPrimitive.Item
                  key={String(item.value)}
                  value={item}
                  className="relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                >
                  <span className="flex-1">{item.label}</span>
                  <ComboboxPrimitive.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center">
                    <CheckIcon className="size-4" />
                  </ComboboxPrimitive.ItemIndicator>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  );
}

function AutocompleteWrapper<V>(props: AutocompleteProps<V>) {
  return (
    <div className="relative">
      <Autocomplete {...props} />
    </div>
  );
}

export { AutocompleteWrapper as Autocomplete };
export type { AutocompleteItem };
