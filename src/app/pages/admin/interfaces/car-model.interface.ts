export interface CarModel {
  id: number;
  nameAr: string;
  nameEn: string;
  createdBy?: string;
  imageUrl?: string;
  isAvailable: boolean;
  brandId: number;
}

export interface CreateCarModelRequest {
  nameAr: string;
  nameEn: string;
  brandId: number;
  imageFile?: File;
}

export interface UpdateCarModelRequest {
  nameAr: string;
  nameEn: string;
  brandId: number;
  isAvailable?: boolean;
  imageFile?: File;
}
