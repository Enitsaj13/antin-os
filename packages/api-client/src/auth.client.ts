import type { AdminLoginInput, AdminSessionResponse } from '@antin-os/shared';
import { requestJson } from './http-client';

export function loginAdmin(
  input: AdminLoginInput,
): Promise<AdminSessionResponse> {
  return requestJson<AdminSessionResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function getAdminSession(): Promise<AdminSessionResponse> {
  return requestJson<AdminSessionResponse>('/auth/session');
}

export function logoutAdmin(): Promise<AdminSessionResponse> {
  return requestJson<AdminSessionResponse>('/auth/logout', {
    method: 'POST',
  });
}
