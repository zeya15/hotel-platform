const BASE = process.env.API_URL ?? "http://backend:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    ...init,
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export const apiServer = {
  getRoomTypes: (hotelId: number) =>
    apiFetch<any[]>(`/rooms/types?hotel_id=${hotelId}`),

  getRoomType: (roomTypeId: number) =>
    apiFetch<any>(`/rooms/types/${roomTypeId}`),

  getPlans: (hotelId: number) =>
    apiFetch<any[]>(`/plans?hotel_id=${hotelId}`),

  getAvailability: (params: Record<string, string | number>) => {
    const qs = new URLSearchParams(params as any).toString();
    return apiFetch<any[]>(`/availability?${qs}`);
  },
};
