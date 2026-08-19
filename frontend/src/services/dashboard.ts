import { fetchApi } from "./api";
import { DashboardData } from "../types";

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    return fetchApi<DashboardData>("/dashboard");
  },
};
