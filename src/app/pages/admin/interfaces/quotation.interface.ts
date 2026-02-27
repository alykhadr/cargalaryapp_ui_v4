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
