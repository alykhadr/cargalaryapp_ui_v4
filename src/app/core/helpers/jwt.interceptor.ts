import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

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
        if (currentUser?.token) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${currentUser.token}`,
                },
            });
        }

        return next.handle(request).pipe(
            catchError((error) => {
                if (error.status === 401) {
                    this.router.navigate(['/auth/login']);
                }
                return throwError(error);
            })
        );
    }
}
