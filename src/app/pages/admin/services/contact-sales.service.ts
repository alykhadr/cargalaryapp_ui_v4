import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GlobalComponent } from "src/app/global-component";
import { ContactSales, CreateContactSalesRequest, UpdateContactSalesRequest } from "../interfaces/contact-sales.interface";

const API_URL = GlobalComponent.API_URL;

@Injectable({
  providedIn: "root",
})
export class ContactSalesService {
  private readonly baseUrl = API_URL + "/api/contactsalesofficer";

  constructor(private http: HttpClient) {}

  getAll(): Observable<ContactSales[]> {
    return this.http.get<ContactSales[]>(this.baseUrl);
  }

  getById(id: number): Observable<ContactSales> {
    return this.http.get<ContactSales>(`${this.baseUrl}/${id}`);
  }

  create(formData: FormData): Observable<ContactSales> {
    return this.http.post<ContactSales>(this.baseUrl, formData);
  }

  update(id: number, formData: FormData): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  bulkDelete(contactIds: number[]): Observable<{ deletedCount: number; failedIds: number[] }> {
    return this.http.post<{ deletedCount: number; failedIds: number[] }>(`${this.baseUrl}/bulk-delete`, { contactIds });
  }
}
