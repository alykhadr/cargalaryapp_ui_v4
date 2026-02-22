import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { MyAuthService } from '../services/my-auth.service';
import { TokenStorageService } from '../services/token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard  {
    constructor(
        private router: Router,
        private myAuthService: MyAuthService,
        private tokenStorageService:TokenStorageService
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    
        // if (environment.defaultauth === 'firebase') {
        //     const currentUser = this.authenticationService.currentUser();
        //     if (currentUser) {
        //         // logged in so return true
        //         return true;
        //     }
        // } else {
            const currentUser = this.myAuthService.currentUserValue;
            if (currentUser) {
                // logged in so return true
                return true;
            }
            // check if user data is in storage is logged in via API.
            if(this.tokenStorageService.getUser()) {
                return true;
            }
        //}
        // not logged in so redirect to login page with the return url
        this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
        return false;
    }
}
