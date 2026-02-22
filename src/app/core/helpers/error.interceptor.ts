import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MyAuthService } from '../services/my-auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

    constructor(private authenticationService: MyAuthService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            if (err.status === 401) {
                // auto logout if 401 response returned from api
                this.authenticationService.logout();
                location.reload();
            }
            debugger;
            const apiErrors = err?.error?.errors;
            const message = typeof err?.error === 'string'
                ? err.error
                : Array.isArray(apiErrors) && apiErrors.length > 0
                    ? apiErrors.join(', ')
                    : err?.error?.message || err?.error?.error || err?.message || err?.statusText || 'Something went wrong';

            return throwError(() => message);
        }))
    }
}
