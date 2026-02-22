import { Injectable, Inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError, exhaustMap, tap } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { AuthenticationService } from '../../core/services/auth.service';
import { login, loginSuccess, loginFailure, logout, logoutSuccess, Register} from './authentication.actions';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuthenticationEffects {

  Register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Register),
      exhaustMap(({ email, first_name, password }) =>
        this.AuthenticationService.register(email, first_name, password).pipe(
          map((user) => {
            this.router.navigate(['/auth/login']);
            return loginSuccess({ user });
          }),
          catchError((error) => of(loginFailure({ error })))
        )
      )
    )
  );

  login$ = createEffect(() =>
  this.actions$.pipe(
    ofType(login),
    exhaustMap(({ userName, password }) => {
      if (environment.defaultauth === "firebase") {
        return of();
      } else {
        return this.AuthenticationService.login(userName, password).pipe(
          map((user) => {
            if (user?.token) {
              sessionStorage.setItem('toast', 'true');
              sessionStorage.setItem('currentUser', JSON.stringify(user));
              sessionStorage.setItem('token', user.token);
              this.router.navigate(['/']);
            }
            return loginSuccess({ user });
          }),
          catchError((error) => of(loginFailure({ error })))
        );
      }
    })
  )
);

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logout),
      tap(() => {
        // Perform any necessary cleanup or side effects before logging out
      }),
      exhaustMap(() => of(logoutSuccess()))
    )
  );

  constructor(
    @Inject(Actions) private actions$: Actions,
    private AuthenticationService: AuthenticationService,
    private router: Router) { }

}
