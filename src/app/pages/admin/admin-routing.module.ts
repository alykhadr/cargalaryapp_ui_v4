import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserComponent } from './users/user.component';
import { RolesComponent } from './roles/roles.component';
import { PermissionsComponent } from './permissions/permissions.component';



const routes: Routes = [
  {
    path: "users",
    component: UserComponent
  },
  {
    path: "roles",
    component: RolesComponent
  },
  {
    path: "permissions",
    component: PermissionsComponent
  }
  
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule {}
