export interface AspNetUser {
  id: string;
  userName: string;
  email: string;
  fullNameEn?: string;
  fullNameAr?: string;
  nameEn?: string;
  nameAr?: string;
  mobileNo?: string;
  branchId: number;
  branchName?: string;
  profileImageUrl?: string;
  isLocked: boolean;
  createdAt: string;
}

export interface UpdateAspNetUserRequest {
  userName: string;
  email: string;
  nameEn: string;
  nameAr: string;
  branchId: number;
}
