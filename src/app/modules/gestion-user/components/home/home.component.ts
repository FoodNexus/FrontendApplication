import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.authService.fetchUserProfile().subscribe({
        next: () => this.router.navigate(['/user/dashboard']),
        error: (err: unknown) => {
          this.errorMessage =
            err instanceof HttpErrorResponse
              ? this.profileLoadErrorMessage(err)
              : `${err}`;
          console.error('fetchUserProfile (/api/users/me)', err);
        }
      });
    }
  }

  login() {
    this.authService.login();
  }

  register() {
    this.authService.register();
  }

  forceKeycloakLogout(): void {
    this.errorMessage = '';
    this.authService.forceKeycloakServerLogout();
  }

  private profileLoadErrorMessage(err: HttpErrorResponse): string {
    const base =
      "Connexion Keycloak OK, mais le profil applicatif n'a pas pu être chargé";
    if (err.status === 0) {
      return `${base} : impossible de joindre ms_gestionUser sur http://localhost:8087 (service arrêté, mauvais port ou CORS). Démarrez le backend et rechargez.`;
    }
    if (err.status === 401) {
      const detail =
        typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
      return `${base} : le jeton n'est pas accepté par l'API (vérifiez ms_gestionUser et Keycloak). Réponse : ${detail}`;
    }
    if (err.status === 500) {
      const detail =
        typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
      return `${base} (erreur HTTP 500). Détail : ${detail}`;
    }
    return `${base} (erreur HTTP ${err.status}).`;
  }
}
