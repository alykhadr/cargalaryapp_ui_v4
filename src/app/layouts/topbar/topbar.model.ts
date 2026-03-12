export interface CartModel {
    id: any;
    img: string;
    product: string;
    quantity: any;
    price: any;
  }

export interface RequestNotificationItem {
  id: number;
  carName: string;
  carImageUrl?: string | null;
  createdDate: string;
}

export interface RequestNotificationsResponse {
  count: number;
  items: RequestNotificationItem[];
}
  
