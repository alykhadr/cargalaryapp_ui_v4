export interface CarCarColor {
  carId: number;
  colorId: number;
  stockQuantity?: number | null;
  colorImageUrl?: string;
  pricingPerColor?: number | null;
  isAvailable: boolean;
}
