import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUserUrl}/api/users`;
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

  /**
   * Rôles effectifs : profil ms_gestionUser + rôles portés par le jeton Keycloak
   * (realm + resource_access), pour que le dashboard et les guards restent alignés
   * si l’admin est surtout défini côté realm.
   */
  public getUserRoles(): string[] {
    const set = new Set<string>();
    if (this.currentUser?.role) {
      const r = String(this.currentUser.role).toUpperCase().replace(/^ROLE_/, '');
      set.add(r);
    }
    for (const r of this.collectKeycloakTokenRoles()) {
      set.add(r);
    }
    this.applyAdminAliases(set);
    return [...set];
  }

  public hasRole(role: string): boolean {
    const needle = role.toUpperCase();
    return this.getUserRoles().includes(needle);
  }

  private collectKeycloakTokenRoles(): string[] {
    const token: any = this.keycloak.getKeycloakInstance()?.tokenParsed;
    if (!token) {
      return [];
    }
    const norm = (r: string) => String(r).toUpperCase().replace(/^ROLE_/, '');
    const out: string[] = [];
    const realm = token.realm_access?.roles;
    if (Array.isArray(realm)) {
      realm.forEach((r: string) => out.push(norm(r)));
    }
    const resource = token.resource_access;
    if (resource && typeof resource === 'object') {
      for (const key of Object.keys(resource)) {
        const roles = resource[key]?.roles;
        if (Array.isArray(roles)) {
          roles.forEach((r: string) => out.push(norm(r)));
        }
      }
    }
    return out;
  }

  /**
   * Harmonise les libellés Keycloak / base (ex. ADMINISTRATOR, SUPER_ADMIN) avec le rôle « ADMIN »
   * utilisé par les écrans et guards.
   */
  private applyAdminAliases(set: Set<string>): void {
    const adminSignals = [
      'ADMIN',
      'ADMINISTRATOR',
      'SUPER_ADMIN',
      'REALM-ADMIN',
      'SYSTEM_ADMIN'
    ];
    for (const r of [...set]) {
      if (adminSignals.includes(r) || r.endsWith('-ADMIN')) {
        set.add('ADMIN');
        break;
      }
    }
  }

  public getKeycloakPreferredUsername(): string | null {
    const token: any = this.keycloak.getKeycloakInstance()?.tokenParsed;
    const u = token?.preferred_username;
    return typeof u === 'string' && u.trim().length > 0 ? u.trim() : null;
  }

  public getUsername(): string {
    if (this.currentUser) {
      return `${this.currentUser.prenom} ${this.currentUser.nom}`;
    }
    const token: any = this.keycloak.getKeycloakInstance().tokenParsed;
    return token?.preferred_username || 'Guest';
  }

  /** Clé stable pour crédits recycleur / opérations (id base ou sub Keycloak). */
  public getCreditsUserKey(): string {
    if (this.currentUser?.idUser != null) {
      return `id:${this.currentUser.idUser}`;
    }
    const token: any = this.keycloak.getKeycloakInstance().tokenParsed;
    if (token?.sub) {
      return `sub:${token.sub}`;
    }
    return 'local:anonymous';
  }

  /**
   * Toutes les clés connues pour le même compte (sub OIDC + id base).
   * Utile pour le stockage local NutriFlow : évite que lots / demandes « disparaissent »
   * selon que le profil ms_gestionUser est chargé ou non.
   */
  public getNutriflowUserKeyAliases(): string[] {
    const out: string[] = [];
    const token: any = this.keycloak.getKeycloakInstance().tokenParsed;
    if (token?.sub) {
      out.push(`sub:${token.sub}`);
    }
    if (this.currentUser?.idUser != null) {
      out.push(`id:${this.currentUser.idUser}`);
    }
    return out.length ? out : ['local:anonymous'];
  }

  /**
   * Clé à enregistrer sur un nouveau lot donateur : priorité au sub (disponible dès la connexion),
   * pour rester aligné avec les demandes recycleur qui reprennent cette valeur.
   */
  public getNutriflowOwnerKeyForNewRecords(): string {
    const token: any = this.keycloak.getKeycloakInstance().tokenParsed;
    if (token?.sub) {
      return `sub:${token.sub}`;
    }
    if (this.currentUser?.idUser != null) {
      return `id:${this.currentUser.idUser}`;
    }
    return 'local:anonymous';
  }

}
