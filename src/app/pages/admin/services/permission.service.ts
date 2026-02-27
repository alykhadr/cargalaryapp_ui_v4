import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GlobalComponent } from "src/app/global-component";

const API_URL = GlobalComponent.API_URL;

@Injectable({
  providedIn: "root",
})
export class PermissionService {
  private readonly baseUrl = API_URL + "/api/permissions";

  constructor(private http: HttpClient) {}

  getPermissions(): Observable<string[]> {
    return this.http.get<string[]>(this.baseUrl);
  }

  getRolePermissions(roleId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/roles/${roleId}`);
  }

  addRolePermission(roleId: string, page: string, action: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/roles/${roleId}`, { page, action });
  }

  removeRolePermission(roleId: string, permission: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/roles/${roleId}/${encodeURIComponent(permission)}`);
  }

  getEmployeePermissions(userId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/employees/${userId}`);
  }
}
