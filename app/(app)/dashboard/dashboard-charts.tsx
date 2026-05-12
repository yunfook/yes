"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  Sector,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type ChartDatum = { label: string; count: number };
export type RestdayDatum = { day: string; working: number; resting: number };

export type DashboardData = {
  gender: ChartDatum[];
  nationality: ChartDatum[];
  positions: ChartDatum[];
  departments: ChartDatum[];
  salaryType: ChartDatum[];
  restday: RestdayDatum[];
};

const PIE_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f97316",
  "#a855f7",
  "#ec4899",
  "#eab308",
  "#14b8a6",
  "#ef4444",
  "#6366f1",
  "#06b6d4",
  "#84cc16",
  "#f43f5e",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#0ea5e9",
  "#d946ef",
  "#65a30d",
  "#dc2626",
  "#0891b2",
];

const RESTDAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
  none: "None",
};

const SALARY_LABELS: Record<string, string> = {
  hour: "Hour rate",
  monthly: "Monthly paid",
  "Not set": "Not set",
};

function EmptyState() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-primary">
      No data
    </div>
  );
}

function BarChartCard({
  title,
  data,
  formatLabel,
}: {
  title: string;
  data: ChartDatum[];
  formatLabel?: (label: string) => string;
}) {
  const chartData = data.map((d) => ({
    ...d,
    display: formatLabel ? formatLabel(d.label) : d.label,
  }));
  const config: ChartConfig = {
    count: { label: "Employees", color: "var(--primary)" },
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <EmptyState />
        ) : (
          <ChartContainer config={config} className="h-[220px] w-full">
            <BarChart
              data={chartData}
              margin={{ top: 16, right: 8, left: 8, bottom: 8 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="display"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis allowDecimals={false} hide />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={6}
                maxBarSize={36}
              >
                <LabelList
                  dataKey="count"
                  position="top"
                  className="fill-foreground"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function PieChartCard({
  title,
  data,
  count,
}: {
  title: string;
  data: ChartDatum[];
  count?: number;
}) {
  const total = count ?? data.length;
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(
    undefined,
  );
  const config: ChartConfig = {
    count: { label: "Employees" },
    ...Object.fromEntries(
      data.map((d, i) => [
        d.label,
        { label: d.label, color: PIE_COLORS[i % PIE_COLORS.length] },
      ]),
    ),
  };
  const sum = data.reduce((acc, d) => acc + d.count, 0);
  const active = activeIndex !== undefined ? data[activeIndex] : undefined;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{title}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {total}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="-ml-2 flex h-[340px] min-w-0 gap-2">
            <ul
              className="legend-scroll w-44 shrink-0 space-y-0.5 overflow-y-scroll pr-1 text-xs"
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              {data.map((d, i) => {
                const color = PIE_COLORS[i % PIE_COLORS.length];
                return (
                  <li
                    key={d.label}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      "flex cursor-pointer items-center gap-1.5 rounded px-1 py-1 transition-colors",
                      activeIndex === i ? "bg-muted" : "hover:bg-muted/50",
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="flex-1 truncate" title={d.label}>
                      {d.label}
                    </span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {d.count}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="flex min-w-0 flex-1 flex-col items-center">
              <div className="pointer-events-none flex h-12 w-full max-w-[340px] flex-col items-center justify-center text-center">
                {active && (
                  <>
                    <span className="max-w-full truncate text-xs text-muted-foreground">
                      {active.label}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold text-primary">
                        {active.count}
                      </span>
                      {sum > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {((active.count / sum) * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
              <ChartContainer
                config={config}
                className="aspect-square h-[calc(100%-3rem)] w-full max-w-[292px] [&_.recharts-pie-label-line]:stroke-primary [&_.recharts-pie-label-text]:fill-primary"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent hideLabel className="text-primary" />
                    }
                  />
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="label"
                    outerRadius="95%"
                    activeShape={(props: React.ComponentProps<typeof Sector>) => {
                      const base =
                        typeof props.outerRadius === "number"
                          ? props.outerRadius
                          : 0;
                      return (
                        <Sector
                          {...props}
                          outerRadius={base ? base + 6 : props.outerRadius}
                        />
                      );
                    }}
                  >
                    {data.map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                        opacity={
                          activeIndex === undefined || activeIndex === i
                            ? 1
                            : 0.35
                        }
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardCharts({
  data,
  deptTotal,
  posTotal,
}: {
  data: DashboardData;
  deptTotal?: number;
  posTotal?: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <BarChartCard title="Gender" data={data.gender} />
      <BarChartCard title="Nationality" data={data.nationality} />
      <PieChartCard title="Positions" data={data.positions} count={posTotal} />
      <PieChartCard
        title="Departments"
        data={data.departments}
        count={deptTotal}
      />
      <PieChartCard
        title="Salary type"
        data={data.salaryType.map((d) => ({
          ...d,
          label: SALARY_LABELS[d.label] ?? d.label,
        }))}
      />
      <RestdayChartCard data={data.restday} />
    </div>
  );
}

function RestdayChartCard({ data }: { data: RestdayDatum[] }) {
  const chartData = data.map((d) => ({
    ...d,
    display: RESTDAY_LABELS[d.day] ?? d.day,
  }));
  const config: ChartConfig = {
    working: { label: "Working", color: "var(--chart-3)" },
    resting: { label: "Resting", color: "var(--chart-5)" },
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule chart</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <EmptyState />
        ) : (
          <ChartContainer config={config} className="h-[220px] w-full">
            <BarChart
              data={chartData}
              margin={{ top: 16, right: 8, left: 8, bottom: 8 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="display"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis allowDecimals={false} hide />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar
                dataKey="working"
                stackId="a"
                fill="var(--color-working)"
                maxBarSize={48}
                radius={[0, 0, 6, 6]}
              />
              <Bar
                dataKey="resting"
                stackId="a"
                fill="var(--color-resting)"
                maxBarSize={48}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
