import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Router } from '@angular/router';
import { MyAuthService } from '../services/my-auth.service';
import { TokenStorageService } from '../services/token-storage.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(
        private myAuthService: MyAuthService,
        private tokenStorageService: TokenStorageService,
        public router: Router
    ) { }

    intercept(
        request: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        const currentUser = this.myAuthService.currentUserValue;
        const token = currentUser?.token;
        const canOverrideBranch = this.userHasAnyRole(token, ['Admin', 'Manager']);

        if (token && this.isTokenExpired(token)) {
            this.myAuthService.logout();
            this.router.navigate(['/auth/login'], {
                queryParams: { returnUrl: this.router.url }
            });
            return next.handle(request);
        }

        const selectedBranchId = canOverrideBranch ? this.tokenStorageService.getSelectedBranchId() : null;
        const headers: Record<string, string> = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (selectedBranchId) {
            headers['X-Branch-Id'] = String(selectedBranchId);
        }

        if (Object.keys(headers).length > 0) {
            request = request.clone({
                setHeaders: headers,
            });
        }

        return next.handle(request);
    }

    private isTokenExpired(token: string): boolean {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (!payload?.exp) {
                return false;
            }
            const now = Math.floor(Date.now() / 1000);
            return payload.exp <= now;
        } catch {
            return false;
        }
    }

    private userHasAnyRole(token: string | undefined, roles: string[]): boolean {
        if (!token || !roles?.length) {
            return false;
        }

        try {
            const payload = this.decodeJwtPayload(token);
            const candidates: unknown[] = [
                payload?.role,
                payload?.roles,
                payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
            ];

            const userRoles = new Set<string>();
            for (const candidate of candidates) {
                if (Array.isArray(candidate)) {
                    candidate
                        .filter(value => typeof value === 'string' && value.trim().length > 0)
                        .forEach(value => userRoles.add((value as string).trim().toLowerCase()));
                    continue;
                }

                if (typeof candidate === 'string' && candidate.trim().length > 0) {
                    userRoles.add(candidate.trim().toLowerCase());
                }
            }

            return roles.some(role => userRoles.has(role.toLowerCase()));
        } catch {
            return false;
        }
    }

    private decodeJwtPayload(token: string): any | null {
        const parts = token.split('.');
        if (parts.length < 2 || !parts[1]) {
            return null;
        }

        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        return JSON.parse(atob(padded));
    }
}
