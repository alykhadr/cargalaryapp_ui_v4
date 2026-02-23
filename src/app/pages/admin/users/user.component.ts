import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { Role } from '../interfaces/role.interface';
import { AdminUser } from '../interfaces/user-admin.interface';
import { AdminUserService } from '../services/admin-user.service';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';
import { BranchService } from '../services/branch.service';
import { Branch } from '../interfaces/branch.interface';
import { getErrorMessage } from '../shared/error-message.util';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss',
  standalone: false
})
export class UserComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  createUserForm!: UntypedFormGroup;
  editUserForm!: UntypedFormGroup;
  changePasswordForm!: UntypedFormGroup;
  isLoading = false;
  isCreating = false;
  isUpdatingUser = false;
  isChangingPassword = false;
  submitted = false;
  editSubmitted = false;
  passwordSubmitted = false;
  showPassword = false;
  showNewPassword = false;

  users: AdminUser[] = [];
  filteredUsers: AdminUser[] = [];
  pagedUsers: AdminUser[] = [];
  roles: Role[] = [];
  branches: Branch[] = [];
  selectedRoles: string[] = [];
  editSelectedRoles: string[] = [];
  userNameFilter = '';
  emailFilter = '';
  statusFilter: '' | 'active' | 'locked' = '';
  selectedProfileImage: File | null = null;
  selectedEditProfileImage: File | null = null;
  profileImagePreview: string | null = null;
  editProfileImagePreview: string | null = null;

  selectedUser?: AdminUser;
  selectedUserPermissions: string[] = [];
  userPermissionGroups: Array<{ page: string; actions: string[] }> = [];
  pagedUserPermissionGroups: Array<{ page: string; actions: string[] }> = [];
  expandedUserPermissionPages = new Set<string>();
  isPermissionModalOpen = false;
  isEditModalOpen = false;
  isPasswordModalOpen = false;
  public permissionsPager = new PaginationService();

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private adminUserService: AdminUserService,
    private roleService: RoleService,
    private permissionService: PermissionService,
    private branchService: BranchService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Admin' },
      { label: 'Users', active: true }
    ];

    this.createUserForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      userName: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      firstName: [''],
      lastName: [''],
      branchId: [null, Validators.required]
    });

    this.editUserForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      userName: ['', [Validators.required, Validators.minLength(3)]],
      firstName: [''],
      lastName: [''],
      branchId: [null, Validators.required]
    });

    this.changePasswordForm = this.formBuilder.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.loadUsersAndRoles();
  }

  get form() {
    return this.createUserForm.controls;
  }

  get editForm() {
    return this.editUserForm.controls;
  }

  get passwordForm() {
    return this.changePasswordForm.controls;
  }

  loadUsersAndRoles() {
    this.isLoading = true;
    forkJoin({
      users: this.adminUserService.getUsers().pipe(
        first(),
        catchError((error) => {
          this.showError(error);
          return of([] as AdminUser[]);
        })
      ),
      roles: this.roleService.getRoles().pipe(
        first(),
        catchError((error) => {
          this.showError(error);
          return of([] as Role[]);
        })
      ),
      branches: this.branchService.getBranches().pipe(
        first(),
        catchError((error) => {
          this.showError(error);
          return of([] as Branch[]);
        })
      )
    }).subscribe({
      next: ({ users, roles, branches }) => {
        this.users = users;
        this.roles = roles;
        this.branches = branches;
        this.applyFilters(true);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  toggleCreateRole(roleName: string, checked: boolean) {
    if (checked) {
      if (!this.selectedRoles.includes(roleName)) {
        this.selectedRoles.push(roleName);
      }
      return;
    }

    this.selectedRoles = this.selectedRoles.filter(r => r !== roleName);
  }

  onPageChange(page: number) {
    this.service.page = page;
    this.pagedUsers = this.service.changePage(this.filteredUsers);
  }

  onFiltersChanged() {
    this.applyFilters(true);
  }

  clearFilters() {
    this.userNameFilter = '';
    this.emailFilter = '';
    this.statusFilter = '';
    this.applyFilters(true);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  createUser() {
    this.submitted = true;
    if (this.createUserForm.invalid) {
      return;
    }
    if (this.selectedRoles.length === 0) {
      return;
    }

    this.isCreating = true;
    this.adminUserService.createUser({
      email: this.form['email'].value,
      userName: this.form['userName'].value,
      password: this.form['password'].value,
      firstName: this.form['firstName'].value,
      lastName: this.form['lastName'].value,
      roles: this.selectedRoles,
      branchId: this.form['branchId'].value,
      profileImage: this.selectedProfileImage || undefined
    }).pipe(first()).subscribe({
      next: () => {
        this.isCreating = false;
        this.createUserForm.reset();
        this.submitted = false;
        this.selectedRoles = [];
        this.selectedProfileImage = null;
        this.profileImagePreview = null;
        this.showSuccess('User created successfully');
        this.loadUsersAndRoles();
      },
      error: (error) => {
        this.isCreating = false;
        this.showError(error);
      }
    });
  }

  async deleteUser(user: AdminUser) {
    const result = await Swal.fire({
      title: `Delete ${user.userName}?`,
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.adminUserService.deleteUser(user.id).pipe(first()).subscribe({
      next: () => {
        this.showSuccess('User deleted successfully');
        this.loadUsersAndRoles();
      },
      error: (error) => this.showError(error)
    });
  }

  lockUnlock(user: AdminUser) {
    const request = user.isLocked
      ? this.adminUserService.unlockUser(user.id)
      : this.adminUserService.lockUser(user.id);

    request.pipe(first()).subscribe({
      next: () => {
        this.showSuccess(user.isLocked ? 'User unlocked' : 'User locked');
        this.loadUsersAndRoles();
      },
      error: (error) => this.showError(error)
    });
  }

  private applyRoleChanges(userId: string, toAdd: string[], toRemove: string[], onSuccess: () => void) {
    const addRequests = toAdd.map(role => this.adminUserService.assignRole(userId, role));
    const removeRequests = toRemove.map(role => this.adminUserService.removeRole(userId, role));
    const requests = [...addRequests, ...removeRequests];

    if (requests.length === 0) {
      onSuccess();
      return;
    }

    let completed = 0;
    let hasError = false;
    requests.forEach(req => {
      req.pipe(first()).subscribe({
        next: () => {
          completed++;
          if (completed === requests.length && !hasError) {
            onSuccess();
          }
        },
        error: (error) => {
          if (!hasError) {
            hasError = true;
            this.showError(error);
            this.isUpdatingUser = false;
          }
        }
      });
    });
  }

  openPermissionsModal(user: AdminUser) {
    this.selectedUser = user;
    this.isPermissionModalOpen = true;
    this.selectedUserPermissions = [];
    this.userPermissionGroups = [];
    this.pagedUserPermissionGroups = [];
    this.permissionService.getUserPermissions(user.id).pipe(first()).subscribe({
      next: (permissions) => {
        this.selectedUserPermissions = permissions;
        this.refreshUserPermissionGroups(true);
      },
      error: (error) => this.showError(error)
    });
  }

  closePermissionsModal() {
    this.isPermissionModalOpen = false;
    this.selectedUser = undefined;
    this.selectedUserPermissions = [];
    this.userPermissionGroups = [];
    this.pagedUserPermissionGroups = [];
    this.expandedUserPermissionPages.clear();
  }

  openEditModal(user: AdminUser) {
    this.selectedUser = user;
    this.editSubmitted = false;
    this.isEditModalOpen = true;
    this.editSelectedRoles = [];
    this.selectedEditProfileImage = null;
    this.editProfileImagePreview = null;
    this.editUserForm.patchValue({
      email: user.email,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      branchId: user.branchId
    });

    this.adminUserService.getUserRoles(user.id).pipe(first()).subscribe({
      next: (roles) => {
        this.editSelectedRoles = roles;
      },
      error: (error) => this.showError(error)
    });
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.isUpdatingUser = false;
    this.editSubmitted = false;
    this.editSelectedRoles = [];
    this.selectedUser = undefined;
    this.selectedEditProfileImage = null;
    this.editProfileImagePreview = null;
  }

  toggleEditRole(roleName: string, checked: boolean) {
    if (checked) {
      if (!this.editSelectedRoles.includes(roleName)) {
        this.editSelectedRoles.push(roleName);
      }
      return;
    }

    this.editSelectedRoles = this.editSelectedRoles.filter(r => r !== roleName);
  }

  updateUserDetails() {
    this.editSubmitted = true;
    if (!this.selectedUser || this.editUserForm.invalid) {
      return;
    }

    this.isUpdatingUser = true;
    this.adminUserService.updateUser(this.selectedUser.id, {
      email: this.editForm['email'].value,
      userName: this.editForm['userName'].value,
      firstName: this.editForm['firstName'].value,
      lastName: this.editForm['lastName'].value,
      branchId: this.editForm['branchId'].value,
      profileImage: this.selectedEditProfileImage || undefined
    }).pipe(first()).subscribe({
      next: () => {
        this.adminUserService.getUserRoles(this.selectedUser!.id).pipe(first()).subscribe({
          next: (currentRoles) => {
            const toAdd = this.editSelectedRoles.filter(r => !currentRoles.includes(r));
            const toRemove = currentRoles.filter(r => !this.editSelectedRoles.includes(r));
            this.applyRoleChanges(this.selectedUser!.id, toAdd, toRemove, () => {
              this.isUpdatingUser = false;
              this.showSuccess('User and roles updated successfully');
              this.closeEditModal();
              this.loadUsersAndRoles();
            });
          },
          error: (error) => {
            this.isUpdatingUser = false;
            this.showError(error);
          }
        });
      },
      error: (error) => {
        this.isUpdatingUser = false;
        this.showError(error);
      }
    });
  }

  openPasswordModal(user: AdminUser) {
    this.selectedUser = user;
    this.passwordSubmitted = false;
    this.showNewPassword = false;
    this.changePasswordForm.reset();
    this.isPasswordModalOpen = true;
  }

  closePasswordModal() {
    this.isPasswordModalOpen = false;
    this.isChangingPassword = false;
    this.passwordSubmitted = false;
    this.showNewPassword = false;
    this.selectedUser = undefined;
  }

  changeUserPassword() {
    this.passwordSubmitted = true;
    if (!this.selectedUser || this.changePasswordForm.invalid) {
      return;
    }

    this.isChangingPassword = true;
    this.adminUserService.changeUserPassword(
      this.selectedUser.id,
      this.passwordForm['newPassword'].value
    ).pipe(first()).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.showSuccess('Password changed successfully');
        this.closePasswordModal();
      },
      error: (error) => {
        this.isChangingPassword = false;
        this.showError(error);
      }
    });
  }

  private showSuccess(message: string) {
    this.toastService.show(message, {
      classname: 'bg-success text-white',
      delay: 3000
    });
  }

  private showError(error: any) {
    const message = getErrorMessage(error);

    this.toastService.show(message, {
      classname: 'bg-danger text-white',
      delay: 3000
    });

  }

  private applyFilters(resetPage = false) {
    let data = [...this.users];
    const userNameTerm = this.userNameFilter.trim().toLowerCase();
    const emailTerm = this.emailFilter.trim().toLowerCase();

    if (userNameTerm) {
      data = data.filter(user => (user.userName || '').toLowerCase().includes(userNameTerm));
    }

    if (emailTerm) {
      data = data.filter(user => (user.email || '').toLowerCase().includes(emailTerm));
    }

    if (this.statusFilter) {
      const isLocked = this.statusFilter === 'locked';
      data = data.filter(user => user.isLocked === isLocked);
    }

    this.filteredUsers = data;
    if (resetPage) {
      this.service.page = 1;
    }
    this.pagedUsers = this.service.changePage(this.filteredUsers);
  }

  onPermissionPageChange(page: number) {
    this.permissionsPager.page = page;
    this.pagedUserPermissionGroups = this.permissionsPager.changePage(this.userPermissionGroups);
    this.syncExpandedState(this.pagedUserPermissionGroups, this.expandedUserPermissionPages);
  }

  togglePermissionGroup(page: string) {
    if (this.expandedUserPermissionPages.has(page)) {
      this.expandedUserPermissionPages.delete(page);
      return;
    }
    this.expandedUserPermissionPages.add(page);
  }

  isPermissionGroupExpanded(page: string): boolean {
    return this.expandedUserPermissionPages.has(page);
  }

  private refreshUserPermissionGroups(resetPage = false) {
    this.userPermissionGroups = this.groupPermissions(this.selectedUserPermissions);
    if (resetPage) {
      this.permissionsPager.page = 1;
    }
    this.pagedUserPermissionGroups = this.permissionsPager.changePage(this.userPermissionGroups);
    this.syncExpandedState(this.pagedUserPermissionGroups, this.expandedUserPermissionPages);
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
    return {
      page: parts[0],
      action: parts.slice(1).join('.')
    };
  }

  getBranchName(branchId: number): string {
    const branch = this.branches.find(b => b.id === branchId);
    return branch ? branch.branchNameEn : 'N/A';
  }

  onProfileImageSelected(event: any) {
    const file = event.target?.files?.[0];
    if (!file) {
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      this.showError({ message: 'Please select only image files' });
      event.target.value = '';
      this.selectedProfileImage = null;
      this.profileImagePreview = null;
      return;
    }
    
    this.selectedProfileImage = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.profileImagePreview = e.target.result as string;
    };
    reader.onerror = () => {
      this.showError({ message: 'Failed to read image file' });
      this.selectedProfileImage = null;
      this.profileImagePreview = null;
    };
    reader.readAsDataURL(file);
  }

  onEditProfileImageSelected(event: any) {
    const file = event.target?.files?.[0];
    if (!file) {
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      this.showError({ message: 'Please select only image files' });
      event.target.value = '';
      this.selectedEditProfileImage = null;
      return;
    }
    
    this.selectedEditProfileImage = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.editProfileImagePreview = e.target.result as string;
    };
    reader.onerror = () => {
      this.showError({ message: 'Failed to read image file' });
      this.selectedEditProfileImage = null;
    };
    reader.readAsDataURL(file);
  }

  getProfileImageUrl(url?: string): string {
    if (!url) return 'https://ui-avatars.com/api/?name=User&size=120&background=405189&color=fff';
    if (url.startsWith('http')) return url;
    if (url.startsWith('data:')) return url; // Handle base64 preview
    // Remove leading slash if present and construct full URL
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `http://localhost:5087/${cleanUrl}`;
  }

  getEditImageUrl(): string {
    if (this.editProfileImagePreview) {
      return this.editProfileImagePreview; // New preview (base64)
    }
    return this.getProfileImageUrl(this.selectedUser?.profileImageUrl);
  }
}
