import { fetchApi } from "./api";
import { AgentEvent } from "../types";

export const agentEventsService = {
  async listEvents(limit = 50, agentName?: string): Promise<AgentEvent[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (agentName) params.set("agent_name", agentName);
    return fetchApi<AgentEvent[]>(`/agent-events?${params.toString()}`);
  },

  async getCycleEvents(requestId: string): Promise<AgentEvent[]> {
    return fetchApi<AgentEvent[]>(`/agent-events/cycle/${requestId}`);
  },
};
