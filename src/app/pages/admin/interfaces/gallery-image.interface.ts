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
  modelId: number;
  typeId: number;
  year: number;
  price: number;
  isAvailable: boolean;
  modelNameEn?: string;
  modelNameAr?: string;
}
