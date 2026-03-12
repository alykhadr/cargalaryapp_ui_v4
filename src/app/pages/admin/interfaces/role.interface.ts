export interface Role {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  state:boolean
}

export interface RoleUser {
  id: string;
  username: string;
  email: string;
  nameEn: string;
  nameAr: string;
}

export interface CreateRoleRequest {
  name: string;
  isActive: boolean;
}

export interface UpdateRoleRequest {
  name: string;
  isActive: boolean;
}
