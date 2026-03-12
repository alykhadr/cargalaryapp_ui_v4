import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { Department } from '../interfaces/department.interface';
import { DepartmentService } from '../services/department.service';
import { getErrorMessage } from '../shared/error-message.util';
import { AdminEmployee } from '../interfaces/employee-admin.interface';
import { AdminEmployeeService } from '../services/admin-employee.service';
import { LookupDetail } from '../interfaces/lookup.interface';
import { LookupService } from '../services/lookup.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-departments',
  standalone: false,
  templateUrl: './departments.component.html',
  styleUrl: './departments.component.scss'
})
export class DepartmentsComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  departmentForm!: UntypedFormGroup;
  submitted = false;
  isLoading = false;
  isSubmitting = false;
  isModalOpen = false;
  isEditMode = false;
  selectedDepartment?: Department;
  selectedDepartmentForEmployees?: Department;
  isEmployeesModalOpen = false;
  isLoadingDepartmentEmployees = false;
  departmentEmployees: AdminEmployee[] = [];
  pagedDepartmentEmployees: AdminEmployee[] = [];
  employeePager = new PaginationService();
  employmentStatusLookups: LookupDetail[] = [];

  departments: Department[] = [];
  filteredDepartments: Department[] = [];
  pagedDepartments: Department[] = [];
  searchTermEn = '';
  searchTermAr = '';

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private departmentService: DepartmentService,
    private adminEmployeeService: AdminEmployeeService,
    private lookupService: LookupService,
    private toastService: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.EMPLOYEE_MANAGEMENT.TEXT') },
      { label: this.translate.instant('MENUITEMS.ADMIN.LIST.DEPARTMENT'), active: true }
    ];

    this.departmentForm = this.formBuilder.group({
      nameEn: ['', [Validators.required, Validators.maxLength(100)]],
      nameAr: ['', [Validators.required, Validators.maxLength(100)]],
      isAvailable: [true]
    });

    this.loadDepartments();
    this.loadEmploymentStatusLookups();
  }

  get form() {
    return this.departmentForm.controls;
  }

  loadDepartments() {
    this.isLoading = true;
    this.departmentService.getDepartments().pipe(first()).subscribe({
      next: (departments) => {
        this.departments = departments;
        this.applyFilters(true);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.showError(error);
      }
    });
  }

  openCreateModal() {
    this.isEditMode = false;
    this.selectedDepartment = undefined;
    this.submitted = false;
    this.departmentForm.reset({ nameEn: '', nameAr: '', isAvailable: true });
    this.isModalOpen = true;
  }

  openEditModal(department: Department) {
    this.isEditMode = true;
    this.selectedDepartment = department;
    this.submitted = false;
    this.departmentForm.patchValue({
      nameEn: department.nameEn,
      nameAr: department.nameAr,
      isAvailable: department.isAvailable
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedDepartment = undefined;
    this.isEditMode = false;
    this.submitted = false;
  }

  saveDepartment() {
    this.submitted = true;
    if (this.departmentForm.invalid) return;

    this.isSubmitting = true;
    const payload = {
      nameEn: this.form['nameEn'].value,
      nameAr: this.form['nameAr'].value,
      isAvailable: !!this.form['isAvailable'].value
    };

    if (this.isEditMode && this.selectedDepartment) {
      this.departmentService.updateDepartment(this.selectedDepartment.id, payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess('DEPARTMENT_PAGE.UPDATE_SUCCESS');
          this.closeModal();
          this.loadDepartments();
        },
        error: (error: any) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
      return;
    }

    this.departmentService.createDepartment(payload).pipe(first()).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showSuccess('DEPARTMENT_PAGE.CREATE_SUCCESS');
        this.closeModal();
        this.loadDepartments();
      },
      error: (error: any) => {
        this.isSubmitting = false;
        this.showError(error);
      }
    });
  }

  deleteDepartment(department: Department) {
    Swal.fire({
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('DEPARTMENT_PAGE.DELETE_CONFIRM_TEXT', { name: department.nameEn }),
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES_DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.departmentService.deleteDepartment(department.id).pipe(first()).subscribe({
        next: () => {
          this.showSuccess('DEPARTMENT_PAGE.DELETE_SUCCESS');
          this.loadDepartments();
        },
        error: (error) => this.showError(error)
      });
    });
  }

  onSearch() {
    this.applyFilters(true);
  }

  clearSearch() {
    this.searchTermEn = '';
    this.searchTermAr = '';
    this.applyFilters(true);
  }

  onPageChange(page: number) {
    this.service.page = page;
    this.pagedDepartments = this.service.changePage(this.filteredDepartments);
  }

  openDepartmentEmployeesModal(department: Department) {
    this.selectedDepartmentForEmployees = department;
    this.isEmployeesModalOpen = true;
    this.isLoadingDepartmentEmployees = true;
    this.departmentEmployees = [];
    this.pagedDepartmentEmployees = [];
    this.employeePager.page = 1;

    this.adminEmployeeService.getEmployeesByDepartment(department.id).pipe(first()).subscribe({
      next: (employees) => {
        this.departmentEmployees = employees;
        this.pagedDepartmentEmployees = this.employeePager.changePage(this.departmentEmployees);
        this.isLoadingDepartmentEmployees = false;
      },
      error: (error) => {
        this.isLoadingDepartmentEmployees = false;
        this.showError(error);
      }
    });
  }

  closeDepartmentEmployeesModal() {
    this.isEmployeesModalOpen = false;
    this.selectedDepartmentForEmployees = undefined;
    this.isLoadingDepartmentEmployees = false;
    this.departmentEmployees = [];
    this.pagedDepartmentEmployees = [];
  }

  onDepartmentEmployeesPageChange(page: number) {
    this.employeePager.page = page;
    this.pagedDepartmentEmployees = this.employeePager.changePage(this.departmentEmployees);
  }

  getEmploymentStatusLabel(statusCode?: string): string {
    if (!statusCode) return '-';
    const status = this.employmentStatusLookups.find(item =>
      item.detailCode === statusCode || item.id.toString() === statusCode
    );
    if (!status) return statusCode;
    return status.nameAr && status.nameEn ? `${status.nameAr} - ${status.nameEn}` : (status.nameEn || status.nameAr || statusCode);
  }

  getEmployeeNationalId(employee: AdminEmployee): string {
    const employeeAny = employee as any;
    const nationalId = employeeAny.nationalId ?? employeeAny.nationalID ?? employeeAny.nationalNumber ?? employeeAny.nationalNo;
    return nationalId ? String(nationalId) : '-';
  }

  private applyFilters(resetPage = false) {
    let data = [...this.departments];
    const termEn = this.searchTermEn.trim().toLowerCase();
    const termAr = this.searchTermAr.trim().toLowerCase();

    if (termEn) {
      data = data.filter(d => (d.nameEn || '').toLowerCase().includes(termEn));
    }

    if (termAr) {
      data = data.filter(d => (d.nameAr || '').toLowerCase().includes(termAr));
    }

    this.filteredDepartments = data;
    if (resetPage) this.service.page = 1;
    this.pagedDepartments = this.service.changePage(this.filteredDepartments);
  }

  private loadEmploymentStatusLookups() {
    this.lookupService.getByMasterCode('EMPLOYMENT_STATUS').pipe(first()).subscribe({
      next: (statuses) => {
        this.employmentStatusLookups = statuses;
      },
      error: () => {
        this.employmentStatusLookups = [];
      }
    });
  }

  private showSuccess(messageKey: string) {
    void Swal.fire({
      title: this.translate.instant(messageKey),
      icon: 'success',
      confirmButtonText: this.translate.instant('COMMON.OK'),
      confirmButtonColor: '#299cdb'
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
