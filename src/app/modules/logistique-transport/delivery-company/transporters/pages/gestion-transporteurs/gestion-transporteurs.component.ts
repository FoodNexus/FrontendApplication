import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from '../../../../../../../environments/environment';
import { NavbarComponent } from '../../../../shared/navbar/navbar.component';

type DeliveryRequest = {
  id: number;
  title: string;
  status: string;
  assignedTransporterId: number | null;
  plannedPickupTime: string | null;
  plannedDeliveryTime: string | null;
  requestedPickupStart: string | null;
  requestedPickupEnd: string | null;
};

type Transporter = {
  id: number;
  companyDeliveryId: number;
  fullName: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  active: boolean;
};

type TransporterRequest = {
  companyDeliveryId: number;
  fullName: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  active: boolean;
};

@Component({
  selector: 'app-gestion-transporteurs',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FormsModule],
  templateUrl:
    './gestion-transporteurs.component.html',
  styleUrl: './gestion-transporteurs.component.css'
})
export class GestionTransporteursComponent implements OnInit {
  // For now we hardcode the company id as requested.
  companyDeliveryId = 1;

  transporters: Transporter[] = [];
  loading = false;
  error: string | null = null;

  isTransporterPopupOpen = false;
  transporterPopupMode: 'create' | 'edit' = 'create';
  selectedTransporter: Transporter | null = null;

  transporterForm: TransporterRequest = {
    companyDeliveryId: 1,
    fullName: '',
    phone: null,
    email: null,
    notes: null,
    active: true
  };

