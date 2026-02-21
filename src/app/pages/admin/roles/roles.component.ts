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
import { CreateRoleRequest, Role, UpdateRoleRequest } from '../interfaces/role.interface';
import { ToastService } from '../../icons/toast-service';

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

  deleteId: string = '';

  role?: Role;


  // Table data
  filteredRoles: Role[] = [];
  rolesList: Role[] = [];
  roles: Role[] = [];
  searchTerm: any;
  filterDate: any;
  status: any = '';
  // private restApiService: restApiService
  constructor(private modalService: NgbModal, public service: PaginationService,
    private formBuilder: UntypedFormBuilder,
    private roleService: RoleService,
    private toastService: ToastService,
    private store: Store<{ data: RootReducerState }>) {
  }

  ngOnInit(): void {
    /**
    * BreadCrumb
    */
    this.breadCrumbItems = [
      { label: 'Admin' },
      { label: 'Roles', active: true }
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
      roleName: ['', [Validators.required]]
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
          this.toastService.show(error, {
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

    setTimeout(() => {
      this.roleForm.reset();
    }, 2000);

    this.submitted = true;

  }

  createRole() {

    const request: CreateRoleRequest = {
      name: this.form['roleName'].value,
      isActive: true
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
           
        },
        error: (error) => {
          this.isLoading = false;
          this.toastService.show(error, {
            classname: 'bg-danger text-white',
            delay: 3000
          });
        }
      });
  }

  updateRole() {
   
    const updateRequest: UpdateRoleRequest = {
      name: this.form['roleName'].value,
      isActive: true,

    };
    const roleId = this.roleForm.get('_id')?.value;
    this.roleService.updateRole(roleId, updateRequest)
      .pipe(first())
      .subscribe({
        next: () => {
          this.isLoading = false;
          // document.getElementById('elmLoader')?.classList.add('d-none');
          //success alert
        

          this.modalService.dismissAll();
          this.openSuccessModal('updated');
          
        },
        error: (error) => {
          console.log(error);
          this.isLoading = false;
          this.toastService.show(error, {
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

    // 🔎 Search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();

      data = data.filter(r => {
        const statusText = r.isActive ? 'active' : 'blocked';

        return (
          r.name.toLowerCase().includes(term) ||
          r.createdAt.toLowerCase().includes(term) ||
          statusText.includes(term)
        );
      });
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

  statusFilter() {
    this.applyFilters();
  }

  // Search Data
  performSearch(): void {
    this.applyFilters();
  }

  dateFilter() {
    this.applyFilters();
  }



  confirm(content: any, id: string) {
    this.deleteId = id;
    this.modalService.open(content, { centered: true });
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
           

            this.modalService.dismissAll();
            this.openSuccessModal('deleted');

           
          },
          error: (error) => {
            console.log(error);
            this.isLoading = false;
            this.toastService.show(error, {
              classname: 'bg-danger text-white',
              delay: 3000
            });
          }
        });

    }
    else{
      this.sendSelectedRolesToDelete();
    }
    this.deleteId = ''
    this.masterSelected = false
  }

  async openSuccessModal(action: string) {

    let timerInterval: any;
    Swal.fire({
      title: `Role ${action} successfully!`,
      icon: 'success',
      timer: 2000,
      timerProgressBar: true,
      willClose: () => {
        clearInterval(timerInterval);
      },
    }).then((result) => {
       this.getRoles();
      /* Read more about handling dismissals below */
      if (result.dismiss === Swal.DismissReason.timer) {
      }
    });
  }
  /**
  * Multiple Delete
  */
  checkedValGet: any[] = [];
  deleteMultiple(content: any) {
    debugger;
    var checkboxes: any = document.getElementsByName('checkAll');
    var result
    var checkedVal: any[] = [];
    for (var i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) {
        result = checkboxes[i].value;
        checkedVal.push(result);
      }
    }
    if (checkedVal.length > 0) {
      this.modalService.open(content, { centered: true });
    }
    else {
      Swal.fire({ text: 'Please select at least one checkbox', confirmButtonColor: '#299cdb', });
    }
    this.checkedValGet = checkedVal;
  }

  /**
* Open modal
* @param content modal content
*/
  openModal(content: any) {
    this.submitted = false;
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
   const roleIds = this.checkedValGet;
  this.roleService.deleteRoles(roleIds)
    .pipe(first())
    .subscribe({
      next: () => {
        this.isLoading = false;
         this.modalService.dismissAll();
        this.openSuccessModal( 'deleted');
       
      },
      error: (error) => {
        
        this.isLoading = false;
        this.toastService.show(error, {
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
  editDataGet(id: any, content: any) {

    this.submitted = false;
    this.modalService.open(content, { size: 'md', centered: true });

    var modelTitle = document.querySelector('.modal-title') as HTMLAreaElement;
    modelTitle.innerHTML = 'Edit Role';
    var updateBtn = document.getElementById('add-btn') as HTMLAreaElement;
    updateBtn.innerHTML = "Update";
    this.role = this.rolesList[id];
    this.roleForm.controls['roleName'].setValue(this.role.name);
    this.roleForm.controls['_id'].setValue(this.role.id);

  }

  closeModal() {
    this.modalService.dismissAll();
    this.roleForm.reset();
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
  /**
  * Sort table data
  * @param param0 sort the column
  *
  */

}
