import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  public canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    if (!this.authService.isLoggedIn()) {
      // Redirect to home if not logged in
      return this.router.parseUrl('/user/home');
    }

    // Check if account is blocked in DB
    if (this.authService.isBlocked && state.url !== '/user/dashboard') {
      return this.router.parseUrl('/user/dashboard');
    }

    // Check if profile is complete (role assigned)
    if (!this.authService.isProfileComplete() && state.url !== '/user/complete-profile' && !this.authService.isBlocked) {
      return this.router.parseUrl('/user/complete-profile');
    }

    // Get the roles required from the route.
    const requiredRoles = route.data['roles'];

    // Allow the user to proceed if no additional roles are required.
    if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
      return true;
    }

    // Check if the user has any of the required roles.
    const userRoles = this.authService.getUserRoles();
    const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));

    if (hasRequiredRole) {
      return true;
    } else {
      // Access denied for this role, redirect to some generic dashboard or error.
      return this.router.parseUrl('/user/dashboard');
    }
  }
}
