export interface CartModel {
    id: any;
    img: string;
    product: string;
    quantity: any;
    price: any;
  }

export interface QuotationNotificationItem {
  id: number;
  carName: string;
  carImageUrl?: string | null;
  createdDate: string;
}

export interface QuotationNotificationsResponse {
  count: number;
  items: QuotationNotificationItem[];
}
  
