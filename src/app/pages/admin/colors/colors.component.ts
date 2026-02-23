import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { Color } from '../interfaces/color.interface';
import { ColorService } from '../services/color.service';
import { getErrorMessage } from '../shared/error-message.util';

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

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private colorService: ColorService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Admin' },
      { label: 'Colors', active: true }
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
          this.showSuccess('Color updated successfully');
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
          this.showSuccess('Color created successfully');
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
      title: 'Are you sure?',
      text: 'Are you sure you want to remove this record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete It!',
      cancelButtonText: 'Close',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.colorService.deleteColor(color.id).pipe(first()).subscribe({
          next: () => {
            this.showSuccess('Color deleted successfully');
            this.loadColors();
          },
          error: (error) => this.showError(error)
        });
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
