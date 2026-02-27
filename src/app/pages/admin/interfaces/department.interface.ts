export interface Department {
  id: number;
  nameAr: string;
  nameEn: string;
  createdBy?: string;
  createdAt: string;
  isAvailable: boolean;
}

export interface CreateDepartmentRequest {
  nameAr: string;
  nameEn: string;
  isAvailable?: boolean;
}

export interface UpdateDepartmentRequest {
  nameAr: string;
  nameEn: string;
  isAvailable?: boolean;
}
