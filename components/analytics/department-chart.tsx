"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface DepartmentChartProps {
  data: Array<{ name: string; total: number; completed: number; overdue: number; completionRate: number }>
  isLoading?: boolean
}

export function DepartmentChart({ data, isLoading }: DepartmentChartProps) {
  if (isLoading) {
    return <div className="h-[300px] animate-pulse bg-slate-800/50 rounded-xl" />
  }

  const chartData = data.map(dept => ({ name: dept.name.split(" ")[0], total: dept.total, completed: dept.completed, overdue: dept.overdue, rate: dept.completionRate }))
  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"]

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <Tooltip 
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9" }}
            itemStyle={{ color: "#f1f5f9" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload
                return (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
                    <p className="font-semibold text-[#8E939D] mb-2">{d.name}</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-emerald-400">Completed: {d.completed}</p>
                      <p className="text-blue-400">Total: {d.total}</p>
                      <p className="text-red-400">Overdue: {d.overdue}</p>
                      <p className="text-slate-400">Rate: {d.rate}%</p>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
            {chartData.map((_, i) => <Cell key={i} fill={colors[i % 5]} />)}
          </Bar>
          <Bar dataKey="overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-slate-400">Completed</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-slate-400">Overdue</span></div>
      </div>
    </div>
  )
}