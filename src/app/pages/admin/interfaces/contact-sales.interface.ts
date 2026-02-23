export interface ContactSales {
  id: number;
  contactValue: string;
  contactType: number;
  contactIconUrl?: string;
  createdBy?: string;
  isAvailable: boolean;
  createdAt: Date;
  branchId: number;
}

export interface CreateContactSalesRequest {
  contactValue: string;
  contactType: number;
  contactIconUrl?: string;
  isAvailable?: boolean;
  branchId: number;
}

export interface UpdateContactSalesRequest {
  contactValue: string;
  contactType: number;
  contactIconUrl?: string;
  isAvailable: boolean;
  branchId: number;
}
