export interface Service {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  discount: number;
  isPercentage: boolean;
  serviceImageUrl?: string;
  isAvailable: boolean;
}

export interface CreateServiceRequest {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  discount: number;
  isPercentage: boolean;
  imageFile?: File;
}

export interface UpdateServiceRequest {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  discount: number;
  isPercentage: boolean;
  imageFile?: File;
  isAvailable?: boolean;
}

export interface BulkDeleteResponse {
  deletedCount: number;
  failedIds: number[];
}
