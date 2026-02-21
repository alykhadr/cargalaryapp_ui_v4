import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { TokenStorageService } from "src/app/core/services/token-storage.service";
import {
    CreateRoleRequest,
    Role,
    UpdateRoleRequest,
} from "../interfaces/role.interface";
import { GlobalComponent } from "src/app/global-component";


const API_URL = GlobalComponent.API_URL;
const AUTH_API = GlobalComponent.AUTH_API

@Injectable({
    providedIn: "root",
})
export class RoleService {
    private readonly baseUrl = API_URL + "/api/roles";


    constructor(
        private http: HttpClient,
        private tokenStorageService: TokenStorageService
    ) { }

    private getHttpOptions() {
        const token = this.tokenStorageService.getToken();
        return {
            headers: new HttpHeaders({
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            }),
        };
    }

    getRoles(): Observable<Role[]> {
        return this.http.get<Role[]>(this.baseUrl, this.getHttpOptions());
    }

    getRoleById(roleId: string): Observable<Role> {
        return this.http.get<Role>(`${this.baseUrl}/${roleId}`, this.getHttpOptions());
    }

    createRole(payload: CreateRoleRequest): Observable<Role> {
        return this.http.post<Role>(this.baseUrl, payload, this.getHttpOptions());
    }

    updateRole(roleId: string, payload: UpdateRoleRequest): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${roleId}`, payload, this.getHttpOptions());
    }

    deleteRole(roleId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${roleId}`, this.getHttpOptions());
    }
    deleteRoles(roleIds: string[]) {
        const httpOptions = {
            ...this.getHttpOptions(), // spreads the headers
            body: roleIds              // add body here for DELETE
        };
        return this.http.delete(`${this.baseUrl}/bulk`, httpOptions);
    }

    getUserRoles(userId: string): Observable<string[]> {
        return this.http.get<string[]>(
            `${AUTH_API}/users/${userId}/roles`,
            this.getHttpOptions()
        );
    }

    //   assignRoleToUser(userId: string, roleName: string): Observable<string> {
    //     return this.http.post(
    //       `${AUTH_API}/users/${userId}/roles/${encodeURIComponent(roleName)}`,
    //       {},
    //       { ...this.getHttpOptions(), responseType: "text" }
    //     );
    //   }

    //   removeRoleFromUser(userId: string, roleName: string): Observable<string> {
    //     return this.http.delete(
    //       `${AUTH_API}/users/${userId}/roles/${encodeURIComponent(roleName)}`,
    //       { ...this.getHttpOptions(), responseType: "text" }
    //     );
    //   }
}

export { RoleService as roleService };
