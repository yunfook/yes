"use client";

import { create } from "zustand";
import type { WorkingScheduleValue } from "@/components/working-schedule-dialog";

type WorkingScheduleState = {
  schedule: WorkingScheduleValue | null;
  setSchedule: (value: WorkingScheduleValue | null) => void;
  reset: () => void;
};

export const useWorkingScheduleStore = create<WorkingScheduleState>((set) => ({
  schedule: null,
  setSchedule: (schedule) => set({ schedule }),
  reset: () => set({ schedule: null }),
}));
