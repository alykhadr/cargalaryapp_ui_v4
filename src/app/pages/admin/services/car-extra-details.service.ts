import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GlobalComponent } from "src/app/global-component";
import { CarExtraDetails, CreateCarExtraDetailsRequest, UpdateCarExtraDetailsRequest } from "../interfaces/car-extra-details.interface";

const API_URL = GlobalComponent.API_URL;

@Injectable({
  providedIn: "root",
})
export class CarExtraDetailsService {
  private readonly baseUrl = API_URL + "/api/CarExtraDetails";

  constructor(private http: HttpClient) {}

  getExtraDetails(): Observable<CarExtraDetails[]> {
    return this.http.get<CarExtraDetails[]>(this.baseUrl);
  }

  getExtraDetailById(id: number): Observable<CarExtraDetails> {
    return this.http.get<CarExtraDetails>(`${this.baseUrl}/${id}`);
  }

  getExtraDetailsByCarId(carId: number): Observable<CarExtraDetails[]> {
    return this.http.get<CarExtraDetails[]>(`${this.baseUrl}/by-car/${carId}`);
  }

  createExtraDetail(payload: CreateCarExtraDetailsRequest): Observable<CarExtraDetails> {
    return this.http.post<CarExtraDetails>(this.baseUrl, payload);
  }

  updateExtraDetail(id: number, payload: UpdateCarExtraDetailsRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  deleteExtraDetail(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  bulkDeleteExtraDetails(ids: number[]): Observable<{ deletedCount: number; failedIds: number[] }> {
    return this.http.post<{ deletedCount: number; failedIds: number[] }>(`${this.baseUrl}/bulk-delete`, { ids });
  }
}
