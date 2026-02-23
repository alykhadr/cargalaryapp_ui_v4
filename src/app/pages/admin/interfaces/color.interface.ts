export interface Color {
  id: number;
  colorNameAr: string;
  colorNameEn: string;
  colorCode: string;
  createdBy?: string;
  isAvailable: boolean;
}

export interface CreateColorRequest {
  colorNameAr: string;
  colorNameEn: string;
  colorCode: string;
}

export interface UpdateColorRequest {
  colorNameAr: string;
  colorNameEn: string;
  colorCode: string;
  isAvailable?: boolean;
}
