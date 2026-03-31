import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuditConformiteContratNumeriqueRoutingModule } 
  from './audit-conformite-contrat-numerique-routing.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AuditConformiteContratNumeriqueRoutingModule
  ]
})
export class AuditConformiteContratNumeriqueModule { }