import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, tap, catchError, throwError, switchMap } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';

const SESSION_LAST_USER_ID_KEY = 'fn-app-user-id';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8087/api/users';
  private currentUser: any = null;
  public isBlocked = false;

  constructor(private http: HttpClient, private keycloak: KeycloakService) { }

  /** URL de retour après login / logout OIDC (doit être autorisée côté client Keycloak). */
  private authRedirectUri(): string {
    return `${window.location.origin}/user/home`;
  }

  // Plus de register/login manuel via ce service, Keycloak s'en charge
  public login(): void {
    this.isBlocked = false;
    this.currentUser = null;
    void this.keycloak.login({ redirectUri: this.authRedirectUri() });
  }

  public logout(): void {
    this.isBlocked = false;
    this.currentUser = null;
    void this.keycloak.logout(this.authRedirectUri());
  }

  /**
   * Déconnexion SSO Keycloak (navigation plein écran).
   * Utile si le message « already authenticated as different user » reste bloquant après logout applicatif.
   */
  public forceKeycloakServerLogout(): void {
    this.isBlocked = false;
    this.currentUser = null;
    this.keycloak.clearToken();
    const kc = this.keycloak.getKeycloakInstance();
    const redirect = encodeURIComponent(this.authRedirectUri());
    const base = (kc.authServerUrl ?? 'http://localhost:8080').replace(/\/$/, '');
    window.location.href =
      `${base}/realms/${kc.realm}/protocol/openid-connect/logout?client_id=${encodeURIComponent(kc.clientId ?? 'foodnexus-app')}&post_logout_redirect_uri=${redirect}`;
  }

  public register(): void {
    void this.keycloak.register({ redirectUri: this.authRedirectUri() });
  }

  // Récupère le profil complet depuis ms_gestionUser (pour avoir l'idUser DB)
  public fetchUserProfile(): Observable<any> {
    const refresh = this.keycloak.updateToken(30).catch(() => false);
    return from(refresh).pipe(
      switchMap(() =>
        this.http.get<any>(`${this.apiUrl}/me`).pipe(
          tap((user) => {
            this.currentUser = user;
            const uid = this.extractRawUserId(user);
            if (uid != null) {
              try {
                sessionStorage.setItem(SESSION_LAST_USER_ID_KEY, String(uid));
              } catch {
                /* quota / mode privé */
              }
            }
            this.isBlocked = !!(user && user.actif === false);
          }),
          catchError((error: HttpErrorResponse) => {
            if (error.status === 403) {
              this.isBlocked = true;
            }
            return throwError(() => error);
          })
        )
      )
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
        const uid = this.extractRawUserId(updatedUser);
        if (uid != null) {
          try {
            sessionStorage.setItem(SESSION_LAST_USER_ID_KEY, String(uid));
          } catch {
            /* ignore */
          }
        }
      })
    );
  }

  public toggleUserStatus(id: number, active: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/toggle-status/${id}?active=${active}`, null, { responseType: 'text' });
  }

  public deleteAccount(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`, { responseType: 'text' });
  }

  public changePassword(newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/me/change-password`, { newPassword }, { responseType: 'text' });
  }


  public isLoggedIn(): boolean {
    return this.keycloak.isLoggedIn();
  }

  public getCurrentUser(): any {
    return this.currentUser;
  }

  /** Identifiant numérique utilisateur en base (réponse <code>/me</code> ou dernier connu en session). */
  public getApplicationUserId(): number | null {
    const fromProfile = this.extractRawUserId(this.currentUser);
    if (fromProfile != null) {
      const n = Number(fromProfile);
      if (Number.isFinite(n) && n > 0) {
        return n;
      }
    }
    try {
      const s = sessionStorage.getItem(SESSION_LAST_USER_ID_KEY);
      if (s) {
        const n = Number(s);
        if (Number.isFinite(n) && n > 0) {
          return n;
        }
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  private extractRawUserId(user: any): number | string | null | undefined {
    if (user == null) {
      return undefined;
    }
    return user.idUser ?? user.userId ?? user.id;
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
