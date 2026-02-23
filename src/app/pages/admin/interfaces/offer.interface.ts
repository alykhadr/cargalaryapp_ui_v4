export interface Offer {
  id: number;
  offerImageUrl: string;
  offerNameAr: string;
  offerNameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  expiredAt: Date;
  isAvailable: boolean;
}

export interface CreateOfferRequest {
  offerNameAr: string;
  offerNameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  expiredAt: Date;
  imageFile?: File;
}

export interface UpdateOfferRequest {
  offerNameAr: string;
  offerNameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  expiredAt: Date;
  isAvailable: boolean;
  imageFile?: File;
}
