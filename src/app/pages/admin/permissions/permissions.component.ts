import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { Role } from '../interfaces/role.interface';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';
import { ToastService } from '../../icons/toast-service';
import { getErrorMessage } from '../shared/error-message.util';
import { TranslateService } from '@ngx-translate/core';

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
  pageInput = '';
  actionInput = '';
  permissionSearch = '';
  availableSearch = '';
  rolePermissions: string[] = [];
  allPermissions: string[] = [];
  filteredAssignedPermissions: string[] = [];
  filteredAvailablePermissions: string[] = [];
  assignedGroups: Array<{ page: string; actions: string[] }> = [];
  availableGroups: Array<{ page: string; actions: string[] }> = [];
  pagedAssignedGroups: Array<{ page: string; actions: string[] }> = [];
  pagedAvailableGroups: Array<{ page: string; actions: string[] }> = [];
  expandedAssignedPages = new Set<string>();
  expandedAvailablePages = new Set<string>();

  assignedPager = new PaginationService();
  availablePager = new PaginationService();

  constructor(
    private roleService: RoleService,
    private permissionService: PermissionService,
    private toastService: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.EMPLOYEE_MANAGEMENT.TEXT') },
      { label: this.translate.instant('MENUITEMS.ADMIN.LIST.PERMISSION'), active: true }
    ];
    this.assignedPager.pageSize = 10;
    this.availablePager.pageSize = 10;
    this.loadRoles();
    this.loadAllPermissions();
  }

  loadRoles() {
    this.isLoading = true;
    this.roleService.getRoles().pipe(first()).subscribe({
      next: (roles) => {
        this.roles = roles;
        if (this.roles.length > 0) {
          const hasSelectedRole = !!this.selectedRole && this.roles.some(role => role.id === this.selectedRole!.id);
          if (!hasSelectedRole) {
            this.selectRole(this.roles[0]);
          }
        } else {
          this.selectedRole = undefined;
          this.rolePermissions = [];
          this.filteredAssignedPermissions = [];
          this.assignedGroups = [];
          this.pagedAssignedGroups = [];
        }
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
        this.refreshAvailableGroups(true);
      },
      error: (error) => this.showError(error)
    });
  }

  selectRole(role: Role) {
    this.selectedRole = role;
    this.permissionSubmitted = false;
    this.pageInput = '';
    this.actionInput = '';
    this.permissionSearch = '';
    this.availableSearch = '';
    this.loadRolePermissions(role.id);
  }

  loadRolePermissions(roleId: string) {
    this.isLoading = true;
    this.permissionService.getRolePermissions(roleId).pipe(first()).subscribe({
      next: (permissions) => {
        this.rolePermissions = permissions;
        this.isLoading = false;
        this.refreshAssignedGroups(true);
        this.refreshAvailableGroups(true);
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
    const page = this.pageInput.trim();
    const action = this.actionInput.trim();
    if (!page || !action) {
      return;
    }
    const permission = this.toPermission(page, action);
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
    this.permissionService.addRolePermission(this.selectedRole.id, page, action).pipe(first()).subscribe({
      next: () => {
        this.permissionSubmitted = false;
        this.actionInput = '';
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
      title: this.translate.instant('PERMISSIONS_PAGE.DELETE_TITLE'),
      text: this.translate.instant('PERMISSIONS_PAGE.DELETE_TEXT', {
        permission,
        role: this.selectedRole.name
      }),
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('PERMISSIONS_PAGE.DELETE_CONFIRM'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
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
    const parsed = this.parsePermission(permission);
    this.pageInput = parsed.page;
    this.actionInput = parsed.action;
    this.permissionSubmitted = false;
  }

  useSuggestedPermissionByParts(page: string, action: string) {
    this.pageInput = page;
    this.actionInput = action;
    this.permissionSubmitted = false;
  }

  onAssignedSearchChange() {
    this.refreshAssignedGroups(true);
  }

  onAvailableSearchChange() {
    this.refreshAvailableGroups(true);
  }

  onAssignedPageChange(page: number) {
    this.assignedPager.page = page;
    this.pagedAssignedGroups = this.assignedPager.changePage(this.assignedGroups);
    this.syncExpandedState(this.pagedAssignedGroups, this.expandedAssignedPages);
  }

  onAvailablePageChange(page: number) {
    this.availablePager.page = page;
    this.pagedAvailableGroups = this.availablePager.changePage(this.availableGroups);
    this.syncExpandedState(this.pagedAvailableGroups, this.expandedAvailablePages);
  }

  toggleAssignedGroup(page: string) {
    if (this.expandedAssignedPages.has(page)) {
      this.expandedAssignedPages.delete(page);
      return;
    }
    this.expandedAssignedPages.add(page);
  }

  toggleAvailableGroup(page: string) {
    if (this.expandedAvailablePages.has(page)) {
      this.expandedAvailablePages.delete(page);
      return;
    }
    this.expandedAvailablePages.add(page);
  }

  isAssignedGroupExpanded(page: string): boolean {
    return this.expandedAssignedPages.has(page);
  }

  isAvailableGroupExpanded(page: string): boolean {
    return this.expandedAvailablePages.has(page);
  }

  get assignedPageCount(): number {
    return this.assignedGroups.length;
  }

  get availablePageCount(): number {
    return this.availableGroups.length;
  }

  private refreshAssignedGroups(resetPage = false) {
    const term = this.permissionSearch.trim().toLowerCase();
    this.filteredAssignedPermissions = !term
      ? [...this.rolePermissions]
      : this.rolePermissions.filter(permission => permission.toLowerCase().includes(term));

    this.assignedGroups = this.groupPermissions(this.filteredAssignedPermissions);
    if (resetPage) {
      this.assignedPager.page = 1;
    }
    this.pagedAssignedGroups = this.assignedPager.changePage(this.assignedGroups);
    this.syncExpandedState(this.pagedAssignedGroups, this.expandedAssignedPages);
  }

  private refreshAvailableGroups(resetPage = false) {
    const term = this.availableSearch.trim().toLowerCase();
    const assignedPermissions = new Set(this.rolePermissions.map(permission => permission.toLowerCase()));
    const availableOnly = this.allPermissions.filter(permission => !assignedPermissions.has(permission.toLowerCase()));
    this.filteredAvailablePermissions = !term
      ? availableOnly
      : availableOnly.filter(permission => permission.toLowerCase().includes(term));

    this.availableGroups = this.groupPermissions(this.filteredAvailablePermissions);
    if (resetPage) {
      this.availablePager.page = 1;
    }
    this.pagedAvailableGroups = this.availablePager.changePage(this.availableGroups);
    this.syncExpandedState(this.pagedAvailableGroups, this.expandedAvailablePages);
  }

  private syncExpandedState(groups: Array<{ page: string; actions: string[] }>, expandedSet: Set<string>) {
    const currentPages = new Set(groups.map(group => group.page));
    for (const page of Array.from(expandedSet)) {
      if (!currentPages.has(page)) {
        expandedSet.delete(page);
      }
    }

    if (groups.length > 0 && expandedSet.size === 0) {
      expandedSet.add(groups[0].page);
    }
  }

  private groupPermissions(permissions: string[]): Array<{ page: string; actions: string[] }> {
    const map = new Map<string, string[]>();
    for (const permission of permissions) {
      const { page, action } = this.parsePermission(permission);
      const key = page || 'General';
      if (!map.has(key)) {
        map.set(key, []);
      }
      const actions = map.get(key)!;
      if (!actions.some(existing => existing.toLowerCase() === action.toLowerCase())) {
        actions.push(action);
      }
    }

    return Array.from(map.entries())
      .map(([page, actions]) => ({
        page,
        actions: actions.sort((a, b) => a.localeCompare(b))
      }))
      .sort((a, b) => a.page.localeCompare(b.page));
  }

  private parsePermission(permission: string): { page: string; action: string } {
    const parts = (permission || '').split('.');
    if (parts.length < 2) {
      return { page: 'General', action: permission || '' };
    }

    const page = parts[0].trim();
    const action = parts.slice(1).join('.').trim();
    return { page, action };
  }

  private toPermission(page: string, action: string): string {
    return `${page.trim()}.${action.trim()}`;
  }

  private showError(error: any) {
    const message = getErrorMessage(error);
    this.toastService.show(message, {
      classname: 'bg-danger text-white',
      delay: 3000
    });
  }
}
