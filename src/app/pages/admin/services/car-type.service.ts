import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GlobalComponent } from "src/app/global-component";
import { CarType, CreateCarTypeRequest, UpdateCarTypeRequest } from "../interfaces/car-type.interface";

const API_URL = GlobalComponent.API_URL;

@Injectable({
  providedIn: "root",
})
export class CarTypeService {
  private readonly baseUrl = API_URL + "/api/Types";

  constructor(private http: HttpClient) {}

  getCarTypes(): Observable<CarType[]> {
    return this.http.get<CarType[]>(this.baseUrl);
  }

  getCarTypeById(id: number): Observable<CarType> {
    return this.http.get<CarType>(`${this.baseUrl}/${id}`);
  }

  createCarType(payload: CreateCarTypeRequest): Observable<CarType> {
    return this.http.post<CarType>(this.baseUrl, payload);
  }

  updateCarType(id: number, payload: UpdateCarTypeRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  deleteCarType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
