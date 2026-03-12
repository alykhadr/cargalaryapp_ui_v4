import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RolesComponent } from './roles/roles.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { BranchesComponent } from './branches/branches.component';
import { BrandsComponent } from './brands/brands.component';
import { ColorsComponent } from './colors/colors.component';
import { GalleryImagesComponent } from './gallery-images/gallery-images.component';
import { CompanyInfoComponent } from './company-info/company-info.component';
import { ContactSalesComponent } from './contact-sales/contact-sales.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { FaqComponent } from './faq/faq.component';
import { MemberServicesComponent } from './member-services/member-services.component';
import { OffersComponent } from './offers/offers.component';
import { ServicesComponent } from './services/services.component';
import { ModelsComponent } from './models/models.component';
import { CarExtraDetailsComponent } from './car-extra-details/car-extra-details.component';
import { CarTypesComponent } from './car-types/car-types.component';
import { CarsCreatePageComponent } from './cars-create-page/cars-create-page.component';
import { CarsListPageComponent } from './cars-list-page/cars-list-page.component';
import { EmployeeListPageComponent } from './employee-list-page/employee-list-page.component';
import { QuotationListPageComponent } from './quotation-list-page/quotation-list-page.component';
import { QuotationCreatePageComponent } from './quotation-create-page/quotation-create-page.component';
import { QuotationTrackPageComponent } from './quotation-track-page/quotation-track-page.component';
import { UsersComponent } from './users/users.component';
import { DepartmentsComponent } from './departments/departments.component';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { PermissionGuard } from 'src/app/core/guards/permission.guard';



const routes: Routes = [
  {
    path: "employees",
    component: EmployeeListPageComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'employees.view' }
  },
  {
    path: "users",
    redirectTo: "employees",
    pathMatch: "full"
  },
  {
    path: "roles",
    component: RolesComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'roles.view' }
  },
  {
    path: "permissions",
    component: PermissionsComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'permissions.view' }
  },
  {
    path: "branches",
    component: BranchesComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'branches.view' }
  },
  {
    path: "departments",
    component: DepartmentsComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'departments.view' }
  },
  {
    path: "brands",
    component: BrandsComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'brands.view' }
  },
  {
    path: "colors",
    component: ColorsComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'colors.view' }
  },
  {
    path: "gallery-images",
    component: GalleryImagesComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'galleryimages.view' }
  },
  {
    path: "company-info",
    component: CompanyInfoComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'companyinfo.view' }
  },
  {
    path: "contact-sales",
    component: ContactSalesComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'contactsales.view' }
  },
  {
    path: "contact-us",
    component: ContactUsComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'contactus.view' }
  },
  {
    path: "faq",
    component: FaqComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'faq.view' }
  },
  {
    path: "member-services",
    component: MemberServicesComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'memberservices.view' }
  },
  {
    path: "offers",
    component: OffersComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'offers.view' }
  },
  {
    path: "services",
    component: ServicesComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'services.view' }
  },
  {
    path: "models",
    component: ModelsComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'models.view' }
  },
  {
    path: "car-extra-details",
    component: CarExtraDetailsComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'carextradetails.view' }
  },
  {
    path: "car-types",
    component: CarTypesComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'types.view' }
  },
  {
    path: "cars",
    redirectTo: "cars/list",
    pathMatch: "full"
  },
  {
    path: "cars/list",
    component: CarsListPageComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'cars.view' }
  },
  {
    path: "cars/create",
    component: CarsCreatePageComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'cars.create' }
  },
  {
    path: "quotation",
    redirectTo: "quotation/list",
    pathMatch: "full"
  },
  {
    path: "quotation/list",
    component: QuotationListPageComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'quotations.view' }
  },
  {
    path: "quotation/create",
    component: QuotationCreatePageComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'quotations.create' }
  },
  {
    path: "quotation/track",
    component: QuotationTrackPageComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'quotations.view' }
  },
  {
    path: "quotation/users",
    component: UsersComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'quotations.view' }
  }
  
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule {}
