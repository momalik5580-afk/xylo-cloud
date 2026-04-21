"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

interface PriorityDistributionProps {
  data: Array<{ name: string; value: number }>
  isLoading?: boolean
}

const COLORS = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#3b82f6" }

export function PriorityDistribution({ data, isLoading }: PriorityDistributionProps) {
  if (isLoading) {
    return <div className="h-[200px] animate-pulse bg-slate-800/50 rounded-xl" />
  }

  const chartData = data.map(item => ({ name: item.name.charAt(0) + item.name.slice(1).toLowerCase(), value: item.value, color: COLORS[item.name as keyof typeof COLORS] || "#6b7280" }))
  const total = data.reduce((acc, item) => acc + item.value, 0)

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const p = payload[0]
                return (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-lg text-sm">
                    <p className="font-medium text-[#8E939D]">{p.name}</p>
                    <p className="text-slate-400">{p.value} tasks ({((p.value as number) / total * 100).toFixed(1)}%)</p>
                  </div>
                )
              }
              return null
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-3 mt-2 flex-wrap">
        {chartData.map(item => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-slate-400">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}