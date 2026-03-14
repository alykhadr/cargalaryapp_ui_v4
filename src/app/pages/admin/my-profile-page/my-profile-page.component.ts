import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AdminEmployee } from '../interfaces/employee-admin.interface';
import { Branch } from '../interfaces/branch.interface';
import { Department } from '../interfaces/department.interface';
import { LookupDetail } from '../interfaces/lookup.interface';
import { AdminEmployeeService } from '../services/admin-employee.service';
import { BranchService } from '../services/branch.service';
import { DepartmentService } from '../services/department.service';
import { LookupService } from '../services/lookup.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { GlobalComponent } from 'src/app/global-component';

@Component({
  selector: 'app-my-profile-page',
  templateUrl: './my-profile-page.component.html',
  styleUrls: ['./my-profile-page.component.scss'],
  standalone: false
})
export class MyProfilePageComponent implements OnInit {
  isLoading = true;
  isSaving = false;
  isUpdatingCredentials = false;
  submitted = false;
  credentialsSubmitted = false;
  showNewPassword = false;
  loadError = '';
  passwordSuccessMessage = '';
  passwordErrorMessage = '';

  currentEmployee: AdminEmployee | null = null;
  branches: Branch[] = [];
  departments: Department[] = [];
  employmentStatusLookups: LookupDetail[] = [];

  profilePreviewUrl = '';
  profileImageVersion = Date.now();
  selectedProfileImage?: File;

  form = this.fb.group({
    userName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    nameEn: ['', [Validators.required]],
    nameAr: ['', [Validators.required]],
    branchId: [{ value: null as number | null, disabled: true }],
    employeeNo: [''],
    nationalId: [''],
    jobTitle: [''],
    departmentId: [{ value: null as number | null, disabled: true }],
    hireDate: [{ value: '', disabled: true }],
    terminationDate: [''],
    employmentStatus: [''],
    workEmail: ['', Validators.email],
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

  accountCredentialsForm = this.fb.group({
    userName: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor(
    private fb: FormBuilder,
    private adminEmployeeService: AdminEmployeeService,
    private branchService: BranchService,
    private departmentService: DepartmentService,
    private lookupService: LookupService,
    private tokenStorageService: TokenStorageService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadLookupData();
    this.loadCurrentEmployeeProfile();
  }

  private loadLookupData(): void {
    this.branchService.getBranches().pipe(first()).subscribe({
      next: (branches) => {
        this.branches = Array.isArray(branches) ? branches : [];
      }
    });

    this.departmentService.getDepartments().pipe(first()).subscribe({
      next: (departments) => {
        this.departments = Array.isArray(departments) ? departments : [];
      }
    });

    this.lookupService.getByMasterCode('EMPLOYMENT_STATUS').pipe(first()).subscribe({
      next: (statuses) => {
        this.employmentStatusLookups = Array.isArray(statuses) ? statuses : [];
      }
    });
  }

  private loadCurrentEmployeeProfile(): void {
    this.isLoading = true;
    this.loadError = '';

    const authUser = this.tokenStorageService.getUser() || {};
    const authEmployeeId = Number(authUser.employeeId);
    const authUserId = (authUser.id || authUser.userId || '').toString().trim().toLowerCase();
    const authUserName = (authUser.userName || authUser.username || '').toString().trim().toLowerCase();
    const authEmail = (authUser.email || '').toString().trim().toLowerCase();

    this.adminEmployeeService.getEmployees().pipe(first()).subscribe({
      next: (employees) => {
        const list = Array.isArray(employees) ? employees : [];

        let employee = list.find(e => Number.isFinite(authEmployeeId) && authEmployeeId > 0 && e.employeeId === authEmployeeId) || null;

        if (!employee && authUserId) {
          employee = list.find(e => (e.id || '').toString().trim().toLowerCase() === authUserId) || null;
        }

        if (!employee && authUserName) {
          employee = list.find(e => (e.userName || '').toString().trim().toLowerCase() === authUserName) || null;
        }

        if (!employee && authEmail) {
          employee = list.find(e => (e.email || '').toString().trim().toLowerCase() === authEmail) || null;
        }

        if (!employee) {
          this.loadError = this.translate.instant('MY_PROFILE_PAGE.LOAD_ERROR');
          this.isLoading = false;
          return;
        }

        this.currentEmployee = employee;
        this.profileImageVersion = Date.now();
        this.profilePreviewUrl = this.resolveProfileImageUrl(employee.profileImageUrl);

        this.form.patchValue({
          userName: employee.userName || '',
          email: employee.email || '',
          nameEn: employee.nameEn || '',
          nameAr: employee.nameAr || '',
          branchId: employee.branchId || null,
          employeeNo: employee.employeeNo || '',
          nationalId: employee.nationalId || '',
          jobTitle: employee.jobTitle || '',
          departmentId: employee.departmentId || null,
          hireDate: this.toDateInput(employee.hireDate),
          terminationDate: this.toDateInput(employee.terminationDate),
          employmentStatus: employee.employmentStatus || '',
          workEmail: employee.workEmail || '',
          workPhone: employee.workPhone || '',
          extension: employee.extension || '',
          dateOfBirth: this.toDateInput(employee.dateOfBirth),
          gender: employee.gender || '',
          nationality: employee.nationality || '',
          addressLine1: employee.addressLine1 || '',
          addressLine2: employee.addressLine2 || '',
          city: employee.city || '',
          region: employee.region || '',
          postalCode: employee.postalCode || ''
        });
        this.accountCredentialsForm.patchValue({
          userName: employee.userName || '',
          newPassword: ''
        });
        this.syncAuthUser(employee);

        this.isLoading = false;
      },
      error: () => {
        this.loadError = this.translate.instant('MY_PROFILE_PAGE.LOAD_ERROR');
        this.isLoading = false;
      }
    });
  }

  get f() {
    return this.form.controls;
  }

  get credentialsForm() {
    return this.accountCredentialsForm.controls;
  }

  get isArabic(): boolean {
    return (this.translate.currentLang || 'ar').toLowerCase().startsWith('ar');
  }

  getEmployeeDisplayName(): string {
    const nameAr = (this.f.nameAr.value || '').trim();
    const nameEn = (this.f.nameEn.value || '').trim();
    const userName = (this.f.userName.value || '').trim();

    return this.isArabic
      ? (nameAr || nameEn || userName || '-')
      : (nameEn || nameAr || userName || '-');
  }

  getBranchDisplayName(): string {
    const branchId = this.currentEmployee?.branchId;
    if (branchId) {
      const branch = this.branches.find(item => item.id === branchId);
      if (branch) {
        return this.isArabic
          ? (branch.branchNameAr || branch.branchNameEn || '-')
          : (branch.branchNameEn || branch.branchNameAr || '-');
      }
    }

    return this.currentEmployee?.branchName || '-';
  }

  getDepartmentDisplayName(): string {
    const departmentId = this.currentEmployee?.departmentId;
    if (departmentId) {
      const department = this.departments.find(item => item.id === departmentId);
      if (department) {
        return this.isArabic
          ? (department.nameAr || department.nameEn || '-')
          : (department.nameEn || department.nameAr || '-');
      }
    }

    return this.currentEmployee?.departmentName || '-';
  }

  getBranchOptionLabel(branch: Branch): string {
    return this.isArabic
      ? (branch.branchNameAr || branch.branchNameEn || '-')
      : (branch.branchNameEn || branch.branchNameAr || '-');
  }

  getDepartmentOptionLabel(department: Department): string {
    return this.isArabic
      ? (department.nameAr || department.nameEn || '-')
      : (department.nameEn || department.nameAr || '-');
  }

  getEmploymentStatusLabel(statusCode?: string): string {
    if (!statusCode) return '-';
    const status = this.employmentStatusLookups.find(item => item.detailCode === statusCode);
    if (!status) return statusCode;

    return this.isArabic
      ? (status.nameAr || status.nameEn || statusCode)
      : (status.nameEn || status.nameAr || statusCode);
  }

  onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        text: this.translate.instant('MY_PROFILE_PAGE.IMAGE_TYPE_ERROR'),
        confirmButtonColor: '#f06548',
        confirmButtonText: this.translate.instant('COMMON.OK')
      });
      return;
    }

    this.selectedProfileImage = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.profilePreviewUrl = (reader.result as string) || '';
    };
    reader.readAsDataURL(file);
  }

  async saveProfile(): Promise<void> {
    this.submitted = true;

    if (this.form.invalid || !this.currentEmployee) {
      return;
    }

    const confirmResult = await Swal.fire({
      title: this.translate.instant('MY_PROFILE_PAGE.CONFIRM_PROFILE_UPDATE_TITLE'),
      text: this.translate.instant('MY_PROFILE_PAGE.CONFIRM_PROFILE_UPDATE_TEXT'),
      icon: 'warning',
      iconHtml: '<i class="ri-alert-line" style="font-size:72px;color:#f7b84b;"></i>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.UPDATE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: '#0ab39c',
      cancelButtonColor: '#f06548'
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    this.isSaving = true;

    const payload = {
      userName: (this.f.userName.value || '').trim(),
      email: (this.f.email.value || '').trim(),
      nameEn: (this.f.nameEn.value || '').trim(),
      nameAr: (this.f.nameAr.value || '').trim(),
      branchId: this.currentEmployee.branchId,
      employeeNo: (this.f.employeeNo.value || '').trim(),
      nationalId: (this.f.nationalId.value || '').trim(),
      jobTitle: (this.f.jobTitle.value || '').trim(),
      departmentId: this.currentEmployee.departmentId || undefined,
      hireDate: this.toDateInput(this.currentEmployee.hireDate) || undefined,
      terminationDate: this.f.terminationDate.value || undefined,
      employmentStatus: (this.f.employmentStatus.value || '').trim() || undefined,
      workEmail: (this.f.workEmail.value || '').trim() || undefined,
      workPhone: (this.f.workPhone.value || '').trim() || undefined,
      extension: (this.f.extension.value || '').trim() || undefined,
      dateOfBirth: this.f.dateOfBirth.value || undefined,
      gender: (this.f.gender.value || '').trim() || undefined,
      nationality: (this.f.nationality.value || '').trim() || undefined,
      addressLine1: (this.f.addressLine1.value || '').trim() || undefined,
      addressLine2: (this.f.addressLine2.value || '').trim() || undefined,
      city: (this.f.city.value || '').trim() || undefined,
      region: (this.f.region.value || '').trim() || undefined,
      postalCode: (this.f.postalCode.value || '').trim() || undefined,
      profileImage: this.selectedProfileImage
    };

    this.adminEmployeeService.updateEmployee(this.currentEmployee.id, payload).pipe(first()).subscribe({
      next: () => {
        this.isSaving = false;
        Swal.fire({
          icon: 'success',
          text: this.translate.instant('MY_PROFILE_PAGE.SAVE_SUCCESS'),
          confirmButtonColor: '#0ab39c',
          confirmButtonText: this.translate.instant('COMMON.OK')
        });
        this.selectedProfileImage = undefined;
        this.profileImageVersion = Date.now();
        this.loadCurrentEmployeeProfile();
      },
      error: () => {
        this.isSaving = false;
        Swal.fire({
          icon: 'error',
          text: this.translate.instant('MY_PROFILE_PAGE.SAVE_ERROR'),
          confirmButtonColor: '#f06548',
          confirmButtonText: this.translate.instant('COMMON.OK')
        });
      }
    });
  }

  async updateAccountCredentials(): Promise<void> {
    this.credentialsSubmitted = true;
    this.passwordSuccessMessage = '';
    this.passwordErrorMessage = '';

    if (!this.currentEmployee || this.accountCredentialsForm.invalid) {
      return;
    }

    this.isUpdatingCredentials = true;
    const employeeId = this.currentEmployee.id;
    const userName = (this.credentialsForm.userName.value || '').trim();
    const newPassword = (this.credentialsForm.newPassword.value || '').trim();
    const changingPassword = !!newPassword;

    const confirmResult = await Swal.fire({
      title: this.translate.instant('MY_PROFILE_PAGE.CONFIRM_CREDENTIALS_TITLE'),
      text: changingPassword
        ? this.translate.instant('MY_PROFILE_PAGE.CONFIRM_CREDENTIALS_TEXT_WITH_PASSWORD')
        : this.translate.instant('MY_PROFILE_PAGE.CONFIRM_CREDENTIALS_TEXT_USERNAME_ONLY'),
      icon: 'warning',
      iconHtml: '<i class="ri-alert-line" style="font-size:72px;color:#f7b84b;"></i>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('MY_PROFILE_PAGE.CONFIRM_BUTTON'),
      cancelButtonText: this.translate.instant('MY_PROFILE_PAGE.CANCEL_BUTTON'),
      confirmButtonColor: '#0ab39c',
      cancelButtonColor: '#f06548'
    });

    if (!confirmResult.isConfirmed) {
      this.isUpdatingCredentials = false;
      return;
    }

    const payload = this.buildUpdatePayload(userName);
    this.adminEmployeeService.updateEmployee(employeeId, payload).pipe(first()).subscribe({
      next: () => {
        if (!newPassword) {
          this.isUpdatingCredentials = false;
          this.passwordSuccessMessage = this.translate.instant('MY_PROFILE_PAGE.SAVE_SUCCESS');
          this.f.userName.setValue(userName);
          if (this.currentEmployee) {
            this.currentEmployee.userName = userName;
            this.syncAuthUser(this.currentEmployee);
          }
          this.accountCredentialsForm.patchValue({ userName, newPassword: '' });
          this.credentialsSubmitted = false;
          return;
        }

        this.adminEmployeeService.changeEmployeePassword(employeeId, newPassword).pipe(first()).subscribe({
          next: () => {
            this.isUpdatingCredentials = false;
            this.passwordSuccessMessage = this.translate.instant('EMPLOYEE_PAGE.PASSWORD_CHANGED_SUCCESS');
            this.f.userName.setValue(userName);
            if (this.currentEmployee) {
              this.currentEmployee.userName = userName;
              this.syncAuthUser(this.currentEmployee);
            }
            this.accountCredentialsForm.patchValue({ userName, newPassword: '' });
            this.credentialsSubmitted = false;
            this.showNewPassword = false;
          },
          error: () => {
            this.isUpdatingCredentials = false;
            this.passwordErrorMessage = this.translate.instant('MY_PROFILE_PAGE.SAVE_ERROR');
          }
        });
      },
      error: () => {
        this.isUpdatingCredentials = false;
        this.passwordErrorMessage = this.translate.instant('MY_PROFILE_PAGE.SAVE_ERROR');
      }
    });
  }

  private buildUpdatePayload(userName: string) {
    return {
      userName,
      email: (this.f.email.value || '').trim(),
      nameEn: (this.f.nameEn.value || '').trim(),
      nameAr: (this.f.nameAr.value || '').trim(),
      branchId: this.currentEmployee!.branchId,
      employeeNo: (this.f.employeeNo.value || '').trim(),
      nationalId: (this.f.nationalId.value || '').trim(),
      jobTitle: (this.f.jobTitle.value || '').trim(),
      departmentId: this.currentEmployee!.departmentId || undefined,
      hireDate: this.toDateInput(this.currentEmployee!.hireDate) || undefined,
      terminationDate: this.f.terminationDate.value || undefined,
      employmentStatus: (this.f.employmentStatus.value || '').trim() || undefined,
      workEmail: (this.f.workEmail.value || '').trim() || undefined,
      workPhone: (this.f.workPhone.value || '').trim() || undefined,
      extension: (this.f.extension.value || '').trim() || undefined,
      dateOfBirth: this.f.dateOfBirth.value || undefined,
      gender: (this.f.gender.value || '').trim() || undefined,
      nationality: (this.f.nationality.value || '').trim() || undefined,
      addressLine1: (this.f.addressLine1.value || '').trim() || undefined,
      addressLine2: (this.f.addressLine2.value || '').trim() || undefined,
      city: (this.f.city.value || '').trim() || undefined,
      region: (this.f.region.value || '').trim() || undefined,
      postalCode: (this.f.postalCode.value || '').trim() || undefined,
      profileImage: this.selectedProfileImage
    };
  }

  private toDateInput(value?: string | null): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toISOString().slice(0, 10);
  }

  private resolveProfileImageUrl(rawUrl?: string | null): string {
    const value = (rawUrl || '').trim();
    if (!value) {
      return '';
    }

    if (value.startsWith('data:')) {
      return value;
    }

    const absoluteUrl = value.startsWith('http')
      ? value
      : `${GlobalComponent.API_URL}/${value.startsWith('/') ? value.slice(1) : value}`;
    const separator = absoluteUrl.includes('?') ? '&' : '?';
    return `${absoluteUrl}${separator}v=${this.profileImageVersion}`;
  }

  private syncAuthUser(employee: AdminEmployee): void {
    const existingUser = this.tokenStorageService.getUser() || {};
    const rememberMe = window.localStorage.getItem('rememberMe') === 'true';
    const mergedUser = {
      ...existingUser,
      userName: employee.userName,
      email: employee.email,
      nameEn: employee.nameEn,
      nameAr: employee.nameAr,
      fullNameEn: employee.fullNameEn || employee.nameEn,
      fullNameAr: employee.fullNameAr || employee.nameAr,
      branchId: employee.branchId,
      departmentId: employee.departmentId,
      branchName: employee.branchName,
      departmentName: employee.departmentName,
      profileImageUrl: employee.profileImageUrl || existingUser.profileImageUrl,
      profileImageVersion: this.profileImageVersion
    };

    this.tokenStorageService.saveUser(mergedUser, rememberMe);
  }
}
