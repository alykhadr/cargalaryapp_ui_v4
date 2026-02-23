export interface MemberService {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string;
  isAvailable: boolean;
}

export interface CreateMemberServiceRequest {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageFile?: File;
}

export interface UpdateMemberServiceRequest {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  isAvailable: boolean;
  imageFile?: File;
}
