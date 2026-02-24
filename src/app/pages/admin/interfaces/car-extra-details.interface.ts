export interface CarExtraDetails {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionEn?: string;
  descriptionAr?: string;
  createdBy?: string;
  isAvailable: boolean;
  carId: number;
}

export interface CreateCarExtraDetailsRequest {
  nameAr: string;
  nameEn: string;
  descriptionEn?: string;
  descriptionAr?: string;
  carId: number;
}

export interface UpdateCarExtraDetailsRequest {
  nameAr: string;
  nameEn: string;
  descriptionEn?: string;
  descriptionAr?: string;
  carId: number;
  isAvailable?: boolean;
}

export interface BulkDeleteCarExtraDetailsRequest {
  ids: number[];
}
