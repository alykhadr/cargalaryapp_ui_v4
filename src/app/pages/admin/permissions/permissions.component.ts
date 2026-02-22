import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import { Role } from '../interfaces/role.interface';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';
import { ToastService } from '../../icons/toast-service';
import { getErrorMessage } from '../shared/error-message.util';

@Component({
  selector: 'app-permissions',
  standalone: false,
  templateUrl: './permissions.component.html',
  styleUrl: './permissions.component.scss'
})
export class PermissionsComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  roles: Role[] = [];
  selectedRole?: Role;
  isLoading = false;
  isSaving = false;
  permissionSubmitted = false;
  permissionInput = '';
  rolePermissions: string[] = [];
  allPermissions: string[] = [];

  constructor(
    private roleService: RoleService,
    private permissionService: PermissionService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Admin' },
      { label: 'Permissions', active: true }
    ];
    this.loadRoles();
    this.loadAllPermissions();
  }

  loadRoles() {
    this.isLoading = true;
    this.roleService.getRoles().pipe(first()).subscribe({
      next: (roles) => {
        this.roles = roles;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.showError(error);
      }
    });
  }

  loadAllPermissions() {
    this.permissionService.getPermissions().pipe(first()).subscribe({
      next: (permissions) => {
        this.allPermissions = permissions;
      },
      error: (error) => this.showError(error)
    });
  }

  selectRole(role: Role) {
    this.selectedRole = role;
    this.permissionSubmitted = false;
    this.permissionInput = '';
    this.loadRolePermissions(role.id);
  }

  loadRolePermissions(roleId: string) {
    this.isLoading = true;
    this.permissionService.getRolePermissions(roleId).pipe(first()).subscribe({
      next: (permissions) => {
        this.rolePermissions = permissions;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.showError(error);
      }
    });
  }

  addPermission() {
    this.permissionSubmitted = true;
    if (!this.selectedRole) {
      return;
    }
    const permission = this.permissionInput.trim();
    if (!permission) {
      return;
    }

    this.isSaving = true;
    this.permissionService.addRolePermission(this.selectedRole.id, permission).pipe(first()).subscribe({
      next: () => {
        this.permissionSubmitted = false;
        this.permissionInput = '';
        this.isSaving = false;
        this.loadRolePermissions(this.selectedRole!.id);
        this.loadAllPermissions();
      },
      error: (error) => {
        this.isSaving = false;
        this.showError(error);
      }
    });
  }

  removePermission(permission: string) {
    if (!this.selectedRole) {
      return;
    }
    this.isSaving = true;
    this.permissionService.removeRolePermission(this.selectedRole.id, permission).pipe(first()).subscribe({
      next: () => {
        this.isSaving = false;
        this.loadRolePermissions(this.selectedRole!.id);
        this.loadAllPermissions();
      },
      error: (error) => {
        this.isSaving = false;
        this.showError(error);
      }
    });
  }

  useSuggestedPermission(permission: string) {
    this.permissionInput = permission;
    this.permissionSubmitted = false;
  }

  private showError(error: any) {
    const message = getErrorMessage(error);
    this.toastService.show(message, {
      classname: 'bg-danger text-white',
      delay: 3000
    });
  }
}
