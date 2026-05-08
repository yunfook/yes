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
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
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
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const config: ChartConfig = {
    count: { label: "Employees", color: "var(--primary)" },
  };
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

function PieChartCard({ title, data }: { title: string; data: ChartDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const config: ChartConfig = {
    count: { label: "Employees" },
    ...Object.fromEntries(
      data.map((d, i) => [
        d.label,
        { label: d.label, color: PIE_COLORS[i % PIE_COLORS.length] },
      ]),
    ),
  };
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
          <ChartContainer
            config={config}
            className="h-[260px] w-full [&_.recharts-pie-label-line]:stroke-primary [&_.recharts-pie-label-text]:fill-primary"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel className="text-primary" />}
              />
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                outerRadius={90}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {data.map((_, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={PIE_COLORS[i % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardCharts({ data }: { data: DashboardData }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <BarChartCard title="Gender" data={data.gender} />
      <BarChartCard title="Nationality" data={data.nationality} />
      <PieChartCard title="Positions" data={data.positions} />
      <PieChartCard title="Departments" data={data.departments} />
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
