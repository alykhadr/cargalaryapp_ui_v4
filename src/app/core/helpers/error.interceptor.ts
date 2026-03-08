import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MyAuthService } from '../services/my-auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

    constructor(
        private authenticationService: MyAuthService,
        private router: Router
    ) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            if (err.status === 401) {
                // auto logout if 401 response returned from api
                this.authenticationService.logout();
                this.router.navigate(['/auth/login'], {
                    queryParams: { returnUrl: this.router.url }
                });
            }

            const apiErrors = err?.error?.errors;
            const message = typeof err?.error === 'string'
                ? err.error
                : Array.isArray(apiErrors) && apiErrors.length > 0
                    ? apiErrors.join(', ')
                    : err?.error?.message || err?.error?.error || err?.message || err?.statusText || 'Something went wrong';

            // Keep structured backend payload (errorCode/messageAr/messageEn) for UI localization.
            if (err?.error && typeof err.error === 'object') {
                err.error.message = message;
                return throwError(() => err);
            }

            return throwError(() => ({ message }));
        }))
    }
}
