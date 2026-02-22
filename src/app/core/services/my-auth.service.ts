import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from 'src/app/store/Authentication/auth.models';
import { GlobalComponent } from 'src/app/global-component';
import { TokenStorageService } from './token-storage.service';


const AUTH_API = GlobalComponent.AUTH_API;

const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};
@Injectable({ providedIn: 'root' })
export class MyAuthService {

    private currentUserSubject: BehaviorSubject<User>;
    public currentUser: Observable<User>;

    constructor(private http: HttpClient,private tokenStorageService : TokenStorageService) {
        this.currentUserSubject = new BehaviorSubject<User>(tokenStorageService.getUser()!);
        this.currentUser = this.currentUserSubject.asObservable();
    }

    /**
     * current user
     */
    public get currentUserValue(): User {
        return this.currentUserSubject.value;
    }



    /**
        * Performs the auth
        * @param userName userName of user
        * @param password password of user
        */
    login(userName: string, password: string, rememberMe = false) {
        // return getFirebaseBackend()!.loginUser(email, password).then((response: any) => {
        //     const user = response;
        //     return user;
        // });

        return this.http.post(AUTH_API + '/login', {
            userName,
            password,
            rememberMe
        }, httpOptions).pipe(
            map((response: User) => {
                const user = response;
                if (user && user.token) {
                    // store user details and jwt token in local storage to keep user logged in between page refreshes
                    sessionStorage.setItem('toast', 'true');
                    this.tokenStorageService.saveAuth(user, user.token, rememberMe);
                    this.currentUserSubject.next(user);
                }
                return user;
            }),
            catchError((error: any) => {
                const errorMessage = 'invalid user name or password !'; // Customize the error message as needed
                return throwError(errorMessage);
            })
        );
    }
    /**
     * Logout the user
     */
    logout() {
        // remove user from local storage to log user out
        this.tokenStorageService.signOut();
        this.currentUserSubject.next(null!);
    }

    forgotPassword(userNameOrEmail: string) {
        return this.http.post<{ message: string; resetToken?: string | null }>(
            AUTH_API + '/forgot-password',
            { userNameOrEmail },
            httpOptions
        );
    }

    resetPassword(userNameOrEmail: string, token: string, newPassword: string) {
        return this.http.post<{ message: string }>(
            AUTH_API + '/reset-password',
            { userNameOrEmail, token, newPassword },
            httpOptions
        );
    }
}
