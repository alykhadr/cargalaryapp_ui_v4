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
import { getErrorMessage } from '../shared/error-message.util';

@Component({
  selector: 'app-branches',
  standalone: false,
  templateUrl: './branches.component.html',
  styleUrl: './branches.component.scss'
})
export class BranchesComponent {
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

  constructor(
    private modalService: NgbModal,
    public service: PaginationService,
    private formBuilder: UntypedFormBuilder,
    private branchService: BranchService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Admin' },
      { label: 'Branches', active: true }
    ];

    this.initForm();
    this.getBranches();
  }

  initForm() {
    this.branchForm = this.formBuilder.group({
      _id: [''],
      branchNameAr: ['', [Validators.required]],
      branchNameEn: ['', [Validators.required]],
      descriptionAr: [''],
      descriptionEn: [''],
      mobileNo: [''],
      whatsUpNo: [''],
      email: ['', [Validators.email]],
      address: [''],
      latitute: [''],
      longtute: [''],
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
      isAvailable: !!this.form['isAvailable'].value
    };

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
      isAvailable: !!this.form['isAvailable'].value
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

  confirm(content: any, id: number) {
    this.deleteId = id;
    this.modalService.open(content, { centered: true });
  }

  deleteData(id: number | null) {
    if (id) {
      this.isLoading = true;
      this.branchService.deleteBranch(id).pipe(first()).subscribe({
        next: () => {
          this.isLoading = false;
          this.modalService.dismissAll();
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

  deleteMultiple(content: any) {
    const selected = this.branches.filter(b => b.state);
    if (selected.length === 0) {
      Swal.fire({ text: 'Please select at least one checkbox', confirmButtonColor: '#299cdb' });
      return;
    }

    this.checkedValGet = selected;
    this.modalService.open(content, { centered: true });
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
        this.modalService.dismissAll();
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
    this.modalService.open(content, { size: 'lg', centered: true });
  }

  editDataGet(index: number, content: any) {
    this.submitted = false;
    this.modalService.open(content, { size: 'lg', centered: true });

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
  }

  closeModal() {
    this.modalService.dismissAll();
    this.branchForm.reset();
  }

  get form() {
    return this.branchForm.controls;
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

  async openSuccessModal(action: string) {
    let timerInterval: any;
    Swal.fire({
      title: `Branch ${action} successfully!`,
      icon: 'success',
      timer: 2000,
      timerProgressBar: true,
      willClose: () => {
        clearInterval(timerInterval);
      }
    }).then(() => {
      this.getBranches();
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
