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
      return this.router.parseUrl('/user/home');
    }

    const checkAccess = (): boolean | UrlTree => {
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

      // Check if the user has any of the required roles (from the DB via AuthService)
      const userRoles = this.authService.getUserRoles();
      const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role.toUpperCase()));

      if (hasRequiredRole) {
        return true;
      } else {
        return this.router.parseUrl('/user/dashboard');
      }
    };

    // If currentUser is loaded, proceed synchronously
    if (this.authService.getCurrentUser()) {
      return checkAccess();
    }

    // Otherwise, fetch it first (handles direct URL navigation)
    return new Observable<boolean | UrlTree>(observer => {
      this.authService.fetchUserProfile().subscribe({
        next: () => {
          observer.next(checkAccess());
          observer.complete();
        },
        error: () => {
          observer.next(this.router.parseUrl('/user/home'));
          observer.complete();
        }
      });
    });
  }
}
