const API_BASE_URL = "/api/v1";

export interface ApiError {
  message: string;
  status: number;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("hims_auth_token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const errorJson = (await response.json()) as { message?: string; error?: string };
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      // Body is not JSON
    }
    const err: ApiError = {
      message: errorMessage,
      status: response.status,
    };
    throw err;
  }

  return response.json() as Promise<T>;
}
