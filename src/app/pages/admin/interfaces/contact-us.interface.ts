export interface ContactUs {
  id: number;
  contactValue: string;
  contactType: number;
  contactIconUrl?: string;
  messageAr: string;
  messageEn: string;
  createdBy?: string;
  isAvailable: boolean;
  createdAt: Date;
}

export interface CreateContactUsRequest {
  contactValue: string;
  contactType: number;
  messageAr: string;
  messageEn: string;
  isAvailable?: boolean;
}

export interface UpdateContactUsRequest {
  contactValue: string;
  contactType: number;
  messageAr: string;
  messageEn: string;
  isAvailable: boolean;
}
