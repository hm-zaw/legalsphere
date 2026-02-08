"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";

import { analyticsData } from "@/lib/data";

/* ---------------- Colors ---------------- */
const COLORS = {
  cases: "#2563eb",        // blue-600
  hours: "#16a34a",        // green-600
  consultation: "#6366f1", // indigo-500
  litigation: "#ef4444",   // red-500
  contracts: "#f59e0b",    // amber-500
  realEstate: "#0ea5e9",   // sky-500
};

/* ---------------- Chart Configs ---------------- */
const chartConfig: ChartConfig = {
  cases: {
    label: "Cases",
    color: COLORS.cases,
  },
  hours: {
    label: "Hours",
    color: COLORS.hours,
  },
};

const revenueChartConfig = {
  revenue: {
    label: "Revenue",
  },
  Consultation: {
    label: "Consultation",
    color: COLORS.consultation,
  },
  Litigation: {
    label: "Litigation",
    color: COLORS.litigation,
  },
  Contracts: {
    label: "Contracts",
    color: COLORS.contracts,
  },
  "Real Estate": {
    label: "Real Estate",
    color: COLORS.realEstate,
  },
} satisfies ChartConfig;

/* ---------------- Component ---------------- */
export function AnalyticsCharts() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
      {/* -------- Case Volume -------- */}
      <Card className="lg:col-span-2 xl:col-span-1">
        <CardHeader>
          <CardTitle>Case Volume</CardTitle>
          <CardDescription>Last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <LineChart data={analyticsData.caseVolume} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="cases"
                stroke={COLORS.cases}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* -------- Billable Hours -------- */}
      <Card className="lg:col-span-2 xl:col-span-1">
        <CardHeader>
          <CardTitle>Billable Hours</CardTitle>
          <CardDescription>Last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={analyticsData.billableHours}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Bar
                dataKey="hours"
                fill={COLORS.hours}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* -------- Revenue by Practice Area -------- */}
      <Card className="flex flex-col lg:col-span-2 xl:col-span-1">
        <CardHeader className="items-center pb-0">
          <CardTitle>Revenue by Practice Area</CardTitle>
          <CardDescription>January – June 2024</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={revenueChartConfig}
            className="mx-auto aspect-square h-full max-h-[300px]"
          >
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={analyticsData.revenue}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                strokeWidth={2}
              >
                {analyticsData.revenue.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.name === "Consultation"
                        ? COLORS.consultation
                        : entry.name === "Litigation"
                        ? COLORS.litigation
                        : entry.name === "Contracts"
                        ? COLORS.contracts
                        : COLORS.realEstate
                    }
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