  savingTransporter = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchTransporters();
  }

  fetchTransporters(): void {
    this.loading = true;
    this.error = null;

    this.http
      .get<Transporter[]>(
        `${environment.apiBaseUrl}/api/transporters?companyDeliveryId=${this.companyDeliveryId}`
      )
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => (this.transporters = data ?? []),
        error: (err) =>
          (this.error = err?.error?.message ?? 'Failed to load transporters')
      });
  }

  openCreatePopup(): void {
    this.transporterPopupMode = 'create';
    this.selectedTransporter = null;
    this.transporterForm = {
      companyDeliveryId: this.companyDeliveryId,
      fullName: '',
      phone: null,
      email: null,
      notes: null,
      active: true
    };
    this.isTransporterPopupOpen = true;
  }

  openEditPopup(transporter: Transporter): void {
    this.transporterPopupMode = 'edit';
    this.selectedTransporter = transporter;
    this.transporterForm = {
      companyDeliveryId: this.companyDeliveryId,
      fullName: transporter.fullName ?? '',
      phone: transporter.phone ?? null,
      email: transporter.email ?? null,
      notes: transporter.notes ?? null,
      active: transporter.active
    };
    this.isTransporterPopupOpen = true;
  }

  closeTransporterPopup(): void {
    this.isTransporterPopupOpen = false;
    this.selectedTransporter = null;
    this.savingTransporter = false;
  }

  submitTransporterForm(): void {
    // 1. Prevent double submissions
    if (this.savingTransporter) return;
    this.savingTransporter = true;

    // 2. Prepare the payload (including companyDeliveryId to match TransporterRequest type)
    const payload: TransporterRequest = {
      companyDeliveryId: this.companyDeliveryId,
      fullName: this.transporterForm.fullName,
      phone: this.transporterForm.phone || null,
      email: this.transporterForm.email || null,
      notes: this.transporterForm.notes || null,
      active: this.transporterForm.active
    };

    // 3. Safety check for edit mode
    if (this.transporterPopupMode === 'edit' && !this.selectedTransporter) {
      this.savingTransporter = false;
      const errorMsg = 'Transporteur sélectionné introuvable.';
      this.error = errorMsg;
      Swal.fire('Erreur', errorMsg, 'error');
      return;
    }

    // 4. Backend route is /api/transporters (company id in body/query)
    const baseUrl = `${environment.apiBaseUrl}/api/transporters`;

    // 5. Determine if we are POSTing (create) or PUTting (edit)
    const request$ =
      this.transporterPopupMode === 'create'
        ? this.http.post<Transporter>(baseUrl, payload)
        : this.http.put<Transporter>(
            `${baseUrl}/${this.selectedTransporter!.id}`,
            payload
          );

    // 6. Execute the request
    request$.subscribe({
      next: () => {
        this.isTransporterPopupOpen = false;
        this.selectedTransporter = null;
        this.savingTransporter = false;
        this.fetchTransporters(); // Refresh the list

        Swal.fire(
          this.transporterPopupMode === 'create' ? 'Créé' : 'Mis à jour',
          'Le transporteur a été enregistré.',
          'success'
        );
      },
      error: (err) => {
        // Log the error to console for debugging network issues (like CORS)
        console.error('Submission error:', err);

        const message = err?.error?.message ?? 'Failed to save transporter';
        this.error = message;
        this.savingTransporter = false;
        Swal.fire('Erreur', message, 'error');
      }
    });
  }

  deleteTransporter(transporter: Transporter): void {
    Swal.fire({
      title: 'Supprimer le transporteur ?',
      text: `Supprimer "${transporter.fullName}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      reverseButtons: true
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.http
        .delete(
          `${environment.apiBaseUrl}/api/transporters/${transporter.id}?companyDeliveryId=${this.companyDeliveryId}`
        )
        .subscribe({
          next: () => {
            this.transporters = this.transporters.filter(
              (t) => t.id !== transporter.id
            );
            Swal.fire(
              'Supprimé',
              'Le transporteur a été supprimé.',
              'success'
            );
          },
          error: (err) => {
            const message =
              err?.error?.message ?? 'Failed to delete transporter';
            this.error = message;
            Swal.fire('Erreur', message, 'error');
          }
        });
    });
  }

  viewSchedule(transporter: Transporter): void {
    if (this.loading) return;
    Swal.fire({
      title: 'Chargement...',
      didOpen: () => Swal.showLoading()
    });

    this.http.get<DeliveryRequest[]>(`${environment.apiBaseUrl}/api/delivery-requests/company/${this.companyDeliveryId}`)
      .subscribe({
        next: (requests) => {
          Swal.close();
          const assignedRequests = (requests || [])
            .filter(r => r.assignedTransporterId === transporter.id && r.status !== 'DELIVERED' && r.status !== 'CANCELLED' && r.status !== 'DECLINED_BY_COMPANY')
            .sort((a, b) => {
              const aTime = a.plannedPickupTime || a.requestedPickupStart || '';
              const bTime = b.plannedPickupTime || b.requestedPickupStart || '';
              return aTime.localeCompare(bTime);
            });

          if (assignedRequests.length === 0) {
            Swal.fire({
              title: `Planning de ${transporter.fullName}`,
              html: `<div style="padding: 20px; color: #64748b; font-style: italic;">Aucune livraison prévue pour le moment.</div>`,
              icon: 'info'
            });
            return;
          }

          let timelineHtml = '<div style="text-align: left; margin-top: 15px; display: flex; flex-direction: column; gap: 15px;">';
          
          assignedRequests.forEach((req, index) => {
            const pu = req.plannedPickupTime ? new Date(req.plannedPickupTime).toLocaleString('fr-FR', {day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit'}) : (req.requestedPickupStart ? 'Req: ' + new Date(req.requestedPickupStart).toLocaleString('fr-FR', {day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit'}) : 'Non défini');
            const pd = req.plannedDeliveryTime ? new Date(req.plannedDeliveryTime).toLocaleString('fr-FR', {day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit'}) : (req.requestedPickupEnd ? 'Req: ' + new Date(req.requestedPickupEnd).toLocaleString('fr-FR', {day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit'}) : 'Non défini');
            
            const isFirst = index === 0;
            const borderStyle = isFirst ? 'border-left: 4px solid #3b82f6;' : 'border-left: 4px solid #cbd5e1;';
            const bgStyle = isFirst ? 'background: #eff6ff;' : 'background: #f8fafc;';
            
            timelineHtml += `
              <div style="padding: 12px 16px; border-radius: 6px; ${borderStyle} ${bgStyle} box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-weight: 600; color: #1e293b;">#${req.id} - ${req.title}</span>
                  <span style="font-size: 11px; padding: 2px 8px; border-radius: 12px; background: #e2e8f0; color: #475569; font-weight: 500;">${req.status.replace(/_/g, ' ')}</span>
                </div>
                <div style="font-size: 13px; color: #475569; display: flex; flex-direction: column; gap: 4px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 14px;">📦</span> <b>Enlèvement:</b> ${pu}
                  </div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 14px;">🏁</span> <b>Livraison:</b> ${pd}
                  </div>
                </div>
              </div>
            `;
          });
          
          timelineHtml += '</div>';

          Swal.fire({
            title: `🗓️ Planning de ${transporter.fullName}`,
            html: timelineHtml,
            width: '600px',
            showConfirmButton: true,
            confirmButtonText: 'Fermer',
            confirmButtonColor: '#3b82f6'
          });
        },
        error: (err) => {
          Swal.fire('Erreur', 'Impossible de charger le planning du transporteur.', 'error');
        }
      });
  }
}

