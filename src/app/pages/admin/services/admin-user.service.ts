import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GlobalComponent } from "src/app/global-component";
import { AdminUser, CreateAdminUserRequest } from "../interfaces/user-admin.interface";

const AUTH_API = GlobalComponent.AUTH_API;

@Injectable({
  providedIn: "root",
})
export class AdminUserService {
  private readonly usersUrl = `${AUTH_API}/users`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.usersUrl);
  }

  createUser(payload: CreateAdminUserRequest): Observable<unknown> {
    return this.http.post(`${AUTH_API}/register/admin`, payload);
  }

  updateUser(userId: string, payload: { userName: string; email: string; firstName: string; lastName: string }): Observable<void> {
    return this.http.put<void>(`${this.usersUrl}/${userId}`, payload);
  }

  changeUserPassword(userId: string, newPassword: string): Observable<string> {
    return this.http.post(`${this.usersUrl}/${userId}/change-password`, { newPassword }, { responseType: "text" });
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.usersUrl}/${userId}`);
  }

  lockUser(userId: string): Observable<string> {
    return this.http.post(`${this.usersUrl}/${userId}/lock`, {}, { responseType: "text" });
  }

  unlockUser(userId: string): Observable<string> {
    return this.http.post(`${this.usersUrl}/${userId}/unlock`, {}, { responseType: "text" });
  }

  getUserRoles(userId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.usersUrl}/${userId}/roles`);
  }

  assignRole(userId: string, roleName: string): Observable<string> {
    return this.http.post(
      `${this.usersUrl}/${userId}/roles/${encodeURIComponent(roleName)}`,
      {},
      { responseType: "text" }
    );
  }

  removeRole(userId: string, roleName: string): Observable<string> {
    return this.http.delete(
      `${this.usersUrl}/${userId}/roles/${encodeURIComponent(roleName)}`,
      { responseType: "text" }
    );
  }
}
