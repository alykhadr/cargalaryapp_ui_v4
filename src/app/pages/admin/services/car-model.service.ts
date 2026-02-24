import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GlobalComponent } from "src/app/global-component";
import { CarModel, CreateCarModelRequest, UpdateCarModelRequest } from "../interfaces/car-model.interface";

const API_URL = GlobalComponent.API_URL;

@Injectable({
  providedIn: "root",
})
export class CarModelService {
  private readonly baseUrl = API_URL + "/api/model";

  constructor(private http: HttpClient) {}

  getModels(): Observable<CarModel[]> {
    return this.http.get<CarModel[]>(this.baseUrl);
  }

  getModelById(modelId: number): Observable<CarModel> {
    return this.http.get<CarModel>(`${this.baseUrl}/${modelId}`);
  }

  createModel(payload: CreateCarModelRequest): Observable<CarModel> {
    const formData = new FormData();
    formData.append('nameAr', payload.nameAr);
    formData.append('nameEn', payload.nameEn);
    formData.append('brandId', payload.brandId.toString());
    if (payload.imageFile) {
      formData.append('imageFile', payload.imageFile);
    }
    return this.http.post<CarModel>(this.baseUrl, formData);
  }

  updateModel(modelId: number, payload: UpdateCarModelRequest): Observable<void> {
    const formData = new FormData();
    formData.append('nameAr', payload.nameAr);
    formData.append('nameEn', payload.nameEn);
    formData.append('brandId', payload.brandId.toString());
    if (payload.isAvailable !== undefined) {
      formData.append('isAvailable', payload.isAvailable.toString());
    }
    if (payload.imageFile) {
      formData.append('imageFile', payload.imageFile);
    }
    return this.http.put<void>(`${this.baseUrl}/${modelId}`, formData);
  }

  deleteModel(modelId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${modelId}`);
  }

  bulkDeleteModels(modelIds: number[]): Observable<{ deletedCount: number; failedIds: number[] }> {
    return this.http.post<{ deletedCount: number; failedIds: number[] }>(`${this.baseUrl}/bulk-delete`, { modelIds });
  }
}
