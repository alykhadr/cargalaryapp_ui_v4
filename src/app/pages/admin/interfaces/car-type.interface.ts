export interface CarType {
  id: number;
  nameAr: string;
  nameEn: string;
  createdBy?: string;
  isAvailable: boolean;
}

export interface CreateCarTypeRequest {
  nameAr: string;
  nameEn: string;
}

export interface UpdateCarTypeRequest {
  nameAr: string;
  nameEn: string;
  isAvailable?: boolean;
}
