import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Router } from '@angular/router';
import { MyAuthService } from '../services/my-auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(
        private myAuthService: MyAuthService,
        public router: Router
    ) { }

    intercept(
        request: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        const currentUser = this.myAuthService.currentUserValue;
        const token = currentUser?.token;

        if (token && this.isTokenExpired(token)) {
            this.myAuthService.logout();
            this.router.navigate(['/auth/login'], {
                queryParams: { returnUrl: this.router.url }
            });
            return next.handle(request);
        }

        if (token) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`,
                },
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
}
