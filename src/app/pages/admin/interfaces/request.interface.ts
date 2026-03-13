export interface Request {
  id: number;
  userId?: string | null;
  vehicleOwnerType: number;
  name: string;
  email: string;
  mobileNo: string;
  carId: number;
  colorId: number;
  colorNameAr?: string | null;
  colorNameEn?: string | null;
  colorCode?: string | null;
  colorStatus?: number | null;
  colorStatusNameAr?: string | null;
  colorStatusNameEn?: string | null;
  colorStatusDetailCode?: string | null;
  paymentMethod: number;
  regionId: number;
  cityId: number;
  currentStatus: number;
  currentStatusNameAr?: string | null;
  currentStatusNameEn?: string | null;
  currentStatusDate?: string | null;
  notes?: string | null;
  createdAt: string;
  isAvailable: boolean;
}

export interface CreateRequest {
  userId?: string | null;
  vehicleOwnerType: number;
  name: string;
  email: string;
  mobileNo: string;
  carId: number;
  colorId: number;
  paymentMethod: number;
  regionId: number;
  cityId: number;
  notes?: string | null;
}

export interface UpdateRequestStatus {
  currentStatus: number;
  notes?: string | null;
}

export interface RequestHistory {
  id: number;
  requestId: number;
  status: number;
  statusDate: string;
  notes?: string | null;
  createdAt: string;
}
