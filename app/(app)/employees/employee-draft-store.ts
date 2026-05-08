"use client";

import { create } from "zustand";
import type { SalaryValue } from "@/components/salary-dialog";
import type { WorkingScheduleValue } from "@/components/working-schedule-dialog";

export type EmployeeDraftValues = {
  name: string;
  dob: string | null;
  gender: "Male" | "Female" | null;
  positionId: number | null;
  departmentId: number | null;
  ic: string | null;
  passport: string | null;
  nationality: "Local" | "International" | null;
  contactNumber: string | null;
  email: string | null;
  totalAnnualLeave: number | null;
  totalSickLeave: number | null;
};

export const EMPTY_DRAFT_VALUES: EmployeeDraftValues = {
  name: "",
  dob: null,
  gender: null,
  positionId: null,
  departmentId: null,
  ic: null,
  passport: null,
  nationality: null,
  contactNumber: null,
  email: null,
  totalAnnualLeave: null,
  totalSickLeave: null,
};

type EmployeeDraftState = {
  values: EmployeeDraftValues;
  salary: SalaryValue | null;
  schedule: WorkingScheduleValue | null;
  setValues: (values: EmployeeDraftValues) => void;
  setSalary: (value: SalaryValue | null) => void;
  setSchedule: (value: WorkingScheduleValue | null) => void;
  reset: () => void;
};

export const useEmployeeDraftStore = create<EmployeeDraftState>((set) => ({
  values: EMPTY_DRAFT_VALUES,
  salary: null,
  schedule: null,
  setValues: (values) => set({ values }),
  setSalary: (salary) => set({ salary }),
  setSchedule: (schedule) => set({ schedule }),
  reset: () =>
    set({ values: EMPTY_DRAFT_VALUES, salary: null, schedule: null }),
}));
