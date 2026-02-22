import { Injectable } from '@angular/core';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AccessControlService {
  constructor(private tokenStorageService: TokenStorageService) {}

  hasRole(role: string | string[], requireAll = false): boolean {
    const requiredRoles = this.toArray(role);
    if (requiredRoles.length === 0) {
      return true;
    }

    const userRoles = this.getRoles().map(value => value.toLowerCase());
    if (requireAll) {
      return requiredRoles.every(required => userRoles.includes(required.toLowerCase()));
    }

    return requiredRoles.some(required => userRoles.includes(required.toLowerCase()));
  }

  hasPermission(permission: string | string[], requireAll = false): boolean {
    if (this.hasRole('Admin')) {
      return true;
    }

    const requiredPermissions = this.toArray(permission);
    if (requiredPermissions.length === 0) {
      return true;
    }

    const userPermissions = this.getPermissions().map(value => value.toLowerCase());
    if (requireAll) {
      return requiredPermissions.every(required => userPermissions.includes(required.toLowerCase()));
    }

    return requiredPermissions.some(required => userPermissions.includes(required.toLowerCase()));
  }

  filterMenuByPermission<T extends { subItems?: T[]; permission?: string; permissions?: string[] }>(items: T[]): T[] {
    return items
      .map(item => {
        const subItems = item.subItems ? this.filterMenuByPermission(item.subItems) : undefined;
        const hasPermission = this.canAccessItem(item);
        const canShowParentWithChildren = !!subItems && subItems.length > 0;

        if (!hasPermission && !canShowParentWithChildren) {
          return null;
        }

        return {
          ...item,
          ...(subItems ? { subItems } : {})
        };
      })
      .filter((item): item is T => item !== null);
  }

  private canAccessItem(item: { permission?: string; permissions?: string[] }): boolean {
    if (item.permission) {
      return this.hasPermission(item.permission);
    }

    if (item.permissions && item.permissions.length > 0) {
      return this.hasPermission(item.permissions);
    }

    return true;
  }

  private getRoles(): string[] {
    const payload = this.getJwtPayload();
    const candidates: unknown[] = [
      payload?.role,
      payload?.roles,
      payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
    ];

    return this.flattenClaims(candidates);
  }

  private getPermissions(): string[] {
    const payload = this.getJwtPayload();
    const candidates: unknown[] = [payload?.permission, payload?.permissions];
    return this.flattenClaims(candidates);
  }

  private flattenClaims(candidates: unknown[]): string[] {
    const values = new Set<string>();

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        candidate
          .filter(value => typeof value === 'string' && value.trim().length > 0)
          .forEach(value => values.add((value as string).trim()));
        continue;
      }

      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        values.add(candidate.trim());
      }
    }

    return Array.from(values);
  }

  private getJwtPayload(): any | null {
    const token = this.tokenStorageService.getToken();
    if (!token) {
      return null;
    }

    try {
      const base64 = token.split('.')[1];
      const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }

  private toArray(value: string | string[] | null | undefined): string[] {
    if (!value) {
      return [];
    }

    return Array.isArray(value) ? value : [value];
  }
}
