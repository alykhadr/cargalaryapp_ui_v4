export interface CompanyInfo {
  id: number;
  companyNameAr?: string;
  companyNameEn?: string;
  crNumber?: string;
  logoUrl?: string;
  mobileNo?: string;
  telNo?: string;
  email?: string;
  aboutUsAr?: string;
  aboutUsEn?: string;
  ourMissionAr?: string;
  ourMissionEn?: string;
  ourGoalsAr?: string;
  ourGoalsEn?: string;
  isAvailable: boolean;
}

export interface CreateCompanyInfoRequest {
  companyNameAr?: string;
  companyNameEn?: string;
  crNumber?: string;
  logoFile?: File;
  mobileNo?: string;
  telNo?: string;
  email?: string;
  aboutUsAr?: string;
  aboutUsEn?: string;
  ourMissionAr?: string;
  ourMissionEn?: string;
  ourGoalsAr?: string;
  ourGoalsEn?: string;
}

export interface UpdateCompanyInfoRequest {
  companyNameAr?: string;
  companyNameEn?: string;
  crNumber?: string;
  logoFile?: File;
  mobileNo?: string;
  telNo?: string;
  email?: string;
  aboutUsAr?: string;
  aboutUsEn?: string;
  ourMissionAr?: string;
  ourMissionEn?: string;
  ourGoalsAr?: string;
  ourGoalsEn?: string;
}
