import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
    CreateRoleRequest,
    Role,
    RoleUser,
    UpdateRoleRequest,
} from "../interfaces/role.interface";
import { GlobalComponent } from "src/app/global-component";


const API_URL = GlobalComponent.API_URL;
const EMPLOYEES_API = API_URL + "/api/employees";

@Injectable({
    providedIn: "root",
})
export class RoleService {
    private readonly baseUrl = API_URL + "/api/roles";

    constructor(private http: HttpClient) { }

    getRoles(): Observable<Role[]> {
        return this.http.get<Role[]>(this.baseUrl);
    }

    getRoleById(roleId: string): Observable<Role> {
        return this.http.get<Role>(`${this.baseUrl}/${roleId}`);
    }

    getUsersByRole(roleId: string): Observable<RoleUser[]> {
        return this.http.get<RoleUser[]>(`${this.baseUrl}/${roleId}/users`);
    }

    createRole(payload: CreateRoleRequest): Observable<Role> {
        return this.http.post<Role>(this.baseUrl, payload);
    }

    updateRole(roleId: string, payload: UpdateRoleRequest): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${roleId}`, payload);
    }

    deleteRole(roleId: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${roleId}`);
    }
    deleteRoles(roleIds: string[]) {
        const options = {
            body: roleIds
        };
        return this.http.delete(`${this.baseUrl}/bulk`, options);
    }

    getUserRoles(userId: string): Observable<string[]> {
        return this.http.get<string[]>(`${EMPLOYEES_API}/${userId}/roles`);
    }

    //   assignRoleToUser(userId: string, roleName: string): Observable<string> {
    //     return this.http.post(
    //       `${AUTH_API}/employees/${userId}/roles/${encodeURIComponent(roleName)}`,
    //       {},
    //       { ...this.getHttpOptions(), responseType: "text" }
    //     );
    //   }

    //   removeRoleFromUser(userId: string, roleName: string): Observable<string> {
    //     return this.http.delete(
    //       `${AUTH_API}/employees/${userId}/roles/${encodeURIComponent(roleName)}`,
    //       { ...this.getHttpOptions(), responseType: "text" }
    //     );
    //   }
}

export { RoleService as roleService };
