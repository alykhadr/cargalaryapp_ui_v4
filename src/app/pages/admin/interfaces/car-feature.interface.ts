export interface CarFeature {
  id: number;
  nameAr: string;
  nameEn: string;
  isAvailable: boolean;
}

export interface CreateCarFeatureRequest {
  nameAr: string;
  nameEn: string;
}

export interface UpdateCarFeatureRequest {
  nameAr: string;
  nameEn: string;
  isAvailable: boolean;
}

export interface CarCarFeature {
  carId: number;
  featureId: number;
  isAvailable: boolean;
  createdBy?: string | null;
  createdAt?: string | null;
}

export interface AssignCarFeatureRequest {
  featureId: number;
  isAvailable: boolean;
}
