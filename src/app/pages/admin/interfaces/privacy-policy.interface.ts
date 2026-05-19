export interface PrivacyPolicy {
  id: number;
  privacyPolicyAr: string;
  privacyPolicyEn: string;
  isAvailable: boolean;
}

export interface CreatePrivacyPolicyRequest {
  privacyPolicyAr: string;
  privacyPolicyEn: string;
}

export interface UpdatePrivacyPolicyRequest {
  privacyPolicyAr: string;
  privacyPolicyEn: string;
  isAvailable?: boolean;
}

export interface BulkDeletePrivacyPolicyResponse {
  deletedCount: number;
  failedIds: number[];
}
