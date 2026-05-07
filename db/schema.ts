import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  date,
  timestamp,
  primaryKey,
  pgEnum,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const nationalityEnum = pgEnum("nationality", ["local", "international"]);
export const genderEnum = pgEnum("gender", ["male", "female"]);
export const breakTypeEnum = pgEnum("break_type", ["30m", "1h", "2h", "none"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const areas = pgTable("areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userAreas = pgTable(
  "user_areas",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    areaId: integer("area_id")
      .notNull()
      .references(() => areas.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.areaId] })],
);

export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  areaId: integer("area_id")
    .notNull()
    .references(() => areas.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  areaId: integer("area_id")
    .notNull()
    .references(() => areas.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const areaSetting = pgTable("area_setting", {
  areaId: integer("area_id")
    .primaryKey()
    .references(() => areas.id, { onDelete: "cascade" }),
  otRate: real("ot_rate").notNull().default(1.5),
  rdRate: real("rd_rate").notNull().default(2),
  phRate: real("ph_rate").notNull().default(3),
});

export const employeeForm = pgTable("employee_form", {
  areaId: integer("area_id")
    .primaryKey()
    .references(() => areas.id, { onDelete: "cascade" }),
  dob: boolean("dob").notNull().default(false),
  gender: boolean("gender").notNull().default(false),
  positions: boolean("positions").notNull().default(false),
  nationality: boolean("nationality").notNull().default(false),
  ic: boolean("ic").notNull().default(false),
  passport: boolean("passport").notNull().default(false),
  departments: boolean("departments").notNull().default(false),
  contactNumber: boolean("contact_number").notNull().default(false),
  email: boolean("email").notNull().default(false),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  dob: date("dob"),
  gender: genderEnum("gender"),
  positionId: integer("position_id").references(() => positions.id, {
    onDelete: "set null",
  }),
  departmentId: integer("department_id").references(() => departments.id, {
    onDelete: "set null",
  }),
  ic: text("ic"),
  passport: text("passport"),
  nationality: nationalityEnum("nationality"),
  contactNumber: text("contact_number"),
  email: text("email"),
  restday: text("restday").array(),
  salaryType: text("salary_type"),
  salaryHour: real("salary_hour"),
  salaryDay: real("salary_day"),
  salaryMonth: real("salary_month"),
  salaryOther: text("salary_other"),
  breakType: breakTypeEnum("break_type"),
  mondayStart: text("monday_start"),
  mondayEnd: text("monday_end"),
  mondayBreak: text("monday_break"),
  tuesdayStart: text("tuesday_start"),
  tuesdayEnd: text("tuesday_end"),
  tuesdayBreak: text("tuesday_break"),
  wednesdayStart: text("wednesday_start"),
  wednesdayEnd: text("wednesday_end"),
  wednesdayBreak: text("wednesday_break"),
  thursdayStart: text("thursday_start"),
  thursdayEnd: text("thursday_end"),
  thursdayBreak: text("thursday_break"),
  fridayStart: text("friday_start"),
  fridayEnd: text("friday_end"),
  fridayBreak: text("friday_break"),
  saturdayStart: text("saturday_start"),
  saturdayEnd: text("saturday_end"),
  saturdayBreak: text("saturday_break"),
  sundayStart: text("sunday_start"),
  sundayEnd: text("sunday_end"),
  sundayBreak: text("sunday_break"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  userAreas: many(userAreas),
}));

export const areasRelations = relations(areas, ({ many, one }) => ({
  userAreas: many(userAreas),
  positions: many(positions),
  departments: many(departments),
  employeeForm: one(employeeForm, {
    fields: [areas.id],
    references: [employeeForm.areaId],
  }),
  areaSetting: one(areaSetting, {
    fields: [areas.id],
    references: [areaSetting.areaId],
  }),
}));

export const areaSettingRelations = relations(areaSetting, ({ one }) => ({
  area: one(areas, { fields: [areaSetting.areaId], references: [areas.id] }),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  area: one(areas, { fields: [departments.areaId], references: [areas.id] }),
  employees: many(employees),
}));

export const employeeFormRelations = relations(employeeForm, ({ one }) => ({
  area: one(areas, { fields: [employeeForm.areaId], references: [areas.id] }),
}));

export const userAreasRelations = relations(userAreas, ({ one }) => ({
  user: one(users, { fields: [userAreas.userId], references: [users.id] }),
  area: one(areas, { fields: [userAreas.areaId], references: [areas.id] }),
}));

export const positionsRelations = relations(positions, ({ one, many }) => ({
  area: one(areas, { fields: [positions.areaId], references: [areas.id] }),
  employees: many(employees),
}));

export const employeesRelations = relations(employees, ({ one }) => ({
  position: one(positions, {
    fields: [employees.positionId],
    references: [positions.id],
  }),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Area = typeof areas.$inferSelect;
export type Position = typeof positions.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type UserArea = typeof userAreas.$inferSelect;
export type EmployeeForm = typeof employeeForm.$inferSelect;
export type AreaSetting = typeof areaSetting.$inferSelect;
