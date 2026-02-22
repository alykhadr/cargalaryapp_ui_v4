import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserComponent } from './users/user.component';
import { RolesComponent } from './roles/roles.component';
import { PermissionsComponent } from './permissions/permissions.component';
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
  }
  
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule {}
