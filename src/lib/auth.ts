export interface CRMUser {
  id: string; username: string; email: string; firstName: string; lastName: string;
  role: 'ADMIN' | 'EMPLOYEE'; avatar?: string; mustChangePassword: boolean;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('crm_token');
}

export function getUser(): CRMUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('crm_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function setAuth(token: string, user: CRMUser) {
  localStorage.setItem('crm_token', token);
  localStorage.setItem('crm_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('crm_token');
  localStorage.removeItem('crm_user');
}

export function isAdmin(): boolean { return getUser()?.role === 'ADMIN'; }
export function isEmployee(): boolean { return getUser()?.role === 'EMPLOYEE'; }
