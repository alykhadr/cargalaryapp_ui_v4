import { Component } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { first } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { Branch, CreateBranchRequest, UpdateBranchRequest } from '../interfaces/branch.interface';
import { BranchService } from '../services/branch.service';
import { ContactSalesService } from '../services/contact-sales.service';
import { AdminEmployeeService } from '../services/admin-employee.service';
import { getErrorMessage } from '../shared/error-message.util';
import { TranslateService } from '@ngx-translate/core';
import { circleMarker, latLng, Layer, LeafletMouseEvent, MapOptions, tileLayer } from 'leaflet';

@Component({
  selector: 'app-branches',
  standalone: false,
  templateUrl: './branches.component.html',
  styleUrl: './branches.component.scss'
})
export class BranchesComponent {
  private readonly defaultMapLatitude = 24.7136;
  private readonly defaultMapLongitude = 46.6753;

  breadCrumbItems!: Array<{}>;
  submitted = false;
  isLoading = true;
  branchForm!: UntypedFormGroup;
  masterSelected = false;
  content?: any;

  deleteId: number | null = null;

  branchesList: Branch[] = [];
  filteredBranches: Branch[] = [];
  branches: Branch[] = [];

  nameFilter = '';
  emailFilter = '';
  status: '' | 'active' | 'blocked' = '';
  filterDate: any;

  checkedValGet: Branch[] = [];

  // Working days
  weekDays = [
    { dayEn: 'Sunday', dayAr: 'الأحد' },
    { dayEn: 'Monday', dayAr: 'الإثنين' },
    { dayEn: 'Tuesday', dayAr: 'الثلاثاء' },
    { dayEn: 'Wednesday', dayAr: 'الأربعاء' },
    { dayEn: 'Thursday', dayAr: 'الخميس' },
    { dayEn: 'Friday', dayAr: 'الجمعة' },
    { dayEn: 'Saturday', dayAr: 'السبت' }
  ];
  workingDays: any[] = [];
  expandedBranchId: number | null = null;
  branchContactSales: any[] = [];
  pagedBranchContactSales: any[] = [];
  loadingContactSales = false;
  contactSalesPage = 1;
  contactSalesPageSize = 5;
  Math = Math;

  branchUsers: any[] = [];
  pagedBranchUsers: any[] = [];
  loadingUsers = false;
  usersPage = 1;
  usersPageSize = 5;

  contactTypes = [
    { value: 1, label: 'Mobile' },
    { value: 2, label: 'WhatsApp' },
    { value: 3, label: 'Email' }
  ];

