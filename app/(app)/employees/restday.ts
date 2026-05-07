export const RESTDAY_VALUES = [
  "none",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export type RestdayValue = (typeof RESTDAY_VALUES)[number];
