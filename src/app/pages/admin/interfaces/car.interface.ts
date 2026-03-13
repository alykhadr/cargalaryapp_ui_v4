export interface Car {
  id: number;
  nameAr?: string;
  nameEn?: string;
  modelId: number;
  typeId: number;
  branchId: number;
  year: number;
  mileage: number;
  vat: number;
  conditionId: number;
  seatingCapacity: number;
  weelSizeInch: string;
  fuelTankCapacityLiter: number;
  trimLevel: number;
  vehicleClass: number;
  plateNumberAr: string;
  plateNumberEn: string;
  transmisionType: number;
  drivetrain: number;
  cylenders: number;
  fuelType: number;
  manufactureCountryId: number;
  enginNumber: string;
  descriptionAr?: string;
  descriptionEn?: string;
  createdAt?: string;
  createdBy?: string;
  isAvailable: boolean;
}

export interface CarImage {
  id: number;
  carId: number;
  imageUrl?: string;
  imageType?: number;
  isPrimary: boolean;
  createdBy?: string;
  isAvailable: boolean;
}

export interface CreateCarRequest {
  nameAr?: string;
  nameEn?: string;
  modelId: number;
  typeId: number;
  branchId: number;
  year: number;
  mileage: number;
  vat: number;
  conditionId: number;
  seatingCapacity: number;
  weelSizeInch: string;
  fuelTankCapacityLiter: number;
  trimLevel: number;
  vehicleClass: number;
  plateNumberAr: string;
  plateNumberEn: string;
  transmisionType: number;
  drivetrain: number;
  cylenders: number;
  fuelType: number;
  manufactureCountryId: number;
  enginNumber: string;
  descriptionAr?: string;
  descriptionEn?: string;
}

export interface CreateCarWithDetailsFeatureItem {
  featureId: number;
  isAvailable?: boolean;
}

export interface CreateCarWithDetailsColorItem {
  colorId: number;
  colorStatus: number;
  stockQuantity?: number | null;
  colorImageUrl?: string;
  pricingPerColor?: number | null;
  pricePefore?: number | null;
  vatAmount?: number | null;
  discount?: number | null;
  discountType?: number | null;
  isAvailable?: boolean;
}

export interface CreateCarWithDetailsExtraDetailItem {
  nameAr?: string;
  nameEn?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  carExtraDetailsType: number;
  isAvailable?: boolean;
}

export interface CreateCarWithDetailsGalleryImageMetaItem {
  fileName?: string;
  imageType?: number | null;
  isPrimary?: boolean;
}

export interface CreateCarWithDetailsCarColorImageMetaItem {
  colorId: number;
  fileName?: string;
}

export interface CreateCarWithDetailsRequest extends CreateCarRequest {
  features?: CreateCarWithDetailsFeatureItem[];
  carColors?: CreateCarWithDetailsColorItem[];
  extraDetails?: CreateCarWithDetailsExtraDetailItem[];
  galleryImages?: File[];
  galleryImagesMeta?: CreateCarWithDetailsGalleryImageMetaItem[];
  carColorImageFiles?: File[];
  carColorImagesMeta?: CreateCarWithDetailsCarColorImageMetaItem[];
}

export interface UpdateCarRequest {
  nameAr?: string;
  nameEn?: string;
  modelId: number;
  typeId: number;
  branchId: number;
  year: number;
  mileage: number;
  vat: number;
  conditionId: number;
  seatingCapacity: number;
  weelSizeInch: string;
  fuelTankCapacityLiter: number;
  trimLevel: number;
  vehicleClass: number;
  plateNumberAr: string;
  plateNumberEn: string;
  transmisionType: number;
  drivetrain: number;
  cylenders: number;
  fuelType: number;
  manufactureCountryId: number;
  enginNumber: string;
  descriptionAr?: string;
  descriptionEn?: string;
  isAvailable?: boolean;
}

export interface BulkDeleteCarsRequest {
  carIds: number[];
}

export interface BulkDeleteCarsResponse {
  deletedCount: number;
  failedIds: number[];
}