  branchMapOptions: MapOptions = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      })
    ],
    zoom: 10,
    center: latLng(this.defaultMapLatitude, this.defaultMapLongitude)
  };
  branchMapLayers: Layer[] = [];

  constructor(
    private modalService: NgbModal,
    public service: PaginationService,
    private formBuilder: UntypedFormBuilder,
    private branchService: BranchService,
    private toastService: ToastService,
    private contactSalesService: ContactSalesService,
    private adminEmployeeService: AdminEmployeeService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.EMPLOYEE_MANAGEMENT.TEXT') },
      { label: this.translate.instant('MENUITEMS.ADMIN.LIST.BRANCH'), active: true }
    ];

    this.initForm();
    this.initWorkingDays();
    this.getBranches();
  }

  initWorkingDays() {
    this.workingDays = this.weekDays.map(day => ({
      dayEn: day.dayEn,
      dayAr: day.dayAr,
      isAvailable: day.dayEn !== 'Friday',
      workingFrom: day.dayEn !== 'Friday' ? 9 : null,
      workingTo: day.dayEn !== 'Friday' ? 17 : null,
      timeType: '24H'
    }));
  }

  initForm() {
    this.branchForm = this.formBuilder.group({
      _id: [''],
      branchNameAr: ['', [Validators.required, Validators.maxLength(100)]],
      branchNameEn: ['', [Validators.required, Validators.maxLength(100)]],
      descriptionAr: [''],
      descriptionEn: [''],
      mobileNo: ['', [Validators.required, Validators.pattern(/^05\d{8}$/)]],
      whatsUpNo: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      address: ['', [Validators.required]],
      latitute: ['', [Validators.required]],
      longtute: ['', [Validators.required]],
      isAvailable: [true]
    });
  }

  getBranches() {
    this.isLoading = true;
    this.branchService.getBranches().pipe(first()).subscribe({
      next: (branches) => {
        this.isLoading = false;
        this.branchesList = branches;
        this.filteredBranches = branches;
        this.service.page = 1;
        this.branches = this.service.changePage(this.filteredBranches);
      },
      error: (error) => {
        this.isLoading = false;
        this.showError(error);
      }
    });
  }

  saveBranch() {
    this.submitted = true;
    if (this.branchForm.invalid) {
      return;
    }

    this.isLoading = true;
    if (this.branchForm.get('_id')?.value) {
      this.updateBranch();
    } else {
      this.createBranch();
    }
  }

  createBranch() {
    const request: CreateBranchRequest = {
      branchNameAr: this.form['branchNameAr'].value,
      branchNameEn: this.form['branchNameEn'].value,
      descriptionAr: this.form['descriptionAr'].value,
      descriptionEn: this.form['descriptionEn'].value,
      mobileNo: this.form['mobileNo'].value,
      whatsUpNo: this.form['whatsUpNo'].value,
      email: this.form['email'].value,
      address: this.form['address'].value,
      latitute: this.form['latitute'].value,
      longtute: this.form['longtute'].value,
      isAvailable: !!this.form['isAvailable'].value,
      createBranchWorkingDaysRequestDto: this.workingDays.map(day => ({
        dayEn: day.dayEn,
        dayAr: day.dayAr,
        isAvailable: day.isAvailable,
        workingFrom: day.isAvailable ? day.workingFrom : null,
        workingTo: day.isAvailable ? day.workingTo : null,
        timeType: day.timeType
      }))
    };

    if (!this.validateWorkingDays()) {
      this.isLoading = false;
      return;
    }

    this.branchService.createBranch(request).pipe(first()).subscribe({
      next: () => {
        this.isLoading = false;
        this.modalService.dismissAll();
        this.openSuccessModal('created');
        setTimeout(() => this.branchForm.reset(), 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.showError(error);
      }
    });
  }

  updateBranch() {
    const branchId = Number(this.branchForm.get('_id')?.value);
    const updateRequest: UpdateBranchRequest = {
      branchNameAr: this.form['branchNameAr'].value,
      branchNameEn: this.form['branchNameEn'].value,
      descriptionAr: this.form['descriptionAr'].value,
      descriptionEn: this.form['descriptionEn'].value,
      mobileNo: this.form['mobileNo'].value,
      whatsUpNo: this.form['whatsUpNo'].value,
      email: this.form['email'].value,
      address: this.form['address'].value,
      latitute: this.form['latitute'].value,
      longtute: this.form['longtute'].value,
      isAvailable: !!this.form['isAvailable'].value,
      createBranchWorkingDaysRequestDto: this.workingDays.map(day => ({
        dayEn: day.dayEn,
        dayAr: day.dayAr,
        isAvailable: day.isAvailable,
        workingFrom: day.isAvailable ? day.workingFrom : null,
        workingTo: day.isAvailable ? day.workingTo : null,
        timeType: day.timeType
      }))
    };

    this.branchService.updateBranch(branchId, updateRequest).pipe(first()).subscribe({
      next: () => {
        this.isLoading = false;
        this.modalService.dismissAll();
        this.openSuccessModal('updated');
        setTimeout(() => this.branchForm.reset(), 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.showError(error);
      }
    });
  }

  changePage() {
    this.branches = this.service.changePage(this.filteredBranches);
  }

  applyFilters() {
    let data = [...this.branchesList];

    const nameTerm = this.nameFilter.trim().toLowerCase();
    if (nameTerm) {
      data = data.filter(b =>
        (b.branchNameAr || '').toLowerCase().includes(nameTerm) ||
        (b.branchNameEn || '').toLowerCase().includes(nameTerm)
      );
    }

    const emailTerm = this.emailFilter.trim().toLowerCase();
    if (emailTerm) {
      data = data.filter(b => (b.email || '').toLowerCase().includes(emailTerm));
    }

    if (this.status) {
      const statusBool = this.status === 'active';
      data = data.filter(b => b.isAvailable === statusBool);
    }

    if (this.filterDate && Object.values(this.filterDate).length === 2) {
      const [start, end] = Object.values(this.filterDate);
      data = data.filter(b =>
        new Date(b.createdAt) >= new Date(start as string) &&
        new Date(b.createdAt) <= new Date(end as string)
      );
    }

    this.filteredBranches = data;
    this.service.page = 1;
    this.branches = this.service.changePage(this.filteredBranches);
  }

  clearFilters() {
    this.nameFilter = '';
    this.emailFilter = '';
    this.filterDate = null;
    this.status = '';
    this.applyFilters();
  }

  statusFilter() {
    this.applyFilters();
  }

  dateFilter() {
    this.applyFilters();
  }

  nameFilterChanged() {
    this.applyFilters();
  }

  emailFilterChanged() {
    this.applyFilters();
  }

  async confirm(id: number) {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to remove this record?',
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete It!',
      cancelButtonText: 'Close',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    });

    if (result.isConfirmed) {
      this.deleteData(id);
    }
  }

  deleteData(id: number | null) {
    if (id) {
      this.isLoading = true;
      this.branchService.deleteBranch(id).pipe(first()).subscribe({
        next: () => {
          this.isLoading = false;
          this.openSuccessModal('deleted');
        },
        error: (error) => {
          this.isLoading = false;
          this.showError(error);
        }
      });
      return;
    }

    this.sendSelectedBranchesToDelete();
    this.deleteId = null;
    this.masterSelected = false;
  }

  async deleteMultiple() {
    const selected = this.branches.filter(b => b.state);
    if (selected.length === 0) {
      Swal.fire({ text: 'Please select at least one checkbox', confirmButtonColor: '#299cdb' });
      return;
    }

    this.checkedValGet = selected;
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to remove this record?',
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete It!',
      cancelButtonText: 'Close',
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    });

    if (result.isConfirmed) {
      this.deleteData(null);
    }
  }

  sendSelectedBranchesToDelete() {
    if (this.checkedValGet.length === 0) {
      return;
    }

    this.isLoading = true;
    const requests = this.checkedValGet.map(branch => this.branchService.deleteBranch(branch.id));
    forkJoin(requests).pipe(first()).subscribe({
      next: () => {
        this.isLoading = false;
        this.openSuccessModal('deleted');
      },
      error: (error) => {
        this.isLoading = false;
        this.showError(error);
      }
    });
  }

  checkUncheckAll(ev: any) {
    this.branches.forEach(x => x.state = ev.target.checked);
    this.updateCheckedBranches();
  }

  onCheckboxChange() {
    this.updateCheckedBranches();
  }

  updateCheckedBranches() {
    this.checkedValGet = this.branches.filter(b => b.state);
    const removeActions = document.getElementById('remove-actions');
    if (removeActions) {
      removeActions.style.display = this.checkedValGet.length > 0 ? 'block' : 'none';
    }
  }

  openModal(content: any) {
    this.submitted = false;
    this.branchForm.reset({ isAvailable: true });
    this.branchForm.patchValue({ latitute: '', longtute: '' });
    this.initializeBranchMap();
    this.initWorkingDays();
    const modelTitle = document.querySelector('.modal-title') as HTMLAreaElement;
    if (modelTitle) {
      modelTitle.innerHTML = 'Add Branch';
    }
    this.modalService.open(content, { size: 'xl', centered: true });
  }

  editDataGet(index: number, content: any) {
    this.submitted = false;
    this.modalService.open(content, { size: 'xl', centered: true });

    const modelTitle = document.querySelector('.modal-title') as HTMLAreaElement;
    if (modelTitle) {
      modelTitle.innerHTML = 'Edit Branch';
    }

    const branch = this.filteredBranches[index];
    this.branchForm.patchValue({
      _id: branch.id,
      branchNameAr: branch.branchNameAr,
      branchNameEn: branch.branchNameEn,
      descriptionAr: branch.descriptionAr,
      descriptionEn: branch.descriptionEn,
      mobileNo: branch.mobileNo,
      whatsUpNo: branch.whatsUpNo,
      email: branch.email,
      address: branch.address,
      latitute: branch.latitute,
      longtute: branch.longtute,
      isAvailable: branch.isAvailable
    });

    this.initializeBranchMap(branch.latitute, branch.longtute);

    // Load working days if available
    if (branch.branchWorkingDaysResponseDtos && branch.branchWorkingDaysResponseDtos.length > 0) {
      this.workingDays = branch.branchWorkingDaysResponseDtos.map(day => ({
        dayEn: day.dayEn,
        dayAr: day.dayAr,
        isAvailable: day.isAvailable,
        workingFrom: day.workingFrom,
        workingTo: day.workingTo,
        timeType: day.timeType
      }));
    } else {
      this.initWorkingDays();
    }
  }

  closeModal() {
    this.modalService.dismissAll();
    this.branchForm.reset();
    this.initializeBranchMap();
    this.submitted = false;
    const modelTitle = document.querySelector('.modal-title') as HTMLAreaElement;
    if (modelTitle) {
      modelTitle.innerHTML = 'Add Branch';
    }
  }

  get form() {
    return this.branchForm.controls;
  }

  onBranchMapClick(event: LeafletMouseEvent) {
    this.setBranchLocation(event.latlng.lat, event.latlng.lng);
  }

  private initializeBranchMap(latitute?: string, longtute?: string) {
    const parsedLat = Number(latitute);
    const parsedLng = Number(longtute);
    const hasValidPoint =
      Number.isFinite(parsedLat) &&
      Number.isFinite(parsedLng) &&
      parsedLat >= -90 &&
      parsedLat <= 90 &&
      parsedLng >= -180 &&
      parsedLng <= 180;

    const centerLat = hasValidPoint ? parsedLat : this.defaultMapLatitude;
    const centerLng = hasValidPoint ? parsedLng : this.defaultMapLongitude;

    this.branchMapOptions = {
      ...this.branchMapOptions,
      center: latLng(centerLat, centerLng),
      zoom: hasValidPoint ? 13 : 10
    };

    if (hasValidPoint) {
      this.updateBranchMapMarker(centerLat, centerLng);
    } else {
      this.branchMapLayers = [];
    }
  }

  private setBranchLocation(lat: number, lng: number) {
    const latValue = lat.toFixed(6);
    const lngValue = lng.toFixed(6);

    this.branchForm.patchValue({
      latitute: latValue,
      longtute: lngValue
    });
    this.branchForm.get('latitute')?.markAsTouched();
    this.branchForm.get('longtute')?.markAsTouched();

    this.updateBranchMapMarker(lat, lng);
  }

  private updateBranchMapMarker(lat: number, lng: number) {
    this.branchMapLayers = [
      circleMarker([lat, lng], {
        radius: 8,
        color: '#0d6efd',
        fillColor: '#0d6efd',
        fillOpacity: 0.35,
        weight: 2
      })
    ];
  }

  get totalBranches(): number {
    return this.filteredBranches.length;
  }

  get activeBranches(): number {
    return this.filteredBranches.filter(b => b.isAvailable).length;
  }

  get inactiveBranches(): number {
    return this.filteredBranches.filter(b => !b.isAvailable).length;
  }

  async openSuccessModal(action: 'created' | 'updated' | 'deleted') {
    const title = this.translate.instant(this.getSuccessMessageKey(action));

    await Swal.fire({
      title,
      icon: 'success',
      confirmButtonText: this.translate.instant('COMMON.OK'),
      confirmButtonColor: '#299cdb'
    });

    this.getBranches();
  }

  private getSuccessMessageKey(action: 'created' | 'updated' | 'deleted'): string {
    switch (action) {
      case 'created':
        return 'BRANCH_PAGE.CREATE_SUCCESS';
      case 'updated':
        return 'BRANCH_PAGE.UPDATE_SUCCESS';
      case 'deleted':
        return 'BRANCH_PAGE.DELETE_SUCCESS';
      default:
        return 'COMMON.SUCCESS';
    }
  }

  private showError(error: any) {
    const message = getErrorMessage(error);
    this.toastService.show(message, {
      classname: 'bg-danger text-white',
      delay: 3000
    });
  }

  validateWorkingDays(): boolean {
    for (const day of this.workingDays) {
      if (day.isAvailable) {
        if (day.workingFrom == null || day.workingTo == null) {
          this.showError({ message: `${day.dayEn}: Working hours required when day is available` });
          return false;
        }
        if (day.workingFrom < 0 || day.workingFrom > 23) {
          this.showError({ message: `${day.dayEn}: Working from must be between 0 and 23` });
          return false;
        }
        if (day.workingTo < 0 || day.workingTo > 23) {
          this.showError({ message: `${day.dayEn}: Working to must be between 0 and 23` });
          return false;
        }
        if (day.workingFrom >= day.workingTo) {
          this.showError({ message: `${day.dayEn}: Working from must be less than working to` });
          return false;
        }
        if (!day.timeType || !['AM', 'PM', '24H'].includes(day.timeType)) {
          this.showError({ message: `${day.dayEn}: Time type must be AM, PM, or 24H` });
          return false;
        }
      }
    }
    return true;
  }

  toggleDayAvailability(day: any) {
    if (!day.isAvailable) {
      day.workingFrom = null;
      day.workingTo = null;
    } else {
      day.workingFrom = 9;
      day.workingTo = 17;
    }
  }

  toggleBranchAvailability(isAvailable: boolean) {
    this.branchForm.get('isAvailable')?.setValue(isAvailable);
    
    if (!isAvailable) {
      // Disable all working days when branch is disabled
      this.workingDays.forEach(day => {
        day.isAvailable = false;
        day.workingFrom = null;
        day.workingTo = null;
      });
    } else {
      // Enable all working days when branch is enabled
      this.workingDays.forEach(day => {
        day.isAvailable = true;
        day.workingFrom = 9;
        day.workingTo = 17;
      });
    }
  }

  toggleWorkingDays(branchId: number) {
    this.expandedBranchId = this.expandedBranchId === branchId ? null : branchId;
  }

  viewContactSales(branchId: number, modal: any) {
    this.loadingContactSales = true;
    this.branchContactSales = [];
    this.pagedBranchContactSales = [];
    this.contactSalesPage = 1;
    this.modalService.open(modal, { size: 'lg', centered: true });
    
    this.contactSalesService.getAll().pipe(first()).subscribe({
      next: (contacts) => {
        this.branchContactSales = contacts.filter(c => c.branchId === branchId);
        this.updateContactSalesPagination();
        this.loadingContactSales = false;
      },
      error: (error) => {
        this.loadingContactSales = false;
        this.showError(error);
      }
    });
  }

  updateContactSalesPagination() {
    const startIndex = (this.contactSalesPage - 1) * this.contactSalesPageSize;
    const endIndex = startIndex + this.contactSalesPageSize;
    this.pagedBranchContactSales = this.branchContactSales.slice(startIndex, endIndex);
  }

  onContactSalesPageChange(page: number) {
    this.contactSalesPage = page;
    this.updateContactSalesPagination();
  }

  getContactTypeLabel(type: number): string {
    const contactType = this.contactTypes.find(t => t.value === type);
    return contactType ? contactType.label : 'Unknown';
  }

  viewBranchUsers(branchId: number, modal: any) {
    this.loadingUsers = true;
    this.branchUsers = [];
    this.pagedBranchUsers = [];
    this.usersPage = 1;
    this.modalService.open(modal, { size: 'lg', centered: true });
    
    this.adminEmployeeService.getEmployeesByBranch(branchId).pipe(first()).subscribe({
      next: (users) => {
        this.branchUsers = users;
        this.updateUsersPagination();
        this.loadingUsers = false;
      },
      error: (error) => {
        this.loadingUsers = false;
        this.showError(error);
      }
    });
  }

  updateUsersPagination() {
    const startIndex = (this.usersPage - 1) * this.usersPageSize;
    const endIndex = startIndex + this.usersPageSize;
    this.pagedBranchUsers = this.branchUsers.slice(startIndex, endIndex);
  }

  onUsersPageChange(page: number) {
    this.usersPage = page;
    this.updateUsersPagination();
  }
}
