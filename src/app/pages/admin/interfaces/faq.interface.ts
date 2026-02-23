export interface FAQ {
  id: number;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  order: number;
  isAvailable: boolean;
}

export interface CreateFAQRequest {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  order: number;
}

export interface UpdateFAQRequest {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  order: number;
  isAvailable: boolean;
}
