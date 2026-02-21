export interface Role {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  state:boolean
}

export interface CreateRoleRequest {
  name: string;
  isActive: boolean;
}

export interface UpdateRoleRequest {
  name: string;
  isActive: boolean;
}
