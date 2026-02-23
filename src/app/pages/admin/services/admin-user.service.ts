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
    const formData = new FormData();
    formData.append('email', payload.email);
    formData.append('userName', payload.userName);
    formData.append('password', payload.password);
    formData.append('firstName', payload.firstName || '');
    formData.append('lastName', payload.lastName || '');
    formData.append('branchId', payload.branchId.toString());
    payload.roles.forEach(role => formData.append('roles', role));
    if (payload.profileImage) {
      formData.append('profileImage', payload.profileImage);
    }
    return this.http.post(`${AUTH_API}/register/admin`, formData);
  }

  updateUser(userId: string, payload: { userName: string; email: string; firstName: string; lastName: string; branchId: number; profileImage?: File }): Observable<void> {
    const formData = new FormData();
    formData.append('userName', payload.userName);
    formData.append('email', payload.email);
    formData.append('firstName', payload.firstName || '');
    formData.append('lastName', payload.lastName || '');
    formData.append('branchId', payload.branchId.toString());
    if (payload.profileImage) {
      formData.append('profileImage', payload.profileImage);
    }
    return this.http.put<void>(`${this.usersUrl}/${userId}`, formData);
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
