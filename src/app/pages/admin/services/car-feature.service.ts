import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GlobalComponent } from 'src/app/global-component';
import { CarFeature, CreateCarFeatureRequest, UpdateCarFeatureRequest, CarCarFeature, AssignCarFeatureRequest } from '../interfaces/car-feature.interface';

const API_URL = GlobalComponent.API_URL;

@Injectable({
  providedIn: 'root'
})
export class CarFeatureService {
  // Backend controller is FeatureController => /api/Feature
  private readonly baseUrl = API_URL + '/api/Feature';
  private readonly carCarFeaturesUrl = API_URL + '/api/CarCarFeatures';

  constructor(private http: HttpClient) {}

  // Car Features CRUD
  getCarFeatures(): Observable<CarFeature[]> {
    return this.http.get<CarFeature[]>(this.baseUrl);
  }

  getCarFeatureById(id: number): Observable<CarFeature> {
    return this.http.get<CarFeature>(`${this.baseUrl}/${id}`);
  }

  createCarFeature(payload: CreateCarFeatureRequest): Observable<CarFeature> {
    return this.http.post<CarFeature>(this.baseUrl, payload);
  }

  updateCarFeature(id: number, payload: UpdateCarFeatureRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  deleteCarFeature(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Car-CarFeatures (Assignments)
  getCarFeaturesByCarId(carId: number): Observable<CarCarFeature[]> {
    return this.http.get<CarCarFeature[]>(`${this.carCarFeaturesUrl}/by-car/${carId}`);
  }

  assignFeatureToCar(carId: number, payload: AssignCarFeatureRequest): Observable<CarCarFeature> {
    return this.http.post<CarCarFeature>(`${this.carCarFeaturesUrl}/${carId}`, payload);
  }

  updateCarFeatureAssignment(carId: number, featureId: number, isAvailable: boolean): Observable<void> {
    return this.http.put<void>(`${this.carCarFeaturesUrl}/${carId}/${featureId}`, { isAvailable });
  }

  removeFeatureFromCar(carId: number, featureId: number): Observable<void> {
    return this.http.delete<void>(`${this.carCarFeaturesUrl}/${carId}/${featureId}`);
  }
}
