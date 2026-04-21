import useSWR from "swr";

interface AnalyticsData {
  overview: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    highPriorityTasks: number;
    completionRate: number;
    avgResolutionTime: number;
  };
  tasksByDepartment: Array<{ name: string; total: number; completed: number; overdue: number; completionRate: number }> | null;
  taskTrends: Array<{ date: string; created: number; completed: number }>;
  priorityDistribution: Array<{ name: string; value: number }>;
  topPerformers: Array<{ name: string; department: string; image: string | null; completedTasks: number }>;
  dateRange: { start: Date; end: Date };
}

export function useAnalytics(range: "day" | "week" | "month" = "week") {
  const { data, error, isLoading, mutate } = useSWR<AnalyticsData>(
    `/api/analytics/dashboard?range=${range}`,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  return { data, isLoading, isError: error, mutate };
}