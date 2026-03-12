import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { ToastService } from '../../icons/toast-service';
import { AspNetUser, UpdateAspNetUserRequest } from '../interfaces/aspnet-user.interface';
import { Branch } from '../interfaces/branch.interface';
import { AdminUserService } from '../services/admin-user.service';
import { BranchService } from '../services/branch.service';
import { getErrorMessage } from '../shared/error-message.util';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  standalone: false
})
export class UsersComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  users: AspNetUser[] = [];
  filteredUsers: AspNetUser[] = [];
  pagedUsers: AspNetUser[] = [];
  branches: Branch[] = [];
  searchTerm = '';
  isLoading = false;
  selectedUser?: AspNetUser;
  editableUser?: UpdateAspNetUserRequest;
  isDetailsModalOpen = false;
  isEditMode = false;
  isSaving = false;
  togglingUserId: string | null = null;

  constructor(
    public service: PaginationService,
    private adminUserService: AdminUserService,
    private branchService: BranchService,
    private toastService: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.REQUEST.TEXT') },
      { label: this.translate.instant('MENUITEMS.REQUEST.LIST.USERS'), active: true }
    ];
    this.loadUsers();
    this.loadBranches();
  }

  loadUsers() {
    this.isLoading = true;
    this.adminUserService.getUsers().pipe(first()).subscribe({
      next: (users) => {
        this.users = users || [];
        this.applyFilters(true);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.showError(error);
      }
    });
  }

  loadBranches() {
    this.branchService.getBranches().pipe(first()).subscribe({
      next: (branches) => {
        this.branches = branches || [];
      },
      error: () => {
        this.branches = [];
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

  onPageChange(page: number) {
    this.service.page = page;
    this.pagedUsers = this.service.changePage(this.filteredUsers);
  }

  openDetails(user: AspNetUser) {
    this.selectedUser = user;
    this.editableUser = undefined;
    this.isEditMode = false;
    this.isDetailsModalOpen = true;
  }

  openEdit(user: AspNetUser) {
    this.selectedUser = user;
    this.editableUser = {
      userName: user.userName || '',
      email: user.email || '',
      nameAr: user.nameAr || user.fullNameAr || '',
      nameEn: user.nameEn || user.fullNameEn || '',
      branchId: user.branchId
    };
    this.isEditMode = true;
    this.isDetailsModalOpen = true;
  }

  saveUser() {
    if (!this.selectedUser || !this.editableUser) {
      return;
    }

    if (
      !this.editableUser.userName.trim() ||
      !this.editableUser.email.trim() ||
      !this.editableUser.nameAr.trim() ||
      !this.editableUser.nameEn.trim() ||
      !this.editableUser.branchId
    ) {
      this.showError(this.translate.instant('USERS_PAGE.FILL_REQUIRED'));
      return;
    }

    this.isSaving = true;
    this.adminUserService.updateUser(this.selectedUser.id, {
      userName: this.editableUser.userName.trim(),
      email: this.editableUser.email.trim(),
      nameAr: this.editableUser.nameAr.trim(),
      nameEn: this.editableUser.nameEn.trim(),
      branchId: this.editableUser.branchId
    }).pipe(first()).subscribe({
      next: async () => {
        const selectedUserId = this.selectedUser?.id;
        this.users = this.users.map((item) =>
          item.id === selectedUserId
            ? {
                ...item,
                userName: this.editableUser?.userName ?? item.userName,
                email: this.editableUser?.email ?? item.email,
                nameAr: this.editableUser?.nameAr ?? item.nameAr,
                nameEn: this.editableUser?.nameEn ?? item.nameEn,
                fullNameAr: this.editableUser?.nameAr ?? item.fullNameAr,
                fullNameEn: this.editableUser?.nameEn ?? item.fullNameEn,
                branchId: this.editableUser?.branchId ?? item.branchId
              }
            : item
        );
        this.applyFilters();
        this.isSaving = false;
        this.closeDetails();

        await Swal.fire({
          icon: 'success',
          title: this.translate.instant('COMMON.SUCCESS'),
          text: this.translate.instant('USERS_PAGE.UPDATE_SUCCESS'),
          confirmButtonText: this.translate.instant('COMMON.OK'),
          confirmButtonColor: '#299cdb'
        });
      },
      error: (error) => {
        this.isSaving = false;
        this.showError(error);
      }
    });
  }

  async toggleUserStatus(user: AspNetUser) {
    const isActivate = user.isLocked;
    const confirmResult = await Swal.fire({
      icon: 'question',
      title: this.translate.instant(isActivate ? 'USERS_PAGE.ACTIVATE_TITLE' : 'USERS_PAGE.DEACTIVATE_TITLE'),
      text: this.translate.instant(isActivate ? 'USERS_PAGE.ACTIVATE_CONFIRM' : 'USERS_PAGE.DEACTIVATE_CONFIRM', {
        userName: user.userName
      }),
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.OK'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: '#299cdb'
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    this.togglingUserId = user.id;
    const request$ = isActivate
      ? this.adminUserService.activateUser(user.id)
      : this.adminUserService.deactivateUser(user.id);

    request$.pipe(first()).subscribe({
      next: async () => {
        this.users = this.users.map((item) =>
          item.id === user.id
            ? { ...item, isLocked: !isActivate }
            : item
        );
        this.applyFilters();
        this.togglingUserId = null;

        await Swal.fire({
          icon: 'success',
          title: this.translate.instant('COMMON.SUCCESS'),
          text: this.translate.instant(isActivate ? 'USERS_PAGE.ACTIVATE_SUCCESS' : 'USERS_PAGE.DEACTIVATE_SUCCESS'),
          confirmButtonText: this.translate.instant('COMMON.OK'),
          confirmButtonColor: '#299cdb'
        });
      },
      error: (error) => {
        this.togglingUserId = null;
        this.showError(error);
      }
    });
  }

  closeDetails() {
    this.selectedUser = undefined;
    this.editableUser = undefined;
    this.isDetailsModalOpen = false;
    this.isEditMode = false;
  }

  getBranchName(branchId: number): string {
    const branch = this.branches.find(x => x.id === branchId);
    if (!branch) {
      return '-';
    }
    return `${branch.branchNameAr || '-'} / ${branch.branchNameEn || '-'}`;
  }

  getUserName(user: AspNetUser): string {
    return user.nameAr || user.fullNameAr || user.nameEn || user.fullNameEn || '-';
  }

  private applyFilters(resetPage = false) {
    let data = [...this.users];
    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      data = data.filter(user =>
        (user.userName || '').toLowerCase().includes(term) ||
        (user.email || '').toLowerCase().includes(term) ||
        (user.nameAr || user.fullNameAr || '').toLowerCase().includes(term) ||
        (user.nameEn || user.fullNameEn || '').toLowerCase().includes(term)
      );
    }

    this.filteredUsers = data;
    if (resetPage) {
      this.service.page = 1;
    }
    this.pagedUsers = this.service.changePage(this.filteredUsers);
  }

  private showError(error: any) {
    const message = typeof error === 'string' ? error : getErrorMessage(error);
    this.toastService.show(message, {
      classname: 'bg-danger text-white',
      delay: 3000
    });
  }
}
