import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GlobalComponent } from "src/app/global-component";
import { CreateDepartmentRequest, Department, UpdateDepartmentRequest } from "../interfaces/department.interface";

const API_URL = GlobalComponent.API_URL;

@Injectable({
  providedIn: "root",
})
export class DepartmentService {
  private readonly baseUrl = `${API_URL}/api/departments`;

  constructor(private http: HttpClient) {}

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.baseUrl);
  }

  createDepartment(payload: CreateDepartmentRequest): Observable<Department> {
    return this.http.post<Department>(this.baseUrl, payload);
  }

  updateDepartment(id: number, payload: UpdateDepartmentRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
