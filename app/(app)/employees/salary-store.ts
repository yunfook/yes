"use client";

import { create } from "zustand";
import type { SalaryValue } from "@/components/salary-dialog";

type SalaryState = {
  salary: SalaryValue | null;
  setSalary: (value: SalaryValue | null) => void;
  reset: () => void;
};

export const useSalaryStore = create<SalaryState>((set) => ({
  salary: null,
  setSalary: (salary) => set({ salary }),
  reset: () => set({ salary: null }),
}));
