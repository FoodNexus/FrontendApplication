import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from "../../../../shared/navbar/navbar.component";
import Swal from 'sweetalert2';
import { environment } from '../../../../../../../environments/environment';

type DeliveryRequest = {
  id: number;
  title: string;
  status: string;
  assignedTransporterId: number | null;
  assignedVehicleId: number | null;
  plannedPickupTime: string | null;
  plannedDeliveryTime: string | null;
  requestedPickupStart: string | null;
  requestedPickupEnd: string | null;
};

type Vehicle = {
  id: number;
  companyDeliveryId: number;
  registrationPlate: string;
  label: string | null;
  maxWeightKg: number;
  vehicleType: string | null;
  notes: string | null;
  active: boolean;
};

type VehicleRequest = {
  registrationPlate: string;
  label: string | null;
  maxWeightKg: number;
  vehicleType: string | null;
  notes: string | null;
  active: boolean;
};

@Component({
  selector: 'app-gestion-vehicules',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FormsModule],
  templateUrl: './gestion-vehicules.component.html',
  styleUrl: './gestion-vehicules.component.css'
})
export class GestionVehiculesComponent implements OnInit {
  // For now we hardcode the company id as requested.
  companyDeliveryId = 1;

  vehicles: Vehicle[] = [];
  loading = false;
  error: string | null = null;

  isVehiclePopupOpen = false;
  vehiclePopupMode: 'create' | 'edit' = 'create';
  selectedVehicle: Vehicle | null = null;


  vehicleForm: VehicleRequest = {
    registrationPlate: '',
    label: null,
    maxWeightKg: 1,
    vehicleType: null,
    notes: null,
    active: true
  };

  savingVehicle = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchVehicles();
  }

  fetchVehicles(): void {
    this.loading = true;
    this.error = null;

    this.http
      .get<Vehicle[]>(
        `${environment.apiBaseUrl}/api/companies/${this.companyDeliveryId}/vehicles`
      )
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => (this.vehicles = data ?? []),
        error: (err) => (this.error = err?.error?.message ?? 'Failed to load vehicles')
      });
  }

  openCreatePopup(): void {
    this.vehiclePopupMode = 'create';
    this.selectedVehicle = null;
    this.vehicleForm = {
      registrationPlate: '',
      label: null,
      maxWeightKg: 1,
      vehicleType: null,
      notes: null,
      active: true
    };
    this.isVehiclePopupOpen = true;
  }

  openEditPopup(vehicle: Vehicle): void {
    this.vehiclePopupMode = 'edit';
    this.selectedVehicle = vehicle;
    this.vehicleForm = {
      registrationPlate: vehicle.registrationPlate ?? '',
      label: vehicle.label ?? null,
      maxWeightKg: vehicle.maxWeightKg ?? 1,
      vehicleType: vehicle.vehicleType ?? null,
      notes: vehicle.notes ?? null,
      active: vehicle.active
    };
    this.isVehiclePopupOpen = true;
  }

  closeVehiclePopup(): void {
    this.isVehiclePopupOpen = false;
    this.selectedVehicle = null;
    this.savingVehicle = false;
  }

  submitVehicleForm(): void {
    if (this.savingVehicle) return;
    this.savingVehicle = true;

    // Keep null/optional fields clean for the backend DTO.
    const payload: VehicleRequest = {
      ...this.vehicleForm,
      label: this.vehicleForm.label ? this.vehicleForm.label : null,
      vehicleType: this.vehicleForm.vehicleType ? this.vehicleForm.vehicleType : null,
      notes: this.vehicleForm.notes ? this.vehicleForm.notes : null
    };

    if (this.vehiclePopupMode === 'edit' && !this.selectedVehicle) {
      this.savingVehicle = false;
      this.error = 'Véhicule sélectionné introuvable.';
      Swal.fire('Erreur', this.error, 'error');
      return;
    }

    const request$ =
      this.vehiclePopupMode === 'create'
        ? this.http.post<Vehicle>(
            `${environment.apiBaseUrl}/api/companies/${this.companyDeliveryId}/vehicles`,
            payload
          )
          : this.http.put<Vehicle>(
            `${environment.apiBaseUrl}/api/companies/${this.companyDeliveryId}/vehicles/${this.selectedVehicle!.id}`,
            payload
          )
    request$
      .pipe(finalize(() => (this.savingVehicle = false)))
      .subscribe({
        next: () => {
          this.isVehiclePopupOpen = false;
          this.selectedVehicle = null;
          this.fetchVehicles();
          Swal.fire(
            this.vehiclePopupMode === 'create' ? 'Créé' : 'Mis à jour',
            'Le véhicule a été enregistré.',
            'success'
          );
        },
        error: (err) => {
          const message = err?.error?.message ?? 'Failed to save vehicle';
          this.error = message;
          Swal.fire('Erreur', message, 'error');
        }
      });
  }

  deleteVehicle(vehicle: Vehicle): void {
    Swal.fire({
      title: 'Supprimer le véhicule ?',
      text: `Supprimer "${vehicle.registrationPlate}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      reverseButtons: true
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.http
        .delete(
          `${environment.apiBaseUrl}/api/companies/${this.companyDeliveryId}/vehicles/${vehicle.id}`
        )
        .subscribe({
          next: () => {
            this.vehicles = this.vehicles.filter((v) => v.id !== vehicle.id);
            Swal.fire('Supprimé', 'Le véhicule a été supprimé.', 'success');
          },
          error: (err) => {
            const message = err?.error?.message ?? 'Failed to delete vehicle';
            this.error = message;
            Swal.fire('Erreur', message, 'error');
          }
        });
    });
  }

  viewSchedule(vehicle: Vehicle): void {
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
            .filter(r => r.assignedVehicleId === vehicle.id && r.status !== 'DELIVERED' && r.status !== 'CANCELLED' && r.status !== 'DECLINED_BY_COMPANY')
            .sort((a, b) => {
              const aTime = a.plannedPickupTime || a.requestedPickupStart || '';
              const bTime = b.plannedPickupTime || b.requestedPickupStart || '';
              return aTime.localeCompare(bTime);
            });

          if (assignedRequests.length === 0) {
            Swal.fire({
              title: `Planning du véhicule ${vehicle.registrationPlate}`,
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
                  <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px; color: #64748b;">
                    <span style="font-size: 14px;">👤</span> <b>Transporteur:</b> #${req.assignedTransporterId ?? 'N/A'}
                  </div>
                </div>
              </div>
            `;
          });
          
          timelineHtml += '</div>';

          Swal.fire({
            title: `🗓️ Planning de ${vehicle.registrationPlate}`,
            html: timelineHtml,
            width: '600px',
            showConfirmButton: true,
            confirmButtonText: 'Fermer',
            confirmButtonColor: '#3b82f6'
          });
        },
        error: (err) => {
          Swal.fire('Erreur', 'Impossible de charger le planning du véhicule.', 'error');
        }
      });
  }
}
