export interface Branch {
  id: number;
  branchNameAr: string;
  branchNameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  mobileNo?: string;
  email?: string;
  address?: string;
  whatsUpNo?: string;
  latitute?: string;
  longtute?: string;
  createdAt: string;
  isAvailable: boolean;
  createdBy?: string;
  state?: boolean;
}

export interface CreateBranchRequest {
  branchNameAr: string;
  branchNameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  mobileNo?: string;
  email?: string;
  address?: string;
  whatsUpNo?: string;
  latitute?: string;
  longtute?: string;
  isAvailable: boolean;
}

export interface UpdateBranchRequest extends CreateBranchRequest {}
