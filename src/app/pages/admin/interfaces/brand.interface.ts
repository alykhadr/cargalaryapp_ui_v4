export interface Brand {
  id: number;
  nameAr: string;
  nameEn: string;
  isAvailable?: boolean;
  imageUrl?: string;
  createdBy?: string;
}

export interface CreateBrandRequest {
  nameAr: string;
  nameEn: string;
  imageFile?: File;
}

export interface UpdateBrandRequest {
  nameAr: string;
  nameEn: string;
  imageFile?: File;
}
