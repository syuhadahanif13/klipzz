import { supabase } from './supabaseClient';

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || '/api'
).replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Calls the Express API with the current Supabase access token.
 * Sensitive writes must never go directly to Supabase from the browser.
 */
export async function apiFetch<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new ApiError('Sesi login tidak ditemukan. Silakan masuk kembali.', 401);
  }

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${session.access_token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('Tidak dapat menghubungi server API. Periksa koneksi kamu.', 0);
  }

  const text = await response.text();
  let payload: any = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text };
    }
  }

  if (!response.ok) {
    throw new ApiError(
      payload.error || payload.message || `Permintaan gagal (${response.status}).`,
      response.status,
      payload.code
    );
  }

  return payload as T;
}
