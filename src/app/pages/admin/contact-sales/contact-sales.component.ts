import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { ContactSales } from '../interfaces/contact-sales.interface';
import { ContactSalesService } from '../services/contact-sales.service';
import { BranchService } from '../services/branch.service';
import { getErrorMessage } from '../shared/error-message.util';

@Component({
  selector: 'app-contact-sales',
  templateUrl: './contact-sales.component.html',
  styleUrl: './contact-sales.component.scss',
  standalone: false
})
export class ContactSalesComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  contactForm!: UntypedFormGroup;
  isLoading = false;
  isSubmitting = false;
  submitted = false;
  isModalOpen = false;
  isEditMode = false;
  selectedContact?: ContactSales;
  selectedIconFile?: File;
  iconPreviewUrl?: string;

  contacts: ContactSales[] = [];
  filteredContacts: ContactSales[] = [];
  pagedContacts: ContactSales[] = [];
  searchTerm = '';
  selectedContactIds = new Set<number>();
  previewImageUrl?: string;
  isPreviewOpen = false;
  branches: any[] = [];

  contactTypes = [
    { value: 1, label: 'Mobile' },
    { value: 2, label: 'WhatsApp' },
    { value: 3, label: 'Email' }
  ];

  constructor(
    private formBuilder: UntypedFormBuilder,
    public service: PaginationService,
    private contactSalesService: ContactSalesService,
    private toastService: ToastService,
    private branchService: BranchService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Admin' },
      { label: 'Contact Sales', active: true }
    ];

    this.contactForm = this.formBuilder.group({
      contactValue: ['', [Validators.required, Validators.maxLength(100)]],
      contactType: [1, Validators.required],
      branchId: [null, Validators.required],
      isAvailable: [true]
    });

    this.loadBranches();
    this.loadContacts();
  }

  get form() {
    return this.contactForm.controls;
  }

  loadBranches() {
    this.branchService.getBranches().pipe(first()).subscribe({
      next: (branches) => {
        this.branches = branches;
      },
      error: (error) => this.showError(error)
    });
  }

  loadContacts() {
    this.isLoading = true;
    this.contactSalesService.getAll().pipe(first()).subscribe({
      next: (contacts) => {
        this.contacts = contacts;
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
    let data = [...this.contacts];
    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      data = data.filter(contact =>
        (contact.contactValue || '').toLowerCase().includes(term)
      );
    }

    this.filteredContacts = data;
    if (resetPage) {
      this.service.page = 1;
    }
    this.pagedContacts = this.service.changePage(this.filteredContacts);
  }

  onPageChange(page: number) {
    this.service.page = page;
    this.pagedContacts = this.service.changePage(this.filteredContacts);
  }

  openCreateModal() {
    this.isEditMode = false;
    this.selectedContact = undefined;
    this.selectedIconFile = undefined;
    this.iconPreviewUrl = undefined;
    this.contactForm.reset({ contactType: 1, isAvailable: true });
    this.submitted = false;
    this.isModalOpen = true;
  }

  openEditModal(contact: ContactSales) {
    this.isEditMode = true;
    this.selectedContact = contact;
    this.selectedIconFile = undefined;
    this.iconPreviewUrl = contact.contactIconUrl;
    this.submitted = false;
    this.contactForm.patchValue({
      contactValue: contact.contactValue,
      contactType: contact.contactType,
      branchId: contact.branchId,
      isAvailable: contact.isAvailable
    });
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.selectedContact = undefined;
    this.selectedIconFile = undefined;
    this.iconPreviewUrl = undefined;
    this.contactForm.reset();
    this.submitted = false;
  }

  onIconFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedIconFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.iconPreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveContact() {
    this.submitted = true;
    if (this.contactForm.invalid) return;
    if (!this.isEditMode && !this.selectedIconFile) {
      this.showError({ message: 'Icon image is required' });
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();
    formData.append('contactValue', this.form['contactValue'].value);
    formData.append('contactType', this.form['contactType'].value.toString());
    formData.append('branchId', this.form['branchId'].value.toString());
    formData.append('isAvailable', this.form['isAvailable'].value.toString());
    if (this.selectedIconFile) {
      formData.append('iconFile', this.selectedIconFile);
    }

    if (this.isEditMode && this.selectedContact) {
      this.contactSalesService.update(this.selectedContact.id, formData).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess('Contact updated successfully');
          this.closeModal();
          this.loadContacts();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    } else {
      this.contactSalesService.create(formData).pipe(first()).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess('Contact created successfully');
          this.closeModal();
          this.loadContacts();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showError(error);
        }
      });
    }
  }

  deleteContact(contact: ContactSales) {
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
        this.contactSalesService.delete(contact.id).pipe(first()).subscribe({
          next: () => {
            this.showSuccess('Contact deleted successfully');
            this.loadContacts();
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }

  getContactTypeLabel(type: number): string {
    const contactType = this.contactTypes.find(t => t.value === type);
    return contactType ? contactType.label : 'Unknown';
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

  toggleContactSelection(contactId: number, checked: boolean) {
    if (checked) {
      this.selectedContactIds.add(contactId);
    } else {
      this.selectedContactIds.delete(contactId);
    }
  }

  toggleSelectAllContacts(checked: boolean) {
    if (checked) {
      this.pagedContacts.forEach(contact => this.selectedContactIds.add(contact.id));
    } else {
      this.selectedContactIds.clear();
    }
  }

  isAllContactsSelected(): boolean {
    return this.pagedContacts.length > 0 && this.pagedContacts.every(contact => this.selectedContactIds.has(contact.id));
  }

  bulkDeleteContacts() {
    if (this.selectedContactIds.size === 0) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `Delete ${this.selectedContactIds.size} selected contact(s)?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        const contactIds = Array.from(this.selectedContactIds);
        this.contactSalesService.bulkDelete(contactIds).pipe(first()).subscribe({
          next: (response) => {
            this.selectedContactIds.clear();
            if (response.failedIds.length > 0) {
              this.showError({ message: `Deleted ${response.deletedCount} contacts. Failed to delete ${response.failedIds.length} contacts.` });
            } else {
              this.showSuccess(`Successfully deleted ${response.deletedCount} contact(s)`);
            }
            this.loadContacts();
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }

  previewImage(imageUrl: string) {
    this.previewImageUrl = imageUrl;
    this.isPreviewOpen = true;
  }

  closePreview() {
    this.isPreviewOpen = false;
    this.previewImageUrl = undefined;
  }
}
