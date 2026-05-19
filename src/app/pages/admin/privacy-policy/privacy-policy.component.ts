import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { PrivacyPolicy } from '../interfaces/privacy-policy.interface';
import { PrivacyPolicyService } from '../services/privacy-policy.service';
import { getErrorMessage } from '../shared/error-message.util';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss',
  standalone: false
})
export class PrivacyPolicyComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  privacyPolicyForm!: UntypedFormGroup;
  isLoading = false;
  isSubmitting = false;
  submitted = false;
  isModalOpen = false;
  isEditMode = false;
  selectedPrivacyPolicy?: PrivacyPolicy;
  public Editor = ClassicEditor;

  privacyPolicies: PrivacyPolicy[] = [];
  filteredPrivacyPolicies: PrivacyPolicy[] = [];
  pagedPrivacyPolicies: PrivacyPolicy[] = [];
  searchTerm = '';
  selectedPrivacyPolicyIds = new Set<number>();

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private privacyPolicyService: PrivacyPolicyService,
    private toastService: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.CONTACT_INFO.TEXT') },
      { label: this.translate.instant('MENUITEMS.ADMIN.LIST.PRIVACYPOLICY'), active: true }
    ];

    this.privacyPolicyForm = this.formBuilder.group({
      privacyPolicyEn: ['', Validators.required],
      privacyPolicyAr: ['', Validators.required],
      isAvailable: [true]
    });

    this.loadPrivacyPolicies();
  }

  get form() {
    return this.privacyPolicyForm.controls;
  }

  loadPrivacyPolicies() {
    this.isLoading = true;
    this.privacyPolicyService.getAll().pipe(first()).subscribe({
      next: (privacyPolicies) => {
        this.privacyPolicies = privacyPolicies;
        this.applyFilters(true);
        this.isLoading = false;
      },
      error: (error) => {
        this.showError(error);
        this.isLoading = false;
      }
    });
  }

  onSearch() {
    this.applyFilters(true);
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters(true);
  }

  private applyFilters(resetPage = false) {
    let data = [...this.privacyPolicies];
    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      data = data.filter(policy =>
        this.toPlainText(policy.privacyPolicyAr).toLowerCase().includes(term) ||
        this.toPlainText(policy.privacyPolicyEn).toLowerCase().includes(term)
      );
    }

    this.filteredPrivacyPolicies = data;
    if (resetPage) {
      this.service.page = 1;
    }
    this.pagedPrivacyPolicies = this.service.changePage(this.filteredPrivacyPolicies);
  }

  onPageChange(page: number) {
    this.service.page = page;
    this.pagedPrivacyPolicies = this.service.changePage(this.filteredPrivacyPolicies);
  }

  openCreateModal() {
    this.isEditMode = false;
    this.selectedPrivacyPolicy = undefined;
    this.privacyPolicyForm.reset({ privacyPolicyEn: '', privacyPolicyAr: '', isAvailable: true });
    this.submitted = false;
    this.isModalOpen = true;
  }

  openEditModal(privacyPolicy: PrivacyPolicy) {
    this.isEditMode = true;
    this.selectedPrivacyPolicy = privacyPolicy;
    this.submitted = false;
    this.privacyPolicyForm.patchValue({
      privacyPolicyEn: privacyPolicy.privacyPolicyEn,
      privacyPolicyAr: privacyPolicy.privacyPolicyAr,
      isAvailable: privacyPolicy.isAvailable
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.selectedPrivacyPolicy = undefined;
    this.privacyPolicyForm.reset();
    this.submitted = false;
  }

  savePrivacyPolicy() {
    this.submitted = true;
    if (this.privacyPolicyForm.invalid) return;

    this.isSubmitting = true;
    const payload = {
      privacyPolicyEn: this.form['privacyPolicyEn'].value,
      privacyPolicyAr: this.form['privacyPolicyAr'].value,
      isAvailable: this.form['isAvailable'].value
    };

    if (this.isEditMode && this.selectedPrivacyPolicy) {
      this.privacyPolicyService.update(this.selectedPrivacyPolicy.id, payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess(this.translate.instant('PRIVACY_POLICY_PAGE.UPDATE_SUCCESS'));
          this.closeModal();
          this.loadPrivacyPolicies();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    } else {
      this.privacyPolicyService.create(payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess(this.translate.instant('PRIVACY_POLICY_PAGE.CREATE_SUCCESS'));
          this.closeModal();
          this.loadPrivacyPolicies();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    }
  }

  deletePrivacyPolicy(privacyPolicy: PrivacyPolicy) {
    Swal.fire({
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('COMMON.DELETE_CONFIRM_RECORD'),
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES_DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CLOSE'),
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.privacyPolicyService.delete(privacyPolicy.id).pipe(first()).subscribe({
          next: () => {
            this.showSuccess(this.translate.instant('PRIVACY_POLICY_PAGE.DELETE_SUCCESS'));
            this.loadPrivacyPolicies();
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }

  togglePrivacyPolicySelection(privacyPolicyId: number, checked: boolean) {
    if (checked) {
      this.selectedPrivacyPolicyIds.add(privacyPolicyId);
    } else {
      this.selectedPrivacyPolicyIds.delete(privacyPolicyId);
    }
  }

  toggleSelectAllPrivacyPolicies(checked: boolean) {
    if (checked) {
      this.pagedPrivacyPolicies.forEach(policy => this.selectedPrivacyPolicyIds.add(policy.id));
    } else {
      this.selectedPrivacyPolicyIds.clear();
    }
  }

  isAllPrivacyPoliciesSelected(): boolean {
    return this.pagedPrivacyPolicies.length > 0 && this.pagedPrivacyPolicies.every(policy => this.selectedPrivacyPolicyIds.has(policy.id));
  }

  bulkDeletePrivacyPolicies() {
    if (this.selectedPrivacyPolicyIds.size === 0) return;

    Swal.fire({
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('PRIVACY_POLICY_PAGE.BULK_DELETE_TEXT', { count: this.selectedPrivacyPolicyIds.size }),
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES_DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        const privacyPolicyIds = Array.from(this.selectedPrivacyPolicyIds);
        this.privacyPolicyService.bulkDelete(privacyPolicyIds).pipe(first()).subscribe({
          next: (response) => {
            this.selectedPrivacyPolicyIds.clear();
            if (response.failedIds.length > 0) {
              this.showError(this.translate.instant('PRIVACY_POLICY_PAGE.BULK_DELETE_PARTIAL', {
                deleted: response.deletedCount,
                failed: response.failedIds.length
              }));
            } else {
              this.showSuccess(this.translate.instant('PRIVACY_POLICY_PAGE.BULK_DELETE_SUCCESS', {
                count: response.deletedCount
              }));
            }
            this.loadPrivacyPolicies();
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }

  getPreview(value: string): string {
    const text = this.toPlainText(value);
    if (!text) {
      return '-';
    }

    return text.length > 140 ? `${text.slice(0, 140)}...` : text;
  }

  private toPlainText(value: string | null | undefined): string {
    const element = document.createElement('div');
    element.innerHTML = value || '';
    return (element.textContent || element.innerText || '').trim();
  }

  private showSuccess(message: string) {
    void Swal.fire({
      title: message,
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
