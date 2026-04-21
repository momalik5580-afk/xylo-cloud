"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardsProps {
  data: { totalTasks: number; completedTasks: number; overdueTasks: number; highPriorityTasks: number; completionRate: number; avgResolutionTime: number };
  isLoading?: boolean;
}

export function KPICards({ data, isLoading }: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded mb-2" />
              <div className="h-3 w-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    { title: "Completion Rate", value: `${data.completionRate}%`, description: `${data.completedTasks} of ${data.totalTasks} tasks`, icon: CheckCircle2, color: "text-emerald-600", bgColor: "bg-emerald-50" },
    { title: "Overdue Tasks", value: data.overdueTasks, description: "Past due date", icon: AlertCircle, color: "text-red-600", bgColor: "bg-red-50" },
    { title: "High Priority", value: data.highPriorityTasks, description: "Pending urgent", icon: Clock, color: "text-amber-600", bgColor: "bg-amber-50" },
    { title: "Avg Resolution", value: `${data.avgResolutionTime}h`, description: "Time to complete", icon: Timer, color: "text-blue-600", bgColor: "bg-blue-50" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <div className={cn("p-2 rounded-lg", card.bgColor)}>
              <card.icon className={cn("h-4 w-4", card.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}