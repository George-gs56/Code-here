const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('codesphere_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('codesphere_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('codesphere_token');
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data: any = {};
  const responseText = await response.text();
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { error: responseText };
    }
  }

  if (!response.ok) {
    const errorMessage = data.error || data.message || `Server error (${response.status}: ${response.statusText})`;
    throw new Error(errorMessage);
  }

  return data as T;
}
