import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-valorisation-dashboard-layout',
  standalone: true,
  imports: [NgFor, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './valorisation-dashboard-layout.component.html',
  styleUrls: ['./valorisation-dashboard-layout.component.scss']
})
export class ValorisationDashboardLayoutComponent {
  /** Must match app.routes lazy path for this feature area */
  protected readonly valorisationBase = '/valorisation';

  protected readonly navItems: { label: string; path: string; exact?: boolean }[] = [
    { label: "Vue d'ensemble", path: 'workspace', exact: true },
    { label: 'NutriFlow — recycleur (catalogue admin si ADMIN)', path: 'nutriflow' },
    { label: 'NutriFlow — donateur (lots)', path: 'nutriflow-donor' }
  ];
}
