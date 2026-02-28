import { Injectable } from '@angular/core';

const TOKEN_KEY = 'token';
const USER_KEY = 'currentUser';
const REMEMBER_ME_KEY = 'rememberMe';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  constructor() { }

  signOut(): void {
    this.clearAuthStorage();
    window.localStorage.removeItem(REMEMBER_ME_KEY);
  }

  public saveToken(token: string, rememberMe = false): void {
    // Keep auth shared across browser tabs (sessionStorage is tab-scoped).
    const storage = window.localStorage;
    window.localStorage.setItem(REMEMBER_ME_KEY, String(rememberMe));
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
    storage.setItem(TOKEN_KEY, token);
  }

  public getToken(): string | null {
    return window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
  }

  public saveUser(user: any, rememberMe = false): void {
    // Keep auth shared across browser tabs (sessionStorage is tab-scoped).
    const storage = window.localStorage;
    window.localStorage.setItem(REMEMBER_ME_KEY, String(rememberMe));
    window.localStorage.removeItem(USER_KEY);
    window.sessionStorage.removeItem(USER_KEY);
    storage.setItem(USER_KEY, JSON.stringify(user));
  }

  public saveAuth(user: any, token: string, rememberMe = false): void {
    this.saveUser(user, rememberMe);
    this.saveToken(token, rememberMe);
  }

  public getUser(): any {
    const user = window.localStorage.getItem(USER_KEY) ?? window.sessionStorage.getItem(USER_KEY);
    if (user) {
      return JSON.parse(user);
    }

    return null;
  }

  private clearAuthStorage(): void {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(USER_KEY);
  }
}
