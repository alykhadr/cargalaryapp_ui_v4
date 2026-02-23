import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GlobalComponent } from "src/app/global-component";
import { ContactUs } from "../interfaces/contact-us.interface";

const API_URL = GlobalComponent.API_URL;

@Injectable({
  providedIn: "root",
})
export class ContactUsService {
  private readonly baseUrl = API_URL + "/api/contactus";

  constructor(private http: HttpClient) {}

  getAll(): Observable<ContactUs[]> {
    return this.http.get<ContactUs[]>(this.baseUrl);
  }

  getById(id: number): Observable<ContactUs> {
    return this.http.get<ContactUs>(`${this.baseUrl}/${id}`);
  }

  create(formData: FormData): Observable<ContactUs> {
    return this.http.post<ContactUs>(this.baseUrl, formData);
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
