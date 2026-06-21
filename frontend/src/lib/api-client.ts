const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

class ApiClient {
  private getToken(): string | null {
    try {
      const state = JSON.parse(localStorage.getItem("auth-storage") ?? "{}");
      return state?.state?.token ?? null;
    } catch {
      return null;
    }
  }

  async request<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const res = await fetch(`${BASE}/api/v1${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(error.detail ?? "Request failed");
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  get<T = unknown>(path: string) {
    return this.request<T>(path, { method: "GET" });
  }

  post<T = unknown>(path: string, body: unknown) {
    return this.request<T>(path, { method: "POST", body: JSON.stringify(body) });
  }

  patch<T = unknown>(path: string, body: unknown) {
    return this.request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
  }
}

export const apiClient = new ApiClient();
