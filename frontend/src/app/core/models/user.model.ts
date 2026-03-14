export type UserRole = 'physician' | 'nurse' | 'technician' | 'admin';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  specialtyId?: string;
  organizationId: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
