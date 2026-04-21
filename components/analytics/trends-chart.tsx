"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format, parseISO } from "date-fns"

interface TrendsChartProps {
  data: Array<{ date: string; created: number; completed: number }>
  isLoading?: boolean
}

export function TrendsChart({ data, isLoading }: TrendsChartProps) {
  if (isLoading) {
    return <div className="h-[300px] animate-pulse bg-slate-800/50 rounded-xl" />
  }

  const formattedData = data.map(item => ({ ...item, displayDate: format(parseISO(item.date), "MMM dd") }))

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
          <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} interval="preserveStartEnd" />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <Tooltip 
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
            content={({ active, payload }) => {
              if (active && payload) {
                return (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
                    <p className="font-semibold text-[#8E939D] mb-2">{payload[0]?.payload.displayDate}</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-blue-400">Created: {payload[0]?.value}</p>
                      <p className="text-emerald-400">Completed: {payload[1]?.value}</p>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-slate-400">Created</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-slate-400">Completed</span></div>
      </div>
    </div>
  )
}