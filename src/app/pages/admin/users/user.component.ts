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
  pagedUsers: AdminUser[] = [];
  roles: Role[] = [];
  selectedRoles: string[] = [];
  editSelectedRoles: string[] = [];

  selectedUser?: AdminUser;
  selectedUserPermissions: string[] = [];
  isPermissionModalOpen = false;
  isEditModalOpen = false;
  isPasswordModalOpen = false;

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private adminUserService: AdminUserService,
    private roleService: RoleService,
    private permissionService: PermissionService,
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
      lastName: ['']
    });

    this.editUserForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      userName: ['', [Validators.required, Validators.minLength(3)]],
      firstName: [''],
      lastName: ['']
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
      )
    }).subscribe({
      next: ({ users, roles }) => {
        this.users = users;
        this.service.page = 1;
        this.pagedUsers = this.service.changePage(this.users);
        this.roles = roles;
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
    this.pagedUsers = this.service.changePage(this.users);
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
      roles: this.selectedRoles
    }).pipe(first()).subscribe({
      next: () => {
        this.isCreating = false;
        this.createUserForm.reset();
        this.submitted = false;
        this.selectedRoles = [];
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
    this.permissionService.getUserPermissions(user.id).pipe(first()).subscribe({
      next: (permissions) => {
        this.selectedUserPermissions = permissions;
      },
      error: (error) => this.showError(error)
    });
  }

  closePermissionsModal() {
    this.isPermissionModalOpen = false;
    this.selectedUser = undefined;
    this.selectedUserPermissions = [];
  }

  openEditModal(user: AdminUser) {
    this.selectedUser = user;
    this.editSubmitted = false;
    this.isEditModalOpen = true;
    this.editSelectedRoles = [];
    this.editUserForm.patchValue({
      email: user.email,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName
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
      lastName: this.editForm['lastName'].value
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
}
