export interface Quotation {
  id: number;
  userId?: string | null;
  vehicleOwnerType: number;
  name: string;
  email: string;
  mobileNo: string;
  carId: number;
  paymentMethod: number;
  regionId: number;
  cityId: number;
  currentStatus: number;
  currentStatusDate?: string | null;
  notes?: string | null;
  createdAt: string;
  isAvailable: boolean;
}

export interface CreateQuotationRequest {
  userId?: string | null;
  vehicleOwnerType: number;
  name: string;
  email: string;
  mobileNo: string;
  carId: number;
  paymentMethod: number;
  regionId: number;
  cityId: number;
  notes?: string | null;
}

export interface UpdateQuotationStatusRequest {
  currentStatus: number;
  notes?: string | null;
}

export interface QuotationHistory {
  id: number;
  quotationId: number;
  status: number;
  statusDate: string;
  notes?: string | null;
  createdAt: string;
}
