import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { ContactSales } from '../interfaces/contact-sales.interface';
import { ContactSalesService } from '../services/contact-sales.service';
import { BranchService } from '../services/branch.service';
import { LookupDetail } from '../interfaces/lookup.interface';
import { LookupService } from '../services/lookup.service';
import { getErrorMessage } from '../shared/error-message.util';
import { TranslateService } from '@ngx-translate/core';

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
  contactTypeLookups: LookupDetail[] = [];

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
    private branchService: BranchService,
    private lookupService: LookupService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.CONTACT_INFO.TEXT') },
      { label: this.translate.instant('MENUITEMS.ADMIN.LIST.CONTACTSALES'), active: true }
    ];

    this.contactTypes = [
      { value: 1, label: this.translate.instant('CONTACT_SALES_PAGE.TYPE_MOBILE') },
      { value: 2, label: this.translate.instant('CONTACT_SALES_PAGE.TYPE_WHATSAPP') },
      { value: 3, label: this.translate.instant('CONTACT_SALES_PAGE.TYPE_EMAIL') }
    ];

    this.contactForm = this.formBuilder.group({
      contactValue: ['', [Validators.required, Validators.maxLength(100)]],
      contactType: [null, Validators.required],
      branchId: [null, Validators.required],
      isAvailable: [true]
    });

    this.loadContactTypes();
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

  loadContactTypes() {
    this.lookupService.getByMasterCode('CONTACT_TYPE').pipe(first()).subscribe({
      next: (lookups) => {
        this.contactTypeLookups = lookups || [];
        const mappedTypes = this.contactTypeLookups
          .map(item => {
            const parsedValue = Number(item.detailCode);
            return Number.isFinite(parsedValue)
              ? { value: parsedValue, label: `${item.nameAr} - ${item.nameEn}` }
              : null;
          })
          .filter((item): item is { value: number; label: string } => item !== null)
          .sort((a, b) => a.value - b.value);

        if (mappedTypes.length > 0) {
          this.contactTypes = mappedTypes;
        }

        if (!this.form['contactType'].value && this.contactTypes.length > 0) {
          this.contactForm.patchValue({ contactType: this.contactTypes[0].value });
        }
      },
      error: () => {
        if (this.contactTypes.length > 0 && !this.form['contactType'].value) {
          this.contactForm.patchValue({ contactType: this.contactTypes[0].value });
        }
      }
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
    this.contactForm.reset({
      contactType: this.contactTypes.length > 0 ? this.contactTypes[0].value : null,
      isAvailable: true
    });
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
      this.showError(this.translate.instant('CONTACT_SALES_PAGE.ICON_REQUIRED'));
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
          this.showSuccess(this.translate.instant('CONTACT_SALES_PAGE.UPDATE_SUCCESS'));
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
          this.showSuccess(this.translate.instant('CONTACT_SALES_PAGE.CREATE_SUCCESS'));
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
        this.contactSalesService.delete(contact.id).pipe(first()).subscribe({
          next: () => {
            this.showSuccess(this.translate.instant('CONTACT_SALES_PAGE.DELETE_SUCCESS'));
            this.loadContacts();
          },
          error: (error) => this.showError(error)
        });
      }
    });
  }

  getContactTypeLabel(type: number): string {
    const contactType = this.contactTypes.find(t => t.value === type);
    return contactType ? contactType.label : this.translate.instant('COMMON.NOT_AVAILABLE');
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
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('CONTACT_SALES_PAGE.BULK_DELETE_TEXT', { count: this.selectedContactIds.size }),
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES_DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    }).then((result) => {
      if (result.isConfirmed) {
        const contactIds = Array.from(this.selectedContactIds);
        this.contactSalesService.bulkDelete(contactIds).pipe(first()).subscribe({
          next: (response) => {
            this.selectedContactIds.clear();
            if (response.failedIds.length > 0) {
              this.showError(this.translate.instant('CONTACT_SALES_PAGE.BULK_DELETE_PARTIAL', {
                deleted: response.deletedCount,
                failed: response.failedIds.length
              }));
            } else {
              this.showSuccess(this.translate.instant('CONTACT_SALES_PAGE.BULK_DELETE_SUCCESS', {
                count: response.deletedCount
              }));
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
