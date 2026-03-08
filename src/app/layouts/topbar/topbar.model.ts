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
  createdDate: string;
}

export interface QuotationNotificationsResponse {
  count: number;
  items: QuotationNotificationItem[];
}
  
