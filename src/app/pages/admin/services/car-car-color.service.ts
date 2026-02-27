import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GlobalComponent } from 'src/app/global-component';
import { CarCarColor } from '../interfaces/car-car-color.interface';

const API_URL = GlobalComponent.API_URL;

@Injectable({
  providedIn: 'root'
})
export class CarCarColorService {
  private readonly baseUrl = API_URL + '/api/CarCarColors';

  constructor(private http: HttpClient) {}

  getByCarId(carId: number): Observable<CarCarColor[]> {
    return this.http.get<CarCarColor[]>(`${this.baseUrl}/by-car/${carId}`);
  }
}
