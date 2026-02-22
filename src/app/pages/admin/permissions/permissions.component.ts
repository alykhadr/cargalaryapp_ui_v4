import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
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
  isAddingPermission = false;
  deletingPermission: string | null = null;
  permissionSubmitted = false;
  permissionInput = '';
  permissionSearch = '';
  availableSearch = '';
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
    const isAlreadyAssigned = this.rolePermissions.some(
      assigned => assigned.toLowerCase() === permission.toLowerCase()
    );
    if (isAlreadyAssigned) {
      this.toastService.show('Permission already assigned to this role.', {
        classname: 'bg-warning text-dark',
        delay: 3000
      });
      return;
    }

    this.isAddingPermission = true;
    this.permissionService.addRolePermission(this.selectedRole.id, permission).pipe(first()).subscribe({
      next: () => {
        this.permissionSubmitted = false;
        this.permissionInput = '';
        this.isAddingPermission = false;
        this.loadRolePermissions(this.selectedRole!.id);
        this.loadAllPermissions();
      },
      error: (error) => {
        this.isAddingPermission = false;
        this.showError(error);
      }
    });
  }

  async removePermission(permission: string) {
    if (!this.selectedRole) {
      return;
    }

    const result = await Swal.fire({
      title: 'Delete permission?',
      text: `Are you sure you want to remove "${permission}" from role "${this.selectedRole.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.deletingPermission = permission;
    this.permissionService.removeRolePermission(this.selectedRole.id, permission).pipe(first()).subscribe({
      next: () => {
        this.deletingPermission = null;
        this.loadRolePermissions(this.selectedRole!.id);
        this.loadAllPermissions();
      },
      error: (error) => {
        this.deletingPermission = null;
        this.showError(error);
      }
    });
  }

  useSuggestedPermission(permission: string) {
    this.permissionInput = permission;
    this.permissionSubmitted = false;
  }

  get filteredRolePermissions(): string[] {
    const term = this.permissionSearch.trim().toLowerCase();
    if (!term) {
      return this.rolePermissions;
    }
    return this.rolePermissions.filter(permission => permission.toLowerCase().includes(term));
  }

  get filteredAvailablePermissions(): string[] {
    const term = this.availableSearch.trim().toLowerCase();
    const assignedPermissions = new Set(this.rolePermissions.map(permission => permission.toLowerCase()));
    const availableOnly = this.allPermissions.filter(permission => !assignedPermissions.has(permission.toLowerCase()));
    if (!term) {
      return availableOnly;
    }
    return availableOnly.filter(permission => permission.toLowerCase().includes(term));
  }

  private showError(error: any) {
    const message = getErrorMessage(error);
    this.toastService.show(message, {
      classname: 'bg-danger text-white',
      delay: 3000
    });
  }
}
