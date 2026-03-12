import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { Color } from '../interfaces/color.interface';
import { ColorService } from '../services/color.service';
import { getErrorMessage } from '../shared/error-message.util';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-colors',
  templateUrl: './colors.component.html',
  styleUrl: './colors.component.scss',
  standalone: false
})
export class ColorsComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  colorForm!: UntypedFormGroup;
  isLoading = false;
  isSubmitting = false;
  submitted = false;
  isModalOpen = false;
  isEditMode = false;
  selectedColor?: Color;

  colors: Color[] = [];
  filteredColors: Color[] = [];
  pagedColors: Color[] = [];
  searchTerm = '';
  searchTermAr = '';
  selectedColorIds = new Set<number>();

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private colorService: ColorService,
    private toastService: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.CARS_MANAGEMENT.TEXT') },
      { label: this.translate.instant('MENUITEMS.ADMIN.LIST.COLOR'), active: true }
    ];

    this.colorForm = this.formBuilder.group({
      colorNameEn: ['', [Validators.required, Validators.maxLength(100)]],
      colorNameAr: ['', [Validators.required, Validators.maxLength(100)]],
      colorCode: ['', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]]
    });

    this.loadColors();
  }

  get form() {
    return this.colorForm.controls;
  }

  loadColors() {
    this.isLoading = true;
    this.colorService.getColors().pipe(first()).subscribe({
      next: (colors) => {
        this.colors = colors;
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
    this.searchTermAr = '';
    this.applyFilters(true);
  }

  private applyFilters(resetPage = false) {
    let data = [...this.colors];
    const termEn = this.searchTerm.trim().toLowerCase();
    const termAr = this.searchTermAr.trim().toLowerCase();

    if (termEn || termAr) {
      data = data.filter(color =>
        (termEn && (color.colorNameEn || '').toLowerCase().includes(termEn)) ||
        (termAr && (color.colorNameAr || '').toLowerCase().includes(termAr))
      );
    }

    this.filteredColors = data;
    if (resetPage) {
      this.service.page = 1;
    }
    this.pagedColors = this.service.changePage(this.filteredColors);
  }

  onPageChange(page: number) {
    this.service.page = page;
    this.pagedColors = this.service.changePage(this.filteredColors);
  }

  openCreateModal() {
    this.isEditMode = false;
    this.selectedColor = undefined;
    this.colorForm.reset();
    this.submitted = false;
    this.isModalOpen = true;
  }

  openEditModal(color: Color) {
    this.isEditMode = true;
    this.selectedColor = color;
    this.submitted = false;
    this.colorForm.patchValue({
      colorNameEn: color.colorNameEn,
      colorNameAr: color.colorNameAr,
      colorCode: color.colorCode
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.selectedColor = undefined;
    this.colorForm.reset();
    this.submitted = false;
  }

  saveColor() {
    this.submitted = true;
    if (this.colorForm.invalid) return;

    this.isSubmitting = true;
    const payload = {
      colorNameEn: this.form['colorNameEn'].value,
      colorNameAr: this.form['colorNameAr'].value,
      colorCode: this.form['colorCode'].value
    };

    if (this.isEditMode && this.selectedColor) {
      this.colorService.updateColor(this.selectedColor.id, payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess(this.translate.instant('COLOR_PAGE.UPDATE_SUCCESS'));
          this.closeModal();
          this.loadColors();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    } else {
      this.colorService.createColor(payload).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess(this.translate.instant('COLOR_PAGE.CREATE_SUCCESS'));
          this.closeModal();
          this.loadColors();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    }
  }

  deleteColor(color: Color) {
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
        this.colorService.deleteColor(color.id).pipe(first()).subscribe({
          next: () => {
            this.showSuccess(this.translate.instant('COLOR_PAGE.DELETE_SUCCESS'));
            this.loadColors();
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

  toggleColorSelection(colorId: number, checked: boolean) {
    if (checked) {
      this.selectedColorIds.add(colorId);
    } else {
      this.selectedColorIds.delete(colorId);
    }
  }

  toggleSelectAllColors(checked: boolean) {
    if (checked) {
      this.pagedColors.forEach(color => this.selectedColorIds.add(color.id));
    } else {
      this.selectedColorIds.clear();
    }
  }

  isAllColorsSelected(): boolean {
    return this.pagedColors.length > 0 && this.pagedColors.every(color => this.selectedColorIds.has(color.id));
  }

  bulkDeleteColors() {
    if (this.selectedColorIds.size === 0) return;

    Swal.fire({
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('COLOR_PAGE.BULK_DELETE_TEXT', { count: this.selectedColorIds.size }),
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES_DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        const colorIds = Array.from(this.selectedColorIds);
        this.colorService.bulkDeleteColors(colorIds).pipe(first()).subscribe({
          next: (response) => {
            this.selectedColorIds.clear();
            if (response.failedIds.length > 0) {
              this.showError({ message: this.translate.instant('COLOR_PAGE.BULK_DELETE_PARTIAL', { deleted: response.deletedCount, failed: response.failedIds.length }) });
            } else {
              this.showSuccess(this.translate.instant('COLOR_PAGE.BULK_DELETE_SUCCESS', { count: response.deletedCount }));
            }
            this.loadColors();
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }
}
