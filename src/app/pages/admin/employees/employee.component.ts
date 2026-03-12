import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { Role } from '../interfaces/role.interface';
import { AdminEmployee } from '../interfaces/employee-admin.interface';
import { AdminEmployeeService } from '../services/admin-employee.service';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';
import { BranchService } from '../services/branch.service';
import { Branch } from '../interfaces/branch.interface';
import { Department } from '../interfaces/department.interface';
import { DepartmentService } from '../services/department.service';
import { LookupDetail } from '../interfaces/lookup.interface';
import { LookupService } from '../services/lookup.service';
import { getErrorMessage } from '../shared/error-message.util';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.scss',
  standalone: false
})
export class EmployeeComponent implements OnInit {
  @Input() mode: 'create' | 'list' = 'list';
  @Input() openCreateOnInit = false;
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

  users: AdminEmployee[] = [];
  filteredUsers: AdminEmployee[] = [];
  pagedUsers: AdminEmployee[] = [];
  roles: Role[] = [];
  branches: Branch[] = [];
  departments: Department[] = [];
  employmentStatusLookups: LookupDetail[] = [];
  countryLookups: LookupDetail[] = [];
  selectedRoles: string[] = [];
  editSelectedRoles: string[] = [];
  userNameFilter = '';
  emailFilter = '';
  mobileNoFilter = '';
  branchNameFilter = '';
  employeeStatusFilter = '';
  selectedProfileImage: File | null = null;
  selectedEditProfileImage: File | null = null;
  profileImagePreview: string | null = null;
  editProfileImagePreview: string | null = null;
  previewImageUrl: string | null = null;
  selectedUserIds = new Set<string>();

