import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from 'src/app/store/Authentication/auth.models';
import { GlobalComponent } from 'src/app/global-component';
import { TokenStorageService } from './token-storage.service';


const AUTH_API = GlobalComponent.AUTH_API;
const INVALID_CREDENTIALS_MESSAGES = {
    en: 'Invalid user name or password',
    ar: 'اسم المستخدم أو كلمة المرور غير صحيحة'
} as const;
const EMPLOYEE_ONLY_LOGIN_MESSAGES = {
    en: 'Login is allowed only for users linked to an employee record',
    ar: 'تسجيل الدخول متاح فقط للمستخدمين المرتبطين بسجل موظف'
} as const;
const LOCKED_USER_LOGIN_MESSAGES = {
    en: 'User account is locked',
    ar: 'هذا الحساب مقفل'
} as const;
const NON_EMPLOYEE_LOGIN_ERROR = 'NON_EMPLOYEE_LOGIN_ERROR';
const LOCKED_USER_LOGIN_ERROR = 'LOCKED_USER_LOGIN_ERROR';

function getCurrentLanguage(): 'ar' | 'en' {
    const browserLang = (typeof navigator !== 'undefined' ? navigator.language : '').toLowerCase();
    const htmlLang = (typeof document !== 'undefined' ? document.documentElement.lang : '').toLowerCase();
    const savedLang = (
        window.localStorage.getItem('lang')
        || window.sessionStorage.getItem('lang')
        || htmlLang
        || browserLang
        || 'en'
    ).toLowerCase();

    return savedLang.startsWith('ar') ? 'ar' : 'en';
}

function getInvalidCredentialsMessage(): string {
    return INVALID_CREDENTIALS_MESSAGES[getCurrentLanguage()];
}

function getEmployeeOnlyLoginMessage(): string {
    return EMPLOYEE_ONLY_LOGIN_MESSAGES[getCurrentLanguage()];
}

function getLockedUserLoginMessage(): string {
    return LOCKED_USER_LOGIN_MESSAGES[getCurrentLanguage()];
}

function extractApiErrorMessage(error: any): string {
    const payload = error?.error;

    if (typeof payload === 'string') {
        return payload;
    }

    if (payload && typeof payload === 'object') {
        const message = payload.message ?? payload.Message ?? payload.messageEn ?? payload.MessageEn;
        if (typeof message === 'string') {
            return message;
        }
    }

    if (typeof error?.message === 'string') {
        return error.message;
    }

    return '';
}

function isLockedAccountApiError(error: any): boolean {
    const message = extractApiErrorMessage(error).toLowerCase();
    return message.includes('user account is locked') || message.includes('account is locked');
}

const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};
@Injectable({ providedIn: 'root' })
export class MyAuthService {

    private currentUserSubject: BehaviorSubject<User>;
    public currentUser: Observable<User>;

    constructor(
        private http: HttpClient,
        private tokenStorageService: TokenStorageService
    ) {
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
                if (!this.hasEmployeeLink(user)) {
                    throw new Error(NON_EMPLOYEE_LOGIN_ERROR);
                }
                if (this.isUserLocked(user)) {
                    throw new Error(LOCKED_USER_LOGIN_ERROR);
                }
                if (user && user.token) {
                    // store user details and jwt token in local storage to keep user logged in between page refreshes
                    sessionStorage.setItem('toast', 'true');
                    this.tokenStorageService.saveAuth(user, user.token, rememberMe);
                    this.currentUserSubject.next(user);
                }
                return user;
            }),
            catchError((error: any) => {
                if (error?.message === NON_EMPLOYEE_LOGIN_ERROR) {
                    return throwError(() => getEmployeeOnlyLoginMessage());
                }
                if (error?.message === LOCKED_USER_LOGIN_ERROR) {
                    return throwError(() => getLockedUserLoginMessage());
                }
                if (isLockedAccountApiError(error)) {
                    return throwError(() => getLockedUserLoginMessage());
                }
                const errorMessage = getInvalidCredentialsMessage();
                return throwError(() => errorMessage);
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
        return this.http.post<{ message: string }>(
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

    private hasEmployeeLink(user: User | null | undefined): boolean {
        const employeeId = Number(user?.employeeId);
        return Number.isFinite(employeeId) && employeeId > 0;
    }

    private isUserLocked(user: User | null | undefined): boolean {
        if (user?.isLocked === true) {
            return true;
        }

        if (!user?.lockoutEnd) {
            return false;
        }

        const lockoutEnd = new Date(user.lockoutEnd);
        if (Number.isNaN(lockoutEnd.getTime())) {
            return false;
        }

        return lockoutEnd.getTime() > Date.now();
    }
}
