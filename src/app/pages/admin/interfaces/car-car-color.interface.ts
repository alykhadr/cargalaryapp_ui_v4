export interface CarCarColor {
  carId: number;
  colorId: number;
  colorNameAr?: string;
  colorNameEn?: string;
  colorCode?: string;
  colorStatus: number;
  colorStatusDetailCode?: string;
  colorStatusNameAr?: string;
  colorStatusNameEn?: string;
  stockQuantity?: number | null;
  colorImageUrl?: string;
  pricingPerColor?: number | null;
  pricePefore?: number | null;
  vatAmount?: number | null;
  discount?: number | null;
  discountType?: number | null;
  totalPrice?: number | null;
  isAvailable: boolean;
}