  selectedUser?: AdminEmployee;
  selectedUserPermissions: string[] = [];
  userPermissionGroups: Array<{ page: string; actions: string[] }> = [];
  pagedUserPermissionGroups: Array<{ page: string; actions: string[] }> = [];
  expandedUserPermissionPages = new Set<string>();
  isPermissionModalOpen = false;
  isCreateModalOpen = false;
  isEditModalOpen = false;
  isPasswordModalOpen = false;
  public permissionsPager = new PaginationService();

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private adminEmployeeService: AdminEmployeeService,
    private roleService: RoleService,
    private permissionService: PermissionService,
    private branchService: BranchService,
    private departmentService: DepartmentService,
    private lookupService: LookupService,
    private toastService: ToastService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.EMPLOYEE_MANAGEMENT.TEXT') },
      { label: this.mode === 'create' ? this.translate.instant('EMPLOYEE_PAGE.CREATE_TITLE') : this.translate.instant('EMPLOYEE_PAGE.LIST_TITLE'), active: true }
    ];

    this.createUserForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      userName: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nameEn: ['', Validators.required],
      nameAr: ['', Validators.required],
      branchId: [null, Validators.required],
      employeeNo: [''],
      nationalId: ['', Validators.required],
      jobTitle: [''],
      departmentId: [null, Validators.required],
      hireDate: [''],
      terminationDate: [''],
      employmentStatus: ['1'],
      workEmail: [''],
      workPhone: [''],
      extension: [''],
      dateOfBirth: [''],
      gender: [''],
      nationality: [''],
      addressLine1: [''],
      addressLine2: [''],
      city: [''],
      region: [''],
      postalCode: ['']
    });

    this.editUserForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      userName: ['', [Validators.required, Validators.minLength(3)]],
      nameEn: ['', Validators.required],
      nameAr: ['', Validators.required],
      branchId: [null, Validators.required],
      employeeNo: [''],
      nationalId: [''],
      jobTitle: [''],
      departmentId: [null, Validators.required],
      hireDate: [''],
      terminationDate: [''],
      employmentStatus: [''],
      workEmail: [''],
      workPhone: [''],
      extension: [''],
      dateOfBirth: [''],
      gender: [''],
      nationality: [''],
      addressLine1: [''],
      addressLine2: [''],
      city: [''],
      region: [''],
      postalCode: ['']
    });

    this.changePasswordForm = this.formBuilder.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });

    if (this.mode === 'create') {
      this.loadCreatePageData();
      return;
    }
    this.loadListPageData();
    if (this.openCreateOnInit) {
      this.openCreateModal();
    }
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

  private loadCreatePageData() {
    this.isLoading = true;
    forkJoin({
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
      ),
      departments: this.departmentService.getDepartments().pipe(
        first(),
        catchError((error) => {
          this.showError(error);
          return of([] as Department[]);
        })
      ),
      statuses: this.lookupService.getByMasterCode('EMPLOYMENT_STATUS').pipe(
        first(),
        catchError((error) => {
          this.showError(error);
          return of([] as LookupDetail[]);
        })
      ),
      countries: this.lookupService.getByMasterCode('COUNTRY').pipe(
        first(),
        catchError((error) => {
          this.showError(error);
          return of([] as LookupDetail[]);
        })
      )
    }).subscribe({
      next: ({ roles, branches, departments, statuses, countries }) => {
        this.roles = roles;
        this.branches = branches;
        this.departments = departments;
        this.employmentStatusLookups = statuses;
        this.countryLookups = countries;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private loadListPageData() {
    this.isLoading = true;
    forkJoin({
      users: this.adminEmployeeService.getEmployees().pipe(
        first(),
        catchError((error) => {
          this.showError(error);
          return of([] as AdminEmployee[]);
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
      ),
      departments: this.departmentService.getDepartments().pipe(
        first(),
        catchError((error) => {
          this.showError(error);
          return of([] as Department[]);
        })
      ),
      statuses: this.lookupService.getByMasterCode('EMPLOYMENT_STATUS').pipe(
        first(),
        catchError((error) => {
          this.showError(error);
          return of([] as LookupDetail[]);
        })
      ),
      countries: this.lookupService.getByMasterCode('COUNTRY').pipe(
        first(),
        catchError((error) => {
          this.showError(error);
          return of([] as LookupDetail[]);
        })
      )
    }).subscribe({
      next: ({ users, roles, branches, departments, statuses, countries }) => {
        this.users = users;
        this.roles = roles;
        this.branches = branches;
        this.departments = departments;
        this.employmentStatusLookups = statuses;
        this.countryLookups = countries;
        this.selectedUserIds.clear();
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
    this.mobileNoFilter = '';
    this.branchNameFilter = '';
    this.employeeStatusFilter = '';
    this.applyFilters(true);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  createEmployee() {
    this.submitted = true;
    if (this.createUserForm.invalid) {
      return;
    }
    if (this.selectedRoles.length === 0) {
      return;
    }

    this.isCreating = true;
    this.adminEmployeeService.createEmployee({
      email: this.form['email'].value,
      userName: this.form['userName'].value,
      password: this.form['password'].value,
      nameEn: this.form['nameEn'].value,
      nameAr: this.form['nameAr'].value,
      roles: this.selectedRoles,
      branchId: this.form['branchId'].value,
      profileImage: this.selectedProfileImage || undefined,
      employeeNo: this.form['employeeNo'].value,
      nationalId: this.form['nationalId'].value,
      jobTitle: this.form['jobTitle'].value,
      departmentId: this.form['departmentId'].value,
      hireDate: this.form['hireDate'].value,
      terminationDate: this.form['terminationDate'].value || undefined,
      employmentStatus: this.form['employmentStatus'].value || '1',
      workEmail: this.form['workEmail'].value || undefined,
      workPhone: this.form['workPhone'].value || undefined,
      extension: this.form['extension'].value || undefined,
      dateOfBirth: this.form['dateOfBirth'].value || undefined,
      gender: this.form['gender'].value || undefined,
      nationality: this.form['nationality'].value || undefined,
      addressLine1: this.form['addressLine1'].value || undefined,
      addressLine2: this.form['addressLine2'].value || undefined,
      city: this.form['city'].value || undefined,
      region: this.form['region'].value || undefined,
      postalCode: this.form['postalCode'].value || undefined
    }).pipe(first()).subscribe({
      next: () => {
        this.isCreating = false;
        this.resetCreateForm();
        this.showSuccess(this.translate.instant('EMPLOYEE_PAGE.CREATE_SUCCESS'));
        if (this.mode === 'list') {
          this.isCreateModalOpen = false;
          this.loadListPageData();
          return;
        }
        this.loadCreatePageData();
      },
      error: (error) => {
        this.isCreating = false;
        this.showError(error);
      }
    });
  }

  openCreateModal() {
    this.submitted = false;
    this.isCreateModalOpen = true;
    if (this.roles.length === 0 || this.branches.length === 0 || this.departments.length === 0) {
      this.loadCreatePageData();
    }
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
    this.resetCreateForm();
  }

  async deleteEmployee(user: AdminEmployee) {
    const result = await Swal.fire({
      title: this.translate.instant('EMPLOYEE_PAGE.DELETE_USER_TITLE', { userName: user.userName }),
      text: this.translate.instant('EMPLOYEE_PAGE.DELETE_USER_TEXT'),
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES_DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    });

    if (!result.isConfirmed) {
      return;
    }

    this.adminEmployeeService.deleteEmployee(user.id).pipe(first()).subscribe({
      next: () => {
        this.showSuccess(this.translate.instant('EMPLOYEE_PAGE.DELETE_SUCCESS'));
        this.loadListPageData();
      },
      error: (error) => this.showError(error)
    });
  }

  lockUnlock(user: AdminEmployee) {
    const request = user.isLocked
      ? this.adminEmployeeService.unlockEmployee(user.id)
      : this.adminEmployeeService.lockEmployee(user.id);

    request.pipe(first()).subscribe({
      next: () => {
        this.showSuccess(user.isLocked ? this.translate.instant('EMPLOYEE_PAGE.UNLOCK_SUCCESS') : this.translate.instant('EMPLOYEE_PAGE.LOCK_SUCCESS'));
        this.loadListPageData();
      },
      error: (error) => this.showError(error)
    });
  }

  private applyRoleChanges(userId: string, toAdd: string[], toRemove: string[], onSuccess: () => void) {
    const addRequests = toAdd.map(role => this.adminEmployeeService.assignRole(userId, role));
    const removeRequests = toRemove.map(role => this.adminEmployeeService.removeRole(userId, role));
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

  openPermissionsModal(user: AdminEmployee) {
    this.selectedUser = user;
    this.isPermissionModalOpen = true;
    this.selectedUserPermissions = [];
    this.userPermissionGroups = [];
    this.pagedUserPermissionGroups = [];
    this.permissionService.getEmployeePermissions(user.id).pipe(first()).subscribe({
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

  openEditModal(user: AdminEmployee) {
    this.selectedUser = user;
    this.editSubmitted = false;
    this.isEditModalOpen = true;
    this.editSelectedRoles = [];
    this.selectedEditProfileImage = null;
    this.editProfileImagePreview = null;
    this.editUserForm.patchValue({
      email: user.email,
      userName: user.userName,
      nameEn: user.nameEn,
      nameAr: user.nameAr,
      branchId: user.branchId,
      employeeNo: user.employeeNo,
      nationalId: user.nationalId,
      jobTitle: user.jobTitle,
      departmentId: user.departmentId,
      hireDate: this.toDateInputValue(user.hireDate),
      terminationDate: this.toDateInputValue(user.terminationDate),
      employmentStatus: user.employmentStatus,
      workEmail: user.workEmail,
      workPhone: user.workPhone,
      extension: user.extension,
      dateOfBirth: this.toDateInputValue(user.dateOfBirth),
      gender: user.gender,
      nationality: user.nationality,
      addressLine1: user.addressLine1,
      addressLine2: user.addressLine2,
      city: user.city,
      region: user.region,
      postalCode: user.postalCode
    });

    this.adminEmployeeService.getEmployeeRoles(user.id).pipe(first()).subscribe({
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

  updateEmployeeDetails() {
    this.editSubmitted = true;
    if (!this.selectedUser || this.editUserForm.invalid) {
      return;
    }

    this.isUpdatingUser = true;
    this.adminEmployeeService.updateEmployee(this.selectedUser.id, {
      email: this.editForm['email'].value,
      userName: this.editForm['userName'].value,
      nameEn: this.editForm['nameEn'].value,
      nameAr: this.editForm['nameAr'].value,
      branchId: this.editForm['branchId'].value,
      profileImage: this.selectedEditProfileImage || undefined,
      employeeNo: this.editForm['employeeNo'].value || undefined,
      nationalId: this.editForm['nationalId'].value || undefined,
      jobTitle: this.editForm['jobTitle'].value || undefined,
      departmentId: this.editForm['departmentId'].value || undefined,
      hireDate: this.editForm['hireDate'].value || undefined,
      terminationDate: this.editForm['terminationDate'].value || undefined,
      employmentStatus: this.editForm['employmentStatus'].value || undefined,
      workEmail: this.editForm['workEmail'].value || undefined,
      workPhone: this.editForm['workPhone'].value || undefined,
      extension: this.editForm['extension'].value || undefined,
      dateOfBirth: this.editForm['dateOfBirth'].value || undefined,
      gender: this.editForm['gender'].value || undefined,
      nationality: this.editForm['nationality'].value || undefined,
      addressLine1: this.editForm['addressLine1'].value || undefined,
      addressLine2: this.editForm['addressLine2'].value || undefined,
      city: this.editForm['city'].value || undefined,
      region: this.editForm['region'].value || undefined,
      postalCode: this.editForm['postalCode'].value || undefined
    }).pipe(first()).subscribe({
      next: () => {
        this.adminEmployeeService.getEmployeeRoles(this.selectedUser!.id).pipe(first()).subscribe({
          next: (currentRoles) => {
            const toAdd = this.editSelectedRoles.filter(r => !currentRoles.includes(r));
            const toRemove = currentRoles.filter(r => !this.editSelectedRoles.includes(r));
            this.applyRoleChanges(this.selectedUser!.id, toAdd, toRemove, () => {
              this.isUpdatingUser = false;
              Swal.fire({
                title: this.translate.instant('COMMON.UPDATE'),
                text: this.translate.instant('EMPLOYEE_PAGE.UPDATE_SUCCESS'),
                icon: 'success',
                confirmButtonText: this.translate.instant('COMMON.OK')
              });
              this.closeEditModal();
              this.loadListPageData();
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

  openPasswordModal(user: AdminEmployee) {
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

  changeEmployeePassword() {
    this.passwordSubmitted = true;
    if (!this.selectedUser || this.changePasswordForm.invalid) {
      return;
    }

    this.isChangingPassword = true;
    this.adminEmployeeService.changeEmployeePassword(
      this.selectedUser.id,
      this.passwordForm['newPassword'].value
    ).pipe(first()).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.showSuccess(this.translate.instant('EMPLOYEE_PAGE.PASSWORD_CHANGED_SUCCESS'));
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
    const mobileNoTerm = this.mobileNoFilter.trim().toLowerCase();
    const branchNameTerm = this.branchNameFilter.trim().toLowerCase();
    const employeeStatusTerm = this.employeeStatusFilter.trim();

    if (userNameTerm) {
      data = data.filter(user => (user.userName || '').toLowerCase().includes(userNameTerm));
    }

    if (emailTerm) {
      data = data.filter(user => (user.email || '').toLowerCase().includes(emailTerm));
    }

    if (mobileNoTerm) {
      data = data.filter(user => (user.mobileNo || '').toLowerCase().includes(mobileNoTerm));
    }

    if (branchNameTerm) {
      data = data.filter(user => {
        const name = (user.branchName || this.getBranchName(user.branchId) || '').toLowerCase();
        return name.includes(branchNameTerm);
      });
    }

    if (employeeStatusTerm) {
      data = data.filter(user => (user.employmentStatus || '') === employeeStatusTerm);
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
      const key = page || this.translate.instant('COMMON.GENERAL');
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
      return { page: this.translate.instant('COMMON.GENERAL'), action: permission || '' };
    }
    return {
      page: parts[0],
      action: parts.slice(1).join('.')
    };
  }

  getBranchName(branchId: number): string {
    const branch = this.branches.find(b => b.id === branchId);
    return branch ? branch.branchNameEn : this.translate.instant('COMMON.NOT_AVAILABLE');
  }

  onProfileImageSelected(event: any) {
    const file = event.target?.files?.[0];
    if (!file) {
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      this.showError({ message: this.translate.instant('EMPLOYEE_PAGE.IMAGE_ONLY_ERROR') });
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
      this.showError({ message: this.translate.instant('EMPLOYEE_PAGE.IMAGE_READ_ERROR') });
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
      this.showError({ message: this.translate.instant('EMPLOYEE_PAGE.IMAGE_ONLY_ERROR') });
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
      this.showError({ message: this.translate.instant('EMPLOYEE_PAGE.IMAGE_READ_ERROR') });
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

  previewImage(imageUrl: string) {
    this.previewImageUrl = imageUrl;
  }

  closePreview() {
    this.previewImageUrl = null;
  }

  toggleUserSelection(userId: string, checked: boolean) {
    if (checked) {
      this.selectedUserIds.add(userId);
    } else {
      this.selectedUserIds.delete(userId);
    }
  }

  toggleSelectAll(checked: boolean) {
    if (checked) {
      this.pagedUsers.forEach(user => this.selectedUserIds.add(user.id));
    } else {
      this.selectedUserIds.clear();
    }
  }

  isAllSelected(): boolean {
    return this.pagedUsers.length > 0 && this.pagedUsers.every(user => this.selectedUserIds.has(user.id));
  }

  get totalEmployeesCount(): number {
    return this.filteredUsers.length;
  }

  get activeEmployeesCount(): number {
    return this.filteredUsers.filter(user => (user.employmentStatus || '') === '1').length;
  }

  get onLeaveEmployeesCount(): number {
    return this.filteredUsers.filter(user => (user.employmentStatus || '') === '2').length;
  }

  get terminatedEmployeesCount(): number {
    return this.filteredUsers.filter(user => (user.employmentStatus || '') === '3').length;
  }

  bulkDeleteEmployees() {
    if (this.selectedUserIds.size === 0) return;

    Swal.fire({
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('EMPLOYEE_PAGE.BULK_DELETE_TEXT', { count: this.selectedUserIds.size }),
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES_DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        const userIds = Array.from(this.selectedUserIds);
        this.adminEmployeeService.bulkDeleteEmployees(userIds).pipe(first()).subscribe({
          next: (response) => {
            this.selectedUserIds.clear();
            if (response.failedIds.length > 0) {
              this.showError({ message: this.translate.instant('EMPLOYEE_PAGE.BULK_DELETE_PARTIAL', { deleted: response.deletedCount, failed: response.failedIds.length }) });
            } else {
              this.showSuccess(this.translate.instant('EMPLOYEE_PAGE.BULK_DELETE_SUCCESS', { count: response.deletedCount }));
            }
            this.loadListPageData();
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }

  bulkDeleteUsers() {
    this.bulkDeleteEmployees();
  }

  private toDateInputValue(value?: string): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().slice(0, 10);
  }

  private resetCreateForm() {
    this.createUserForm.reset({
      email: '',
      userName: '',
      password: '',
      nameEn: '',
      nameAr: '',
      branchId: null,
      employeeNo: '',
      nationalId: '',
      jobTitle: '',
      departmentId: null,
      hireDate: '',
      terminationDate: '',
      employmentStatus: '1',
      workEmail: '',
      workPhone: '',
      extension: '',
      dateOfBirth: '',
      gender: '',
      nationality: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      region: '',
      postalCode: ''
    });
    this.selectedRoles = [];
    this.selectedProfileImage = null;
    this.profileImagePreview = null;
    this.showPassword = false;
    this.submitted = false;
  }

  getEmploymentStatusLabel(statusCode?: string): string {
    if (!statusCode) return '-';
    const status = this.employmentStatusLookups.find(item => item.detailCode === statusCode);
    if (!status) return statusCode;
    return status.nameAr && status.nameEn ? `${status.nameAr} - ${status.nameEn}` : (status.nameEn || status.nameAr || statusCode);
  }

  getEmployeeDisplayName(user: AdminEmployee): string {
    const isArabic = (this.translate.currentLang || 'ar').toLowerCase().startsWith('ar');
    const fullNameAr = (user.fullNameAr || '').trim();
    const fullNameEn = (user.fullNameEn || '').trim();

    if (isArabic) {
      return fullNameAr || fullNameEn || (user.nameAr || '').trim() || (user.nameEn || '').trim() || user.userName;
    }

    return fullNameEn || fullNameAr || (user.nameEn || '').trim() || (user.nameAr || '').trim() || user.userName;
  }
}
