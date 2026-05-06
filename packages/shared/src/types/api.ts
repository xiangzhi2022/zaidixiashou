export interface ApiErrorPayload {
  code: string;
  message: string;
  detail?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T | null;
  error: ApiErrorPayload | null;
  requestId: string;
}

export interface HealthResponse {
  status: 'ok';
}

