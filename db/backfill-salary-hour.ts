import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, isNotNull, isNull, sql } from "drizzle-orm";
import * as schema from "./schema";
import { employees } from "./schema";

const DAYS_PER_MONTH = 26;
const HOURS_PER_DAY = 8;

const neonSql = neon(process.env.DATABASE_URL!);
const db = drizzle(neonSql, { schema });

async function main() {
  const result = await db
    .update(employees)
    .set({
      salaryHour: sql`${employees.salaryMonth} / ${DAYS_PER_MONTH} / ${HOURS_PER_DAY}`,
    })
    .where(
      and(
        isNotNull(employees.salaryMonth),
        isNull(employees.salaryHour),
        isNull(employees.deletedAt),
      ),
    )
    .returning({
      id: employees.id,
      name: employees.name,
      salaryMonth: employees.salaryMonth,
      salaryHour: employees.salaryHour,
    });

  console.log(`Backfilled salary_hour for ${result.length} employee(s):`);
  for (const r of result) {
    console.log(
      `  #${r.id} ${r.name}: month=${r.salaryMonth} → hour=${r.salaryHour}`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
