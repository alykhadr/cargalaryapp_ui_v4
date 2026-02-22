import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AccessControlService } from '../services/access-control.service';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  constructor(
    private router: Router,
    private accessControlService: AccessControlService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const requiredRole = route.data['role'] as string | undefined;
    const requiredRoles = route.data['roles'] as string[] | undefined;
    const requiredPermission = route.data['permission'] as string | undefined;
    const requiredPermissions = route.data['permissions'] as string[] | undefined;
    const requireAll = !!route.data['requireAllPermissions'];

    const rolesOk = requiredRole
      ? this.accessControlService.hasRole(requiredRole)
      : requiredRoles
        ? this.accessControlService.hasRole(requiredRoles, requireAll)
        : true;

    const permissionsOk = requiredPermission
      ? this.accessControlService.hasPermission(requiredPermission)
      : requiredPermissions
        ? this.accessControlService.hasPermission(requiredPermissions, requireAll)
        : true;

    if (rolesOk && permissionsOk) {
      return true;
    }

    this.router.navigate(['/'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
