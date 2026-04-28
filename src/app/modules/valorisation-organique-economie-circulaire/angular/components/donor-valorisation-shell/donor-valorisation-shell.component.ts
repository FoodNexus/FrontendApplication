import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../gestion-user/services/auth.service';

@Component({
  selector: 'app-donor-valorisation-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],
  templateUrl: './donor-valorisation-shell.component.html'
})
export class DonorValorisationShellComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const check = (): void => {
      const roles = this.authService.getUserRoles();
      const allowed = roles.includes('DONOR') || roles.includes('ADMIN');
      if (!allowed) {
        void this.router.navigate(['/user/dashboard']);
      }
    };

    if (this.authService.getCurrentUser()) {
      check();
      return;
    }

    this.authService.fetchUserProfile().subscribe({
      next: () => check(),
      error: () => void this.router.navigate(['/user/home'])
    });
  }

  get username(): string {
    return this.authService.getUsername();
  }

  /** Admin / recycleur peut aussi ouvrir la vue recycleur depuis ce shell. */
  get canOpenRecyclerArea(): boolean {
    const roles = this.authService.getUserRoles();
    return roles.some((r) => ['RECYCLER', 'ADMIN'].includes(r));
  }

  logout(): void {
    this.authService.logout();
  }
}
