export interface GalleryImage {
  id: number;
  carId: number;
  imageUrl: string;
  imageType?: number;
  isPrimary: boolean;
  isAvailable: boolean;
  createdBy?: string;
}

export interface CreateGalleryImageRequest {
  carId: number;
  imageFile: File;
  imageType?: number;
  isPrimary: boolean;
}

export interface UpdateGalleryImageRequest {
  carId: number;
  imageFile?: File;
  imageType?: number;
  isPrimary: boolean;
}

export interface Car {
  id: number;
  nameAr?: string;
  nameEn?: string;
  modelId: number;
  typeId: number;
  branchId?: number;
  year: number;
  mileage: number;
  descriptionAr?: string;
  descriptionEn?: string;
  createdBy?: string;
  isAvailable: boolean;
  modelNameEn?: string;
  modelNameAr?: string;
}
