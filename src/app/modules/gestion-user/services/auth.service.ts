import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8087/api/users';
  private currentUser: any = null;
  public isBlocked = false;

  constructor(private http: HttpClient, private keycloak: KeycloakService) { }

  // Plus de register/login manuel via ce service, Keycloak s'en charge
  public login(): void {
    this.keycloak.login();
  }

  public logout(): void {
    this.keycloak.logout();
  }

  public register(): void {
    this.keycloak.register();
  }

  // Récupère le profil complet depuis ms_gestionUser (pour avoir l'idUser DB)
  public fetchUserProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        this.currentUser = user;
        if (user && user.actif === false) {
          this.isBlocked = true;
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          this.isBlocked = true;
        }
        return throwError(() => error);
      })
    );
  }

  public getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }

  public updateProfile(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${id}`, data).pipe(
      tap((updatedUser: any) => {
        if (this.currentUser && this.currentUser.idUser === id) {
          this.currentUser = updatedUser;
        }
      })
    );
  }

  public toggleUserStatus(id: number, active: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/toggle-status/${id}?active=${active}`, null, { responseType: 'text' });
  }

  public requestAccountDeletion(): Observable<any> {
    return this.http.post(`${this.apiUrl}/me/request-deletion`, null, { responseType: 'text' });
  }

  public approveAccountDeletion(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/approve-deletion/${id}`, null, { responseType: 'text' });
  }

  public changePassword(newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/me/change-password`, { newPassword }, { responseType: 'text' });
  }


  public isLoggedIn(): boolean {
    return this.keycloak.isLoggedIn();
  }

  /**
   * Force le rafraîchissement du token Keycloak (utile après l'assignation d'un nouveau rôle).
   * minValidity=-1 force le refresh immédiat même si le token est encore valide.
   */
  public async refreshToken(): Promise<boolean> {
    return this.keycloak.updateToken(-1);
  }

  public getCurrentUser(): any {
    return this.currentUser;
  }

  public isProfileComplete(): boolean {
    return this.isLoggedIn() && this.currentUser && this.currentUser.role !== 'PENDING';
  }

  public getUserRoles(): string[] {
    // Récupère les rôles du profil (base de données)
    if (this.currentUser && this.currentUser.role) {
      return [this.currentUser.role.toUpperCase()];
    }
    return [];
  }

  public hasRole(role: string): boolean {
    if (this.currentUser && this.currentUser.role) {
      return this.currentUser.role.toUpperCase() === role.toUpperCase();
    }
    return false;
  }

  public getUsername(): string {
    if (this.currentUser) {
      return `${this.currentUser.prenom} ${this.currentUser.nom}`;
    }
    const token: any = this.keycloak.getKeycloakInstance().tokenParsed;
    return token?.preferred_username || 'Guest';
  }

}
