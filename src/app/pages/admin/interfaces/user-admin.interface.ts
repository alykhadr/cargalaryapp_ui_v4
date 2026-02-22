export interface AdminUser {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  isLocked: boolean;
  createdAt: string;
}

export interface CreateAdminUserRequest {
  email: string;
  userName: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: string[];
}
