import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuditConformiteContratNumeriqueRoutingModule } 
  from './audit-conformite-contrat-numerique-routing.module';
import { NotificationBellComponent } from './components/notification-bell/notification-bell.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NotificationBellComponent,
    AuditConformiteContratNumeriqueRoutingModule
  ]
})
export class AuditConformiteContratNumeriqueModule { }