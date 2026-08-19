import { fetchApi } from "./api";
import { DashboardData, DashboardChartsData, FeedbackType, Alert } from "../types";

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    return fetchApi<DashboardData>("/dashboard");
  },

  async getChartData(): Promise<DashboardChartsData> {
    return fetchApi<DashboardChartsData>("/dashboard/charts");
  },

  async listAlerts(): Promise<Alert[]> {
    return fetchApi<Alert[]>("/alerts");
  },

  async submitAlertFeedback(alertId: string, feedback: FeedbackType): Promise<{ status: string; learned: boolean }> {
    return fetchApi<{ status: string; learned: boolean }>(`/alerts/${alertId}/feedback`, {
      method: "POST",
      body: JSON.stringify({ feedback }),
    });
  },
};
