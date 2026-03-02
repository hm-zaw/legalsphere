const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  Success?: boolean;
  Message?: string;
}

export interface Case {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  progress: number;
  submittedDate: string;
  lastUpdated: string;
  lawyer: string;
  amount: string;
  description?: string;
  client?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface CasesResponse {
  cases: Case[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export type CaseStage =
  | "discovery"
  | "pleadings"
  | "pre_trial"
  | "trial"
  | "settlement"
  | "appeal";

export interface CourtEvent {
  id: string;
  case_id: string;
  lawyer_id: string;
  client_id: string;
  title: string;
  event_type: "hearing" | "trial_date" | "deadline";
  scheduled_at: string;
  location: string;
  notes: string;
}

export interface LawyerCalendarEvent {
  source: "appointment" | "court_event";
  id: string;
  case_id?: string;
  client_id?: string;
  lawyer_id?: string;
  title: string;
  event_type: string;
  scheduled_at: string;
  location?: string;
  notes?: string;
}

class ApiClient {
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Try to get token from localStorage (client-side only)
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("adminToken") ||
        localStorage.getItem("lawyerToken") ||
        localStorage.getItem("token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async getBackend<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error:
            data.error ||
            data.Message ||
            `HTTP error! status: ${response.status}`,
        };
      }

      return { data };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      // Use relative URL for Next.js API routes, absolute for Flask backend
      const isNextJsApi = endpoint.startsWith("/api/");
      const url = isNextJsApi ? endpoint : `${API_BASE_URL}${endpoint}`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error:
            data.error ||
            data.Message ||
            `HTTP error! status: ${response.status}`,
        };
      }

      return { data };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  }

  async patch<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`,
        {
          method: "PATCH",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          error:
            data.error ||
            data.Message ||
            `HTTP error! status: ${response.status}`,
        };
      }

      return { data };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  }

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error:
            data.error ||
            data.Message ||
            `HTTP error! status: ${response.status}`,
        };
      }

      return { data };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  }

  // Specific methods for case management
  async getMyCases(
    page = 1,
    limit = 10,
    status?: string,
  ): Promise<ApiResponse<CasesResponse>> {
    // Get user data from localStorage to get clientId
    let clientId = "";
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("userData");
      if (userData) {
        const parsed = JSON.parse(userData);
        const user = Array.isArray(parsed) ? parsed[0] : parsed;
        // Try different possible ID fields; fall back to email for older sessions.
        clientId =
          user?.email ||
          user?.client?.email ||
          user?.id ||
          user?.clientId ||
          user?.userId ||
          user?._id ||
          user?.client?.id ||
          "";
        console.log(
          "Extracted client identifier:",
          clientId,
          "from user data:",
          user,
        );
      }
    }

    if (!clientId) {
      console.error("No client ID found in user data");
      return { error: "Client ID not found. Please log in again." };
    }

    const params = new URLSearchParams({
      clientId,
      limit: limit.toString(),
    });

    // Use Next.js API endpoint instead of Flask backend
    return this.get<CasesResponse>(`/api/case-requests?${params.toString()}`);
  }

  async getCaseDetails(caseId: string): Promise<ApiResponse<Case>> {
    try {
      const url = `${API_BASE_URL}/api/case-requests/${caseId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error:
            data.error ||
            data.Message ||
            `HTTP error! status: ${response.status}`,
        };
      }

      return { data };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  }

  async submitCase(caseData: any): Promise<ApiResponse<any>> {
    return this.post<any>("/api/case-requests", caseData);
  }

  async getCaseCourtEvents(caseId: string): Promise<ApiResponse<{ events: CourtEvent[] }>> {
    return this.getBackend<{ success: boolean; events: CourtEvent[]; count: number }>(
      `/api/cases/${caseId}/court-events`,
    ) as any;
  }

  async updateCaseStage(caseId: string, caseStage: CaseStage): Promise<ApiResponse<any>> {
    return this.patch(`/api/lawyer/cases/${caseId}/stage`, { caseStage });
  }

  async getLawyerCalendar(start_date: string, end_date: string): Promise<ApiResponse<{ events: LawyerCalendarEvent[] }>> {
    const params = new URLSearchParams({ start_date, end_date });
    return this.getBackend<{ success: boolean; events: LawyerCalendarEvent[] }>(
      `/api/lawyer/calendar?${params.toString()}`,
    ) as any;
  }

  async createCourtEvent(payload: {
    case_id: string;
    client_id: string;
    title: string;
    event_type: "hearing" | "trial_date" | "deadline";
    scheduled_at: string;
    location?: string;
    notes?: string;
  }): Promise<ApiResponse<{ event: CourtEvent }>> {
    return this.post(`/api/lawyer/court-events`, payload) as any;
  }

  async getLawyerCases(status = 'active'): Promise<ApiResponse<{ cases: Case[] }>> {
    const params = new URLSearchParams({ status });
    return this.getBackend<{ cases: Case[] }>(
      `/api/lawyer/cases?${params.toString()}`,
    ) as any;
  }

  async getCaseAppointments(caseId: string): Promise<ApiResponse<{ appointments: any[] }>> {
    return this.getBackend<{ success: boolean; appointments: any[]; count: number }>(
      `/api/appointments/case/${caseId}`,
    ) as any;
  }

  async getLawyerDashboard(): Promise<ApiResponse<{
    summary: { incomingCases: number; activeCases: number; completedCases: number; totalCases: number };
    recentCases: { id: string; title: string; status: string; clientName: string; updatedAt: string }[];
  }>> {
    return this.getBackend(`/api/lawyer/dashboard`) as any;
  }

  async getRecentChats(): Promise<ApiResponse<any>> {
    return this.getBackend(`/chats`) as any;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
