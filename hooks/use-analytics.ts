// src/hooks/use-analytics.ts
import { useState, useEffect } from 'react';

export interface AnalyticsData {
  overview: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    highPriorityTasks: number;
    completionRate: number;
    avgResolutionTime: number;
  };
  tasksByDepartment: Array<{
    name: string;
    total: number;
    completed: number;
    overdue: number;
    completionRate: number;
  }>;
  taskTrends: Array<{
    date: string;
    created: number;
    completed: number;
  }>;
  priorityDistribution: Array<{
    name: string;
    value: number;
  }>;
  topPerformers: Array<{
    name: string;
    department: string;
    image?: string;
    completedTasks: number;
  }>;
}

export function useAnalytics(range: string = 'week') {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        // Mock data for now - replace with actual API call later
        setTimeout(() => {
          setData({
            overview: {
              totalTasks: 45,
              completedTasks: 32,
              overdueTasks: 5,
              highPriorityTasks: 8,
              completionRate: 71,
              avgResolutionTime: 4.5
            },
            tasksByDepartment: [
              { name: 'Housekeeping', total: 15, completed: 12, overdue: 1, completionRate: 80 },
              { name: 'Engineering', total: 12, completed: 8, overdue: 2, completionRate: 67 },
              { name: 'F&B', total: 10, completed: 7, overdue: 1, completionRate: 70 },
              { name: 'Security', total: 8, completed: 5, overdue: 1, completionRate: 63 }
            ],
            taskTrends: [
              { date: 'Mon', created: 8, completed: 6 },
              { date: 'Tue', created: 12, completed: 9 },
              { date: 'Wed', created: 10, completed: 8 },
              { date: 'Thu', created: 15, completed: 12 },
              { date: 'Fri', created: 9, completed: 7 },
              { date: 'Sat', created: 5, completed: 4 },
              { date: 'Sun', created: 3, completed: 3 }
            ],
            priorityDistribution: [
              { name: 'Critical', value: 3 },
              { name: 'High', value: 8 },
              { name: 'Medium', value: 18 },
              { name: 'Low', value: 16 }
            ],
            topPerformers: [
              { name: 'John Davis', department: 'Engineering', completedTasks: 15 },
              { name: 'Sarah Kim', department: 'Housekeeping', completedTasks: 14 },
              { name: 'Mike Roberts', department: 'Engineering', completedTasks: 12 },
              { name: 'Emma Wilson', department: 'F&B', completedTasks: 10 }
            ]
          });
          setIsLoading(false);
        }, 500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [range]);

  return { data, isLoading, error };
}

export function useTasksAnalytics() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasksAnalytics = async () => {
      try {
        setIsLoading(true);
        // Mock data for tasks analytics
        setTimeout(() => {
          setData({
            status: {
              OPEN: 12,
              IN_PROGRESS: 18,
              URGENT: 5,
              READY: 8,
              CLOSED: 32,
              CANCELLED: 2
            },
            priority: {
              LOW: 16,
              MEDIUM: 24,
              HIGH: 12,
              CRITICAL: 5
            },
            trend: {
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              created: [8, 12, 10, 15, 9, 5, 3],
              completed: [6, 9, 8, 12, 7, 4, 3]
            }
          });
          setIsLoading(false);
        }, 500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setIsLoading(false);
      }
    };

    fetchTasksAnalytics();
  }, []);

  return { data, isLoading, error };
}