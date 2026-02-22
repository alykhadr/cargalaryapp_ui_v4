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
  branchWorkingDaysResponseDtos?: BranchWorkingDay[];
}

export interface BranchWorkingDay {
  id?: number;
  dayEn: string;
  dayAr: string;
  isAvailable: boolean;
  workingFrom?: number | null;
  workingTo?: number | null;
  timeType?: string;
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
  createBranchWorkingDaysRequestDto?: CreateBranchWorkingDay[];
}

export interface UpdateBranchRequest {
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
  createBranchWorkingDaysRequestDto?: CreateBranchWorkingDay[];
}

export interface CreateBranchWorkingDay {
  isAvailable?: boolean;
  dayAr?: string;
  dayEn?: string;
  workingFrom?: number;
  workingTo?: number;
  timeType?: string;
}
