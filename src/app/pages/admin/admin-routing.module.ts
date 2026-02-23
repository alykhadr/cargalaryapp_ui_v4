import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserComponent } from './users/user.component';
import { RolesComponent } from './roles/roles.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { BranchesComponent } from './branches/branches.component';
import { BrandsComponent } from './brands/brands.component';
import { ColorsComponent } from './colors/colors.component';
import { GalleryImagesComponent } from './gallery-images/gallery-images.component';
import { CompanyInfoComponent } from './company-info/company-info.component';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { PermissionGuard } from 'src/app/core/guards/permission.guard';



const routes: Routes = [
  {
    path: "users",
    component: UserComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'users.view' }
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
  }
  
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule {}
