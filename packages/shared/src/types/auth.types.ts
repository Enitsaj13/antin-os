export interface AdminSession {
  username: string;
}

export interface AdminLoginInput {
  username: string;
  password: string;
}

export interface AdminSessionResponse {
  authenticated: boolean;
  user: AdminSession | null;
}
