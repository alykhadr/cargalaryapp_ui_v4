import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GlobalComponent } from "src/app/global-component";
import { FAQ, CreateFAQRequest, UpdateFAQRequest } from "../interfaces/faq.interface";

const API_URL = GlobalComponent.API_URL;

@Injectable({
  providedIn: "root",
})
export class FAQService {
  private readonly baseUrl = API_URL + "/api/faq";

  constructor(private http: HttpClient) {}

  getAll(): Observable<FAQ[]> {
    return this.http.get<FAQ[]>(this.baseUrl);
  }

  getById(id: number): Observable<FAQ> {
    return this.http.get<FAQ>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateFAQRequest): Observable<FAQ> {
    return this.http.post<FAQ>(this.baseUrl, payload);
  }

  update(id: number, payload: UpdateFAQRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  bulkDelete(faqIds: number[]): Observable<{ deletedCount: number; failedIds: number[] }> {
    return this.http.post<{ deletedCount: number; failedIds: number[] }>(`${this.baseUrl}/bulk-delete`, { faqIds });
  }
}
