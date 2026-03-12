import { Component } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ngxCsv } from 'ngx-csv';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { RootReducerState } from 'src/app/store';

import Swal from 'sweetalert2';

import { RoleService } from '../services/role.service';
import { first } from 'rxjs/operators';
import { CreateRoleRequest, Role, RoleUser, UpdateRoleRequest } from '../interfaces/role.interface';
import { ToastService } from '../../icons/toast-service';
import { getErrorMessage } from '../shared/error-message.util';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-roles',
  standalone: false,
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesComponent {
  breadCrumbItems!: Array<{}>;
  submitted = false;
  isLoading: boolean = true;
  roleForm!: UntypedFormGroup;
  masterSelected!: boolean;
  checkedList: any;
  content?: any;
  active: boolean = true;
  isEditMode = false;

  deleteId: string = '';

  role?: Role;
  selectedRoleName: string = '';
  roleUsers: RoleUser[] = [];
  pagedRoleUsers: RoleUser[] = [];
  isRoleUsersLoading: boolean = false;
  roleUsersPaginationService = new PaginationService();


  // Table data
  filteredRoles: Role[] = [];
  rolesList: Role[] = [];
  roles: Role[] = [];
  searchTerm: any;
  roleNameFilter = '';
  filterDate: any;
  status: any = '';
  // private restApiService: restApiService
  constructor(private modalService: NgbModal, public service: PaginationService,
    private formBuilder: UntypedFormBuilder,
    private roleService: RoleService,
    private toastService: ToastService,
    private store: Store<{ data: RootReducerState }>,
    private translate: TranslateService) {
  }

  ngOnInit(): void {
    /**
    * BreadCrumb
    */
    this.breadCrumbItems = [
      { label: this.translate.instant('MENUITEMS.EMPLOYEE_MANAGEMENT.TEXT') },
      { label: this.translate.instant('MENUITEMS.ADMIN.LIST.ROLE'), active: true }
    ];

    /**
    * Form Validation
    */

    this.initForm();
    this.getRoles();


  }

  initForm() {
    this.roleForm = this.formBuilder.group({
      _id: [''],
      roleName: ['', [Validators.required]],
      isActive: [true]
    });
  }
  getRoles() {
    this.isLoading = true;
    this.roleService
      .getRoles()
      .pipe(first())
      .subscribe({
        next: (roles: Role[]) => {
          this.isLoading = false;
          const loader = document.getElementById('elmLoader');

          if (loader) {
            loader.classList.add('d-none');
          }
          this.rolesList = roles;          // master data
          this.filteredRoles = roles;      // filtered data
          this.service.page = 1;           // reset page

          this.roles = this.service.changePage(this.filteredRoles);
        },
        error: (error) => {
          this.isLoading = false;
          const message = this.getErrorMessage(error);
          this.toastService.show(message, {
            classname: 'bg-danger text-white',
            delay: 3000
          });
        }
      });
  }

  saveUser() {

    if (this.roleForm.invalid) {

      this.submitted = true;
      return;
    }

    else {

      this.isLoading = true;
      if (this.roleForm.get('_id')?.value) {
        this.updateRole();
      }
      else {

        this.createRole();

      }


    }



    //this.submitted = true;

  }

  createRole() {

    const request: CreateRoleRequest = {
      name: this.form['roleName'].value,
      isActive: !!this.form['isActive'].value
    };

    this.roleService.createRole(request)
      .pipe(first())
      .subscribe({
        next: (role: Role) => {
          this.isLoading = false;
          // document.getElementById('elmLoader')?.classList.add('d-none');
          this.role = role


          this.modalService.dismissAll();

          this.openSuccessModal('created');
          setTimeout(() => {
            this.roleForm.reset();
          }, 2000);

        },
        error: (error) => {

          this.isLoading = false;
          const message = this.getErrorMessage(error);
          this.toastService.show(message, {
            classname: 'bg-danger text-white',
            delay: 3000
          });
        }
      });
  }

  updateRole() {

    const updateRequest: UpdateRoleRequest = {
      name: this.form['roleName'].value,
      isActive: !!this.form['isActive'].value,

    };
    const roleId = this.roleForm.get('_id')?.value;
    this.roleService.updateRole(roleId, updateRequest)
      .pipe(first())
      .subscribe({
        next: () => {
          this.isLoading = false;

          this.modalService.dismissAll();
          this.openSuccessModal('updated');

          setTimeout(() => {
            this.roleForm.reset();
          }, 2000);

        },
        error: (error) => {
          console.log(error);
          this.isLoading = false;
          const message = this.getErrorMessage(error);
          this.toastService.show(message, {
            classname: 'bg-danger text-white',
            delay: 3000
          });
        }
      });
  }
  changePage() {
    this.roles = this.service.changePage(this.filteredRoles);
  }

  onSort(column: any) {
    // resetting other headers
    this.roles = this.service.onSort(column, this.roles)
  }

  applyFilters() {

    let data = [...this.rolesList];

    // Role name filter
    const roleNameTerm = this.roleNameFilter.trim().toLowerCase();
    if (roleNameTerm) {
      data = data.filter(r => (r.name || '').toLowerCase().includes(roleNameTerm));
    }

    // ✅ Status filter
    if (this.status) {
      const statusBool = this.status === 'active';
      data = data.filter(r => r.isActive === statusBool);
    }

    // 📅 Date filter
    if (this.filterDate && Object.values(this.filterDate).length === 2) {
      const [start, end] = Object.values(this.filterDate);
      data = data.filter(r =>
        new Date(r.createdAt) >= new Date(start as string) &&
        new Date(r.createdAt) <= new Date(end as string)
      );
    }

    this.filteredRoles = data;

    // 🔥 IMPORTANT
    this.service.page = 1;   // reset page after filtering
    this.roles = this.service.changePage(this.filteredRoles);
  }

  clearFilters() {
    this.roleNameFilter = '';
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

  roleNameFilterChanged() {
    this.applyFilters();
  }



  async confirm(id: string) {
    const result = await Swal.fire({
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('COMMON.DELETE_CONFIRM_RECORD'),
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES_DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CLOSE'),
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    });

    if (result.isConfirmed) {
      this.deleteData(id);
    }
  }

  // Delete Data
  deleteData(id: string) {
    if (id) {
      this.isLoading = true;
      this.roleService.deleteRole(id)
        .pipe(first())
        .subscribe({
          next: () => {
            this.isLoading = false;


            this.openSuccessModal('deleted');


          },
          error: (error) => {
            console.log(error);
            this.isLoading = false;
            const message = this.getErrorMessage(error);
            this.toastService.show(message, {
              classname: 'bg-danger text-white',
              delay: 3000
            });
          }
        });

    }
    else {
      this.sendSelectedRolesToDelete();
    }
    this.deleteId = ''
    this.masterSelected = false
  }

  async openSuccessModal(action: 'created' | 'updated' | 'deleted') {
    await Swal.fire({
      title: this.translate.instant(this.getSuccessMessageKey(action)),
      icon: 'success',
      confirmButtonText: this.translate.instant('COMMON.OK'),
      confirmButtonColor: '#299cdb'
    });

    this.getRoles();
  }

  private getSuccessMessageKey(action: 'created' | 'updated' | 'deleted'): string {
    switch (action) {
      case 'created':
        return 'ROLE_PAGE.CREATE_SUCCESS';
      case 'updated':
        return 'ROLE_PAGE.UPDATE_SUCCESS';
      case 'deleted':
        return 'ROLE_PAGE.DELETE_SUCCESS';
      default:
        return 'COMMON.SUCCESS';
    }
  }
  /**
  * Multiple Delete
  */
  checkedValGet: any[] = [];
  async deleteMultiple() {
    const checkedVal = this.roles.filter(r => r.state).map(r => r.id);
    if (checkedVal.length === 0) {
      Swal.fire({
        text: this.translate.instant('ROLE_PAGE.SELECT_AT_LEAST_ONE'),
        confirmButtonText: this.translate.instant('COMMON.OK'),
        confirmButtonColor: '#299cdb',
      });
      return;
    }

    this.checkedValGet = checkedVal;
    const result = await Swal.fire({
      title: this.translate.instant('COMMON.ARE_YOU_SURE'),
      text: this.translate.instant('COMMON.DELETE_CONFIRM_RECORD'),
      icon: 'warning',
      iconHtml: '<lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style="width: 100px; height: 100px;"></lord-icon>',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.YES_DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CLOSE'),
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d'
    });

    if (result.isConfirmed) {
      this.deleteData('');
    }
  }

  /**
* Open modal
* @param content modal content
*/
  openModal(content: any) {
    this.submitted = false;
    this.isEditMode = false;
    this.role = undefined;
    this.roleForm.patchValue({
      _id: '',
      roleName: '',
      isActive: true
    });
    this.modalService.open(content, { size: 'md', centered: true });
  }

  /**
   * Form data get
   */
  get form() {
    return this.roleForm.controls;
  }

  /**
 * Save user
 */




  // The master checkbox will check/ uncheck all items
  checkUncheckAll(ev: any) {
    this.roles.forEach((x: { state: any; }) => x.state = ev.target.checked)
    var checkedVal: any[] = [];
    var result
    for (var i = 0; i < this.roles.length; i++) {
      if (this.roles[i].state == true) {
        result = this.roles[i];
        checkedVal.push(result);
      }
    }
    this.checkedValGet = checkedVal
    checkedVal.length > 0 ? (document.getElementById("remove-actions") as HTMLElement).style.display = "block" : (document.getElementById("remove-actions") as HTMLElement).style.display = "none";
  }

  // Select Checkbox value Get
  onCheckboxChange(e: any) {
    var checkedVal: any[] = [];
    var result
    for (var i = 0; i < this.roles.length; i++) {
      if (this.roles[i].state == true) {
        result = this.roles[i];
        checkedVal.push(result);
      }
    }
    this.checkedValGet = checkedVal
    checkedVal.length > 0 ? (document.getElementById("remove-actions") as HTMLElement).style.display = "block" : (document.getElementById("remove-actions") as HTMLElement).style.display = "none";
  }


  sendSelectedRolesToDelete() {

    if (this.checkedValGet.length === 0) {
      return;
    }
    this.isLoading = true;
    const roleIds = this.checkedValGet.map((x: any) => typeof x === 'string' ? x : x?.id).filter(Boolean);
    if (roleIds.length === 0) {
      this.isLoading = false;
      return;
    }
    this.roleService.deleteRoles(roleIds)
      .pipe(first())
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.openSuccessModal('deleted');

        },
        error: (error) => {

          this.isLoading = false;
          const message = this.getErrorMessage(error);
          this.toastService.show(message, {
            classname: 'bg-danger text-white',
            delay: 3000
          });
        }
      });
  }

  updateCheckedRoles() {
    this.checkedValGet = this.roles.filter(r => r.state);
    const removeActions = document.getElementById("remove-actions");
    if (removeActions) {
      removeActions.style.display = this.checkedValGet.length > 0 ? "block" : "none";
    }
  }
  /**
   * Open Edit modal
   * @param content modal content
   */
  editDataGet(role: Role, content: any) {

    this.submitted = false;
    this.isEditMode = true;
    this.modalService.open(content, { size: 'md', centered: true });
    this.role = role;
    this.roleForm.patchValue({
      roleName: role.name ?? '',
      _id: role.id ?? '',
      isActive: !!role.isActive
    });

  }

  closeModal() {
    this.modalService.dismissAll();
    this.isEditMode = false;
    this.role = undefined;
    this.roleForm.patchValue({
      _id: '',
      roleName: '',
      isActive: true
    });
    this.roleForm.markAsPristine();
    this.roleForm.markAsUntouched();
  }

  openRoleUsersModal(content: any, role: Role) {
    this.selectedRoleName = role.name;
    this.roleUsers = [];
    this.pagedRoleUsers = [];
    this.isRoleUsersLoading = true;
    this.roleUsersPaginationService.page = 1;

    this.modalService.open(content, { size: 'lg', centered: true });

    this.roleService.getUsersByRole(role.id)
      .pipe(first())
      .subscribe({
        next: (users: RoleUser[]) => {
          this.isRoleUsersLoading = false;
          this.roleUsers = users;
          this.pagedRoleUsers = this.roleUsersPaginationService.changePage(this.roleUsers);
        },
        error: (error) => {
          this.isRoleUsersLoading = false;
          const message = this.getErrorMessage(error, 'Failed to load role users');
          this.toastService.show(message, {
            classname: 'bg-danger text-white',
            delay: 3000
          });
        }
      });
  }

  onRoleUsersPageChange(page: number) {
    this.roleUsersPaginationService.page = page;
    this.pagedRoleUsers = this.roleUsersPaginationService.changePage(this.roleUsers);
  }


  // Csv File Export
  csvFileExport() {
    var role = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalseparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'Customer Data',
      useBom: true,
      noDownload: false,
      headers: ["id", , "name", "createdAt"]
    };
    new ngxCsv(this.content, "roles", role);
  }

  private getErrorMessage(error: any, fallback = 'Something went wrong'): string {
    return getErrorMessage(error, fallback);
  }
  /**
  * Sort table data
  * @param param0 sort the column
  *
  */

}
