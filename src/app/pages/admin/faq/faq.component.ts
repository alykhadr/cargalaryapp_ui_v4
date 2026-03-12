import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { FAQ } from '../interfaces/faq.interface';
import { FAQService } from '../services/faq.service';
import { getErrorMessage } from '../shared/error-message.util';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
  standalone: false
})
export class FaqComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  faqForm!: UntypedFormGroup;
  isLoading = false;
  isSubmitting = false;
  submitted = false;
  isModalOpen = false;
  isEditMode = false;
  selectedFaq?: FAQ;
  public Editor = ClassicEditor;

  faqs: FAQ[] = [];
  filteredFaqs: FAQ[] = [];
  pagedFaqs: FAQ[] = [];
  searchTerm = '';
  selectedFaqIds = new Set<number>();

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private faqService: FAQService,
    private toastService: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.CONTACT_INFO.TEXT') },
      { label: this.translate.instant('MENUITEMS.ADMIN.LIST.FAQ'), active: true }
    ];

    this.faqForm = this.formBuilder.group({
      titleAr: ['', [Validators.required, Validators.maxLength(200)]],
      titleEn: ['', [Validators.required, Validators.maxLength(200)]],
      descriptionAr: ['', [Validators.required]],
      descriptionEn: ['', [Validators.required]],
      order: [0, [Validators.required, Validators.min(0)]],
      isAvailable: [true]
    });

    this.loadFaqs();
  }

  get form() {
    return this.faqForm.controls;
  }

  loadFaqs() {
    this.isLoading = true;
    this.faqService.getAll().pipe(first()).subscribe({
      next: (faqs) => {
        this.faqs = faqs.sort((a, b) => a.order - b.order);
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
    let data = [...this.faqs];
    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      data = data.filter(faq =>
        (faq.titleAr || '').toLowerCase().includes(term) ||
        (faq.titleEn || '').toLowerCase().includes(term) ||
        (faq.descriptionAr || '').toLowerCase().includes(term) ||
        (faq.descriptionEn || '').toLowerCase().includes(term)
      );
    }

    this.filteredFaqs = data;
    if (resetPage) {
      this.service.page = 1;
    }
    this.pagedFaqs = this.service.changePage(this.filteredFaqs);
  }

  onPageChange(page: number) {
    this.service.page = page;
    this.pagedFaqs = this.service.changePage(this.filteredFaqs);
  }

  openCreateModal() {
    this.isEditMode = false;
    this.selectedFaq = undefined;
    this.faqForm.reset({ order: 0, isAvailable: true });
    this.submitted = false;
    this.isModalOpen = true;
  }

  openEditModal(faq: FAQ) {
    this.isEditMode = true;
    this.selectedFaq = faq;
    this.submitted = false;
    this.faqForm.patchValue({
      titleAr: faq.titleAr,
      titleEn: faq.titleEn,
      descriptionAr: faq.descriptionAr,
      descriptionEn: faq.descriptionEn,
      order: faq.order,
      isAvailable: faq.isAvailable
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.selectedFaq = undefined;
    this.faqForm.reset();
    this.submitted = false;
  }

  saveFaq() {
    this.submitted = true;
    if (this.faqForm.invalid) return;

    this.isSubmitting = true;
    const payload = {
      titleAr: this.form['titleAr'].value,
      titleEn: this.form['titleEn'].value,
      descriptionAr: this.form['descriptionAr'].value,
      descriptionEn: this.form['descriptionEn'].value,
      order: this.form['order'].value,
      isAvailable: this.form['isAvailable'].value
    };

    if (this.isEditMode && this.selectedFaq) {
      this.faqService.update(this.selectedFaq.id, payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess(this.translate.instant('FAQ_PAGE.UPDATE_SUCCESS'));
          this.closeModal();
          this.loadFaqs();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    } else {
      this.faqService.create(payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess(this.translate.instant('FAQ_PAGE.CREATE_SUCCESS'));
          this.closeModal();
          this.loadFaqs();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    }
  }

  deleteFaq(faq: FAQ) {
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
        this.faqService.delete(faq.id).pipe(first()).subscribe({
          next: () => {
            this.showSuccess(this.translate.instant('FAQ_PAGE.DELETE_SUCCESS'));
            this.loadFaqs();
          },
          error: (error) => this.showError(error)
        });
      }
    });
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

  toggleFaqSelection(faqId: number, checked: boolean) {
    if (checked) {
      this.selectedFaqIds.add(faqId);
    } else {
      this.selectedFaqIds.delete(faqId);
    }
  }

  toggleSelectAllFaqs(checked: boolean) {
    if (checked) {
      this.pagedFaqs.forEach(faq => this.selectedFaqIds.add(faq.id));
    } else {
      this.selectedFaqIds.clear();
    }
  }

  isAllFaqsSelected(): boolean {
    return this.pagedFaqs.length > 0 && this.pagedFaqs.every(faq => this.selectedFaqIds.has(faq.id));
  }

  bulkDeleteFaqs() {
    if (this.selectedFaqIds.size === 0) return;

    Swal.fire({
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('FAQ_PAGE.BULK_DELETE_TEXT', { count: this.selectedFaqIds.size }),
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES_DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        const faqIds = Array.from(this.selectedFaqIds);
        this.faqService.bulkDelete(faqIds).pipe(first()).subscribe({
          next: (response) => {
            this.selectedFaqIds.clear();
            if (response.failedIds.length > 0) {
              this.showError(this.translate.instant('FAQ_PAGE.BULK_DELETE_PARTIAL', {
                deleted: response.deletedCount,
                failed: response.failedIds.length
              }));
            } else {
              this.showSuccess(this.translate.instant('FAQ_PAGE.BULK_DELETE_SUCCESS', {
                count: response.deletedCount
              }));
            }
            this.loadFaqs();
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }
}
