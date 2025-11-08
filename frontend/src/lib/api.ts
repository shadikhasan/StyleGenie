const DEFAULT_BASE_URL = "https://stylegenie-backend.up.railway.app";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || DEFAULT_BASE_URL;

export type UserRole = "client" | "stylist";

export interface AuthTokens {
  access: string;
  refresh: string;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  data?: unknown;
  token?: string | null;
  rawBody?: BodyInit | null;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const { data, token, headers, rawBody, ...rest } = options;
  const finalHeaders = new Headers(headers);

  let body: BodyInit | undefined;

  if (rawBody) {
    body = rawBody;
  } else if (data instanceof FormData) {
    body = data;
  } else if (data !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
    body = JSON.stringify(data);
  }

  if (token) {
    finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body,
  });

  const text = await response.text();
  let parsed: unknown = null;

  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const message =
      (parsed &&
        typeof parsed === "object" &&
        "detail" in parsed &&
        typeof (parsed as { detail?: string }).detail === "string"
        ? (parsed as { detail: string }).detail
        : response.statusText || "Request failed");

    throw new ApiError(response.status, message, parsed);
  }

  return parsed as T;
}
