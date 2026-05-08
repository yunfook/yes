"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "theme-palette";

type Palette = { id: string; label: string; swatch: string; check: string };

const PALETTES: Palette[] = [
  { id: "default",  label: "Default",  swatch: "bg-neutral-900",  check: "text-white" },
  { id: "slate",    label: "Slate",    swatch: "bg-slate-600",    check: "text-white" },
  { id: "gray",     label: "Gray",     swatch: "bg-gray-600",     check: "text-white" },
  { id: "zinc",     label: "Zinc",     swatch: "bg-zinc-600",     check: "text-white" },
  { id: "red",      label: "Red",      swatch: "bg-red-600",      check: "text-white" },
  { id: "orange",   label: "Orange",   swatch: "bg-orange-600",   check: "text-white" },
  { id: "amber",    label: "Amber",    swatch: "bg-amber-500",    check: "text-neutral-900" },
  { id: "yellow",   label: "Yellow",   swatch: "bg-yellow-400",   check: "text-neutral-900" },
  { id: "lime",     label: "Lime",     swatch: "bg-lime-500",     check: "text-neutral-900" },
  { id: "green",    label: "Green",    swatch: "bg-green-600",    check: "text-white" },
  { id: "emerald",  label: "Emerald",  swatch: "bg-emerald-600",  check: "text-white" },
  { id: "teal",     label: "Teal",     swatch: "bg-teal-600",     check: "text-white" },
  { id: "cyan",     label: "Cyan",     swatch: "bg-cyan-600",     check: "text-white" },
  { id: "sky",      label: "Sky",      swatch: "bg-sky-600",      check: "text-white" },
  { id: "blue",     label: "Blue",     swatch: "bg-blue-600",     check: "text-white" },
  { id: "indigo",   label: "Indigo",   swatch: "bg-indigo-600",   check: "text-white" },
  { id: "violet",   label: "Violet",   swatch: "bg-violet-600",   check: "text-white" },
  { id: "purple",   label: "Purple",   swatch: "bg-purple-600",   check: "text-white" },
  { id: "fuchsia",  label: "Fuchsia",  swatch: "bg-fuchsia-600",  check: "text-white" },
  { id: "pink",     label: "Pink",     swatch: "bg-pink-600",     check: "text-white" },
  { id: "rose",     label: "Rose",     swatch: "bg-rose-600",     check: "text-white" },
];

function applyPalette(id: string) {
  const root = document.documentElement;
  if (id === "default") {
    delete root.dataset.palette;
    localStorage.removeItem(STORAGE_KEY);
  } else {
    root.dataset.palette = id;
    localStorage.setItem(STORAGE_KEY, id);
  }
}

export function ThemeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [current, setCurrent] = React.useState<string>("default");

  React.useEffect(() => {
    if (!open) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    setCurrent(stored ?? "default");
  }, [open]);

  const select = (id: string) => {
    applyPalette(id);
    setCurrent(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Theme palette</DialogTitle>
          <DialogDescription>
            Pick a primary color. Saved on this device.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-7 gap-2">
          {PALETTES.map((p) => {
            const active = current === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => select(p.id)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md transition outline-none",
                  p.swatch,
                  active
                    ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                    : "hover:scale-105",
                )}
                aria-label={p.label}
                aria-pressed={active}
                title={p.label}
              >
                {active && <CheckIcon className={cn("size-4", p.check)} />}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
