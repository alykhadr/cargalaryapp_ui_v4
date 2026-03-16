export interface PackageItem {
  id: number;
  nameAr: string;
  nameEn: string;
  imageUrl?: string;
  createdBy?: string;
  isAvailable: boolean;
}

export interface CreatePackageRequest {
  nameAr: string;
  nameEn: string;
  imageFile?: File;
}

export interface UpdatePackageRequest {
  nameAr: string;
  nameEn: string;
  isAvailable: boolean;
  imageFile?: File;
}

export interface BulkDeletePackagesResponse {
  deletedCount: number;
  failedIds: number[];
}
