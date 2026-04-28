import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { GestionUserRoutingModule } from './gestion-user-routing.module';
import { HomeComponent } from './components/home/home.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CompleteProfileComponent } from './components/complete-profile/complete-profile.component';
import { DashboardDonneurComponent } from '../gestion-donneur-matching/components/dashboard-donneur/dashboard-donneur.component';
import { GestionDonneurMatchingModule } from '../gestion-donneur-matching/gestion-donneur-matching.module';
import { RecyclerRequestsStatsPanelComponent } from '../valorisation-organique-economie-circulaire/angular/components/recycler-requests-stats-panel/recycler-requests-stats-panel.component';
import { NotificationBellComponent } from '../audit-conformite-contrat-numerique/components/notification-bell/notification-bell.component';

@NgModule({
  declarations: [
    HomeComponent,
    DashboardComponent,
    CompleteProfileComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    GestionUserRoutingModule,
    GestionDonneurMatchingModule,
    RecyclerRequestsStatsPanelComponent,
    NotificationBellComponent
  ]
})
export class GestionUserModule { }
