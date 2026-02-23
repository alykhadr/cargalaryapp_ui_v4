import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GlobalComponent } from "src/app/global-component";
import { Brand, CreateBrandRequest, UpdateBrandRequest } from "../interfaces/brand.interface";

const API_URL = GlobalComponent.API_URL;

@Injectable({
  providedIn: "root",
})
export class BrandService {
  private readonly baseUrl = API_URL + "/api/brands";

  constructor(private http: HttpClient) {}

  getBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(this.baseUrl);
  }

  getBrandById(brandId: number): Observable<Brand> {
    return this.http.get<Brand>(`${this.baseUrl}/${brandId}`);
  }

  createBrand(payload: CreateBrandRequest): Observable<Brand> {
    const formData = new FormData();
    formData.append('nameAr', payload.nameAr);
    formData.append('nameEn', payload.nameEn);
    if (payload.imageFile) {
      formData.append('imageFile', payload.imageFile);
    }
    return this.http.post<Brand>(this.baseUrl, formData);
  }

  updateBrand(brandId: number, payload: UpdateBrandRequest): Observable<void> {
    const formData = new FormData();
    formData.append('nameAr', payload.nameAr);
    formData.append('nameEn', payload.nameEn);
    if (payload.imageFile) {
      formData.append('imageFile', payload.imageFile);
    }
    return this.http.put<void>(`${this.baseUrl}/${brandId}`, formData);
  }

  deleteBrand(brandId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${brandId}`);
  }
}
