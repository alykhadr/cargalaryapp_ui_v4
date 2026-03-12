import { Injectable } from '@angular/core';

const TOKEN_KEY = 'token';
const USER_KEY = 'currentUser';
const REMEMBER_ME_KEY = 'rememberMe';
const SELECTED_BRANCH_KEY = 'selectedBranchId';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  constructor() { }

  signOut(): void {
    this.clearAuthStorage();
    this.clearSelectedBranchId();
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

  public setSelectedBranchId(branchId: number | null): void {
    if (branchId && Number.isFinite(branchId) && branchId > 0) {
      window.localStorage.setItem(SELECTED_BRANCH_KEY, String(branchId));
      return;
    }

    this.clearSelectedBranchId();
  }

  public getSelectedBranchId(): number | null {
    const raw = window.localStorage.getItem(SELECTED_BRANCH_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  public clearSelectedBranchId(): void {
    window.localStorage.removeItem(SELECTED_BRANCH_KEY);
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
