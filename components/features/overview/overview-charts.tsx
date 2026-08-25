"use client"

import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { StatusDistributionItem, TrendPoint } from "@/types/qa"

const distributionConfig = {
  PASS: { label: "Passed", color: "var(--success)" },
  FAIL: { label: "Failed", color: "var(--destructive)" },
  BLOCKED: { label: "Blocked", color: "var(--warning)" },
  SKIPPED: { label: "Skipped", color: "var(--muted-foreground)" },
} satisfies ChartConfig

const trendConfig = {
  passed: { label: "Passed", color: "var(--success)" },
  failed: { label: "Failed", color: "var(--destructive)" },
  blocked: { label: "Blocked", color: "var(--warning)" },
} satisfies ChartConfig

export function StatusDistributionChart({
  data,
}: {
  data: StatusDistributionItem[]
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <ChartContainer
        config={distributionConfig}
        className="aspect-auto h-48 min-h-0 w-full"
      >
        <PieChart accessibilityLayer>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            innerRadius={48}
            outerRadius={72}
            stroke="var(--background)"
            strokeWidth={2}
          >
            {data.map((item) => (
              <Cell key={item.status} fill={`var(--color-${item.status})`} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
          <text
            x="50%"
            y="48%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-lg font-semibold"
          >
            842
          </text>
          <text
            x="50%"
            y="59%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground text-xs"
          >
            Tested
          </text>
        </PieChart>
      </ChartContainer>
      <ul className="flex flex-col gap-3 text-xs">
        {data.map((item) => (
          <li
            key={item.status}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-2"
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: `var(--color-${item.status})` }}
            />
            <span>{distributionConfig[item.status].label}</span>
            <span className="text-muted-foreground tabular-nums">
              {item.count} ({item.percentage}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function TestingTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ChartContainer
      config={trendConfig}
      className="aspect-auto h-48 min-h-0 w-full"
    >
      <LineChart
        data={data}
        margin={{ left: -20, right: 8, top: 8, bottom: 0 }}
        accessibilityLayer
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="passed"
          stroke="var(--color-passed)"
          strokeWidth={2}
          dot={{ r: 2 }}
        />
        <Line
          type="monotone"
          dataKey="failed"
          stroke="var(--color-failed)"
          strokeWidth={2}
          dot={{ r: 2 }}
        />
        <Line
          type="monotone"
          dataKey="blocked"
          stroke="var(--color-blocked)"
          strokeWidth={2}
          dot={{ r: 2 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
