import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from '../../../../../../../environments/environment';
import { NavbarComponent } from '../../../../shared/navbar/navbar.component';
import * as L from 'leaflet';

type DeliveryRequest = {
  id: number;
  batchId: number;
  companyDeliveryId: number;
  donorId: number;
  receiverId: number;
  title: string;
  description: string | null;
  weightKg: number | null;
  pickupAddress: string | null;
  deliveryAddress: string | null;
  requestedPickupStart: string | null;
  requestedPickupEnd: string | null;
  requestedDeliveryStart: string | null;
  requestedDeliveryEnd: string | null;
  pickupLatitude?: number;
  pickupLongitude?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  urgency?: 'LOW' | 'NORMAL' | 'URGENT' | string;
  plannedPickupTime: string | null;
  plannedDeliveryTime: string | null;
  status: string;
  assignedTransporterId: number | null;
  assignedVehicleId: number | null;
  companyDecisionReason: string | null;
  companyDecisionAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type TransporterOption = {
  id: number;
  fullName: string;
  active: boolean;
  availabilityStatus?: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'IN_JOB' | 'NOT_AVAILABLE' | string;
};

type VehicleOption = {
  id: number;
  registrationPlate: string;
  maxWeightKg: number;
  active: boolean;
};

@Component({
  selector: 'app-gestion-demandes-livraison',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './gestion-demandes-livraison.component.html',
  styleUrl: './gestion-demandes-livraison.component.css'
})
export class GestionDemandesLivraisonComponent implements OnInit {
  companyDeliveryId = 1;

  requests: DeliveryRequest[] = [];
  transporters: TransporterOption[] = [];
  vehicles: VehicleOption[] = [];
  loading = false;
  error: string | null = null;
  selectedStatusFilter = 'ALL';

  isDetailsPopupOpen = false;
  selectedRequest: DeliveryRequest | null = null;
  actionLoading = false;

  private trackingInterval: any;
  private trackingMap: L.Map | null = null;
  private carMarker: L.Marker | null = null;

  private backgroundRefreshInterval: any;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchRequests();
    this.fetchTransporters();
    this.fetchVehicles();
    
    // Poll every 10 seconds to detect automated backend status changes
    this.backgroundRefreshInterval = setInterval(() => {
      this.fetchRequests(true);
    }, 10000);
  }
  
  ngOnDestroy(): void {
    if (this.backgroundRefreshInterval) {
      clearInterval(this.backgroundRefreshInterval);
    }
  }

  fetchRequests(isBackground = false): void {
    if (!isBackground) {
      this.loading = true;
      this.error = null;
    }

    this.http
      .get<DeliveryRequest[]>(
        `${environment.apiBaseUrl}/api/delivery-requests/company/${this.companyDeliveryId}`
      )
      .pipe(finalize(() => { if (!isBackground) this.loading = false; }))
      .subscribe({
        next: (data) => (this.requests = data ?? []),
        error: (err) => {
          if (!isBackground) {
            this.error = err?.error?.message ?? 'Failed to load delivery requests';
          }
        }
      });
  }

  fetchTransporters(): void {
    this.http
      .get<TransporterOption[]>(
        `${environment.apiBaseUrl}/api/transporters?companyDeliveryId=${this.companyDeliveryId}`
      )
      .subscribe({
        next: (data) => {
          this.transporters = (data ?? []).filter((t) => t.active);
        },
        error: () => {
          this.transporters = [];
        }
      });
  }

  fetchVehicles(): void {
    this.http
      .get<VehicleOption[]>(
        `${environment.apiBaseUrl}/api/companies/${this.companyDeliveryId}/vehicles`
      )
      .subscribe({
        next: (data) => {
          this.vehicles = (data ?? []).filter((v) => v.active);
        },
        error: () => {
          this.vehicles = [];
        }
      });
  }

  get filteredRequests(): DeliveryRequest[] {
    if (this.selectedStatusFilter === 'ALL') return this.requests;
    return this.requests.filter((r) => r.status === this.selectedStatusFilter);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING_COMPANY_DECISION':
        return 'Waiting';
      case 'ACCEPTED_BY_COMPANY':
      case 'ASSIGNED_TO_TRANSPORTER':
        return 'Accepted';
      case 'DECLINED_BY_COMPANY':
        return 'Declined';
      case 'IN_TRANSIT':
        return 'En Route';
      case 'DELIVERED':
        return 'Livré';
      default:
        return status;
    }
  }

  getStatusClass(status: string): string {
    if (status === 'PENDING_COMPANY_DECISION') return 'status-waiting';
    if (status === 'DECLINED_BY_COMPANY') return 'status-declined';
    if (status === 'ACCEPTED_BY_COMPANY' || status === 'ASSIGNED_TO_TRANSPORTER') {
      return 'status-accepted';
    }
    if (status === 'IN_TRANSIT') return 'status-accepted'; // could make a new css class for it
    if (status === 'DELIVERED') return 'status-default';
    return 'status-default';
  }

  canAssignTransporter(request: DeliveryRequest): boolean {
    return request.status === 'ACCEPTED_BY_COMPANY' || request.status === 'ASSIGNED_TO_TRANSPORTER';
  }

  isWaiting(request: DeliveryRequest): boolean {
    return request.status === 'PENDING_COMPANY_DECISION';
  }

  isDeclined(request: DeliveryRequest): boolean {
    return request.status === 'DECLINED_BY_COMPANY';
  }

  getAvailabilityLabel(status?: string): string {
    if (status === 'BUSY' || status === 'IN_JOB') return 'Busy';
    if (status === 'OFFLINE' || status === 'NOT_AVAILABLE') return 'Offline';
    return 'Available';
  }

  /** Summary for lists: company plan if set, otherwise donor windows. */
  scheduleSummary(req: DeliveryRequest): string {
    if (req.plannedPickupTime && req.plannedDeliveryTime) {
      return `${req.plannedPickupTime} → ${req.plannedDeliveryTime}`;
    }
    const pu = req.requestedPickupStart && req.requestedPickupEnd
      ? `${req.requestedPickupStart} – ${req.requestedPickupEnd}`
      : '-';
    return `Pickup window: ${pu}`;
  }

  private toDatetimeLocalValue(iso: string | null | undefined): string {
    if (!iso) return '';
    const s = iso.replace('Z', '');
    return s.length >= 16 ? s.slice(0, 16) : s;
  }

  private localDatetimeInputToApi(value: string): string {
    if (!value) return value;
    return value.length === 16 ? `${value}:00` : value;
  }

  openDetails(request: DeliveryRequest): void {
    this.selectedRequest = request;
    this.isDetailsPopupOpen = true;
  }

  closeDetails(): void {
    this.isDetailsPopupOpen = false;
    this.selectedRequest = null;
    this.actionLoading = false;
  }

  acceptRequest(request: DeliveryRequest): void {
    if (this.actionLoading) return;
    this.actionLoading = true;

    this.http
      .post<DeliveryRequest>(
        `${environment.apiBaseUrl}/api/delivery-requests/${request.id}/company/accept?companyDeliveryId=${this.companyDeliveryId}`,
        {}
      )
      .pipe(finalize(() => (this.actionLoading = false)))
      .subscribe({
        next: (updated) => {
          this.updateRequestInList(updated);
          this.selectedRequest = updated;
          Swal.fire('Acceptée', 'La demande a été acceptée.', 'success');
        },
        error: (err) => {
          const message = err?.error?.message ?? 'Failed to accept request';
          this.error = message;
          Swal.fire('Erreur', message, 'error');
        }
      });
  }

  async declineRequest(request: DeliveryRequest): Promise<void> {
    if (this.actionLoading) return;

    const result = await Swal.fire({
      title: 'Motif du refus',
      input: 'textarea',
      inputLabel: 'Pourquoi refusez-vous cette demande ?',
      inputPlaceholder: 'Ex: Pas de capacite aujourd hui',
      inputAttributes: {
        'aria-label': 'Motif du refus'
      },
      showCancelButton: true,
      confirmButtonText: 'Refuser',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc2626',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Le motif de refus est obligatoire.';
        }
        return null;
      }
    });

    if (!result.isConfirmed) return;
    const reason = (result.value ?? '').trim();

    this.actionLoading = true;
    this.http
      .post<DeliveryRequest>(
        `${environment.apiBaseUrl}/api/delivery-requests/${request.id}/company/decline?companyDeliveryId=${this.companyDeliveryId}`,
        { reason }
      )
      .pipe(finalize(() => (this.actionLoading = false)))
      .subscribe({
        next: (updated) => {
          this.updateRequestInList(updated);
          this.selectedRequest = updated;
          Swal.fire('Refusee', 'La demande a ete refusee.', 'success');
        },
        error: (err) => {
          const message = err?.error?.message ?? 'Failed to decline request';
          this.error = message;
          Swal.fire('Erreur', message, 'error');
        }
      });
  }

  async autoAssignTransporter(request: DeliveryRequest): Promise<void> {
    if (!this.canAssignTransporter(request)) {
      Swal.fire('Info', 'Affectation possible uniquement apres acceptation.', 'info');
      return;
    }

    const defaultPu =
      this.toDatetimeLocalValue(request.plannedPickupTime) ||
      this.toDatetimeLocalValue(request.requestedPickupStart);
    const defaultPd =
      this.toDatetimeLocalValue(request.plannedDeliveryTime) ||
      this.toDatetimeLocalValue(request.requestedDeliveryEnd);

    const result = await Swal.fire({
      title: 'Affectation automatique',
      html: `
        <p style="margin:0 0 8px 0;font-size:13px;text-align:left;">Le systeme choisit transporteur + vehicule disponibles (distance + charge).</p>
        <p style="margin:0 0 8px 0;font-size:12px;text-align:left;"><b>Fenetre enlèvement:</b> ${request.requestedPickupStart ?? '-'} → ${request.requestedPickupEnd ?? '-'}</p>
        <label for="swal-auto-pu" style="display:block;margin-top:8px;text-align:left;">Enlèvement planifié</label>
        <input id="swal-auto-pu" type="datetime-local" class="swal2-input" value="${defaultPu}" />
        <label for="swal-auto-pd" style="display:block;margin-top:8px;text-align:left;">Livraison planifiée</label>
        <input id="swal-auto-pd" type="datetime-local" class="swal2-input" value="${defaultPd}" />
      `,
      showCancelButton: true,
      confirmButtonText: 'Lancer affectation auto',
      cancelButtonText: 'Annuler',
      focusConfirm: false,
      preConfirm: () => {
        const puEl = document.getElementById('swal-auto-pu') as HTMLInputElement | null;
        const pdEl = document.getElementById('swal-auto-pd') as HTMLInputElement | null;
        const pu = puEl?.value?.trim() ?? '';
        const pd = pdEl?.value?.trim() ?? '';
        
        if (!pu || !pd) {
          Swal.showValidationMessage('Indiquez les horaires planifiés.');
          return false;
        }
        
        return {
          plannedPickupTime: this.localDatetimeInputToApi(pu),
          plannedDeliveryTime: this.localDatetimeInputToApi(pd)
        };
      }
    });

    if (!result.isConfirmed || !result.value) return;
    const body = result.value as {
      plannedPickupTime: string;
      plannedDeliveryTime: string;
    };

    this.actionLoading = true;
    this.http
      .post<DeliveryRequest>(
        `${environment.apiBaseUrl}/api/delivery-requests/${request.id}/company/auto-assign?companyDeliveryId=${this.companyDeliveryId}`,
        body
      )
      .pipe(finalize(() => (this.actionLoading = false)))
      .subscribe({
        next: (updated) => {
          this.updateRequestInList(updated);
          this.selectedRequest = updated;
          this.fetchTransporters();
          Swal.fire(
            'Succes',
            `Affecte: transporteur #${updated.assignedTransporterId ?? '-'}, vehicule #${updated.assignedVehicleId ?? '-'}.`,
            'success'
          );
        },
        error: (err) => {
          const message = err?.error?.message ?? 'Echec affectation automatique';
          this.error = message;
          Swal.fire('Erreur', message, 'error');
        }
      });
  }

  async assignTransporter(request: DeliveryRequest): Promise<void> {
    if (!this.canAssignTransporter(request)) {
      Swal.fire('Info', "Assignez un transporteur uniquement apres acceptation.", 'info');
      return;
    }

    const availableTransporters = this.transporters.filter(
      (t) => t.active && (t.availabilityStatus === 'AVAILABLE' || t.availabilityStatus == null)
    );
    const availableVehicles = this.vehicles.filter((v) => v.active);

    if (availableTransporters.length === 0) {
      Swal.fire('Info', 'Aucun transporteur AVAILABLE pour affectation manuelle.', 'info');
      return;
    }

    if (availableVehicles.length === 0) {
      Swal.fire('Info', 'Aucun véhicule actif pour affectation manuelle.', 'info');
      return;
    }

    const transporterHtmlOptions = availableTransporters
      .map((t) => `<option value="${t.id}" ${t.id === request.assignedTransporterId ? 'selected' : ''}>${t.fullName} (${this.getAvailabilityLabel(t.availabilityStatus)})</option>`)
      .join('');
      
    const vehicleHtmlOptions = availableVehicles
      .map((v) => `<option value="${v.id}" ${v.id === request.assignedVehicleId ? 'selected' : ''}>${v.registrationPlate} (Max: ${v.maxWeightKg}kg)</option>`)
      .join('');

    const result = await Swal.fire({
      title: 'Sélectionner Transporteur et Véhicule',
      html: `
        <label for="swal-transporter" style="display:block;margin-top:10px;text-align:left;">Transporteur</label>
        <select id="swal-transporter" class="swal2-select" style="display: flex;">
          <option value="" disabled ${!request.assignedTransporterId ? 'selected' : ''}>Selectionner un transporteur</option>
          ${transporterHtmlOptions}
        </select>
        
        <label for="swal-vehicle" style="display:block;margin-top:10px;text-align:left;">Véhicule</label>
        <select id="swal-vehicle" class="swal2-select" style="display: flex;">
          <option value="" disabled ${!request.assignedVehicleId ? 'selected' : ''}>Selectionner un véhicule</option>
          ${vehicleHtmlOptions}
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Suivant',
      cancelButtonText: 'Annuler',
      focusConfirm: false,
      preConfirm: () => {
        const tEl = document.getElementById('swal-transporter') as HTMLSelectElement | null;
        const vEl = document.getElementById('swal-vehicle') as HTMLSelectElement | null;
        if (!tEl?.value || !vEl?.value) {
          Swal.showValidationMessage('Veuillez sélectionner un transporteur ET un véhicule.');
          return false;
        }
        return {
          transporterId: Number(tEl.value),
          vehicleId: Number(vEl.value)
        };
      }
    });

    if (!result.isConfirmed || !result.value) return;
    const transporterId = result.value.transporterId;
    const vehicleId = result.value.vehicleId;
    
    const selectedTransporter = availableTransporters.find((t) => t.id === transporterId);
    const selectedVehicle = availableVehicles.find((v) => v.id === vehicleId);
    const scheduleItems = this.requests.filter(
      (r) =>
        r.assignedTransporterId === transporterId &&
        r.id !== request.id &&
        r.status !== 'DECLINED_BY_COMPANY' &&
        r.status !== 'DELIVERED' &&
        r.status !== 'CANCELLED'
    );

    const scheduleHtml =
      scheduleItems.length === 0
        ? '<p style="margin:0;">Aucune livraison assignee actuellement.</p>'
        : `<ul style="text-align:left;padding-left:18px;margin:0;">${scheduleItems
            .map(
              (item) =>
                `<li>#${item.id} - ${item.title} (${this.scheduleSummary(item)})</li>`
            )
            .join('')}</ul>`;

    const defaultPu =
      this.toDatetimeLocalValue(request.plannedPickupTime) ||
      this.toDatetimeLocalValue(request.requestedPickupStart);
    const defaultPd =
      this.toDatetimeLocalValue(request.plannedDeliveryTime) ||
      this.toDatetimeLocalValue(request.requestedDeliveryEnd);

    const preview = await Swal.fire({
      title: `Planning - ${selectedTransporter?.fullName ?? 'Transporteur'}`,
      html: `
        <p style="margin:0 0 4px 0;"><b>Disponibilité:</b> ${this.getAvailabilityLabel(selectedTransporter?.availabilityStatus)}</p>
        <p style="margin:0 0 12px 0;"><b>Véhicule:</b> ${selectedVehicle?.registrationPlate}</p>
        ${scheduleHtml}
        <p style="margin:12px 0 4px 0;font-size:13px;"><b>Fenetre enlèvement (donateur)</b><br/>
        ${request.requestedPickupStart ?? '-'} → ${request.requestedPickupEnd ?? '-'}</p>
        <p style="margin:0 0 8px 0;font-size:13px;"><b>Fenetre livraison (donateur)</b><br/>
        ${request.requestedDeliveryStart ?? '(debut libre)'} → ${request.requestedDeliveryEnd ?? '-'}</p>
        <label for="swal-planned-pu" style="display:block;margin-top:10px;text-align:left;">Enlèvement planifié</label>
        <input id="swal-planned-pu" type="datetime-local" class="swal2-input" value="${defaultPu}" />
        <label for="swal-planned-pd" style="display:block;margin-top:8px;text-align:left;">Livraison planifiée</label>
        <input id="swal-planned-pd" type="datetime-local" class="swal2-input" value="${defaultPd}" />
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirmer affectation',
      cancelButtonText: 'Annuler',
      focusConfirm: false,
      preConfirm: () => {
        const puEl = document.getElementById('swal-planned-pu') as HTMLInputElement | null;
        const pdEl = document.getElementById('swal-planned-pd') as HTMLInputElement | null;
        const pu = puEl?.value?.trim() ?? '';
        const pd = pdEl?.value?.trim() ?? '';
        if (!pu || !pd) {
          Swal.showValidationMessage('Indiquez les deux horaires planifiés.');
          return false;
        }
        return {
          plannedPickupTime: this.localDatetimeInputToApi(pu),
          plannedDeliveryTime: this.localDatetimeInputToApi(pd)
        };
      }
    });

    if (!preview.isConfirmed || !preview.value) return;
    const plan = preview.value as { plannedPickupTime: string; plannedDeliveryTime: string };

    this.actionLoading = true;
    this.http
      .post<DeliveryRequest>(
        `${environment.apiBaseUrl}/api/delivery-requests/${request.id}/company/assign-transporter?companyDeliveryId=${this.companyDeliveryId}`,
        {
          transporterId,
          vehicleId,
          plannedPickupTime: plan.plannedPickupTime,
          plannedDeliveryTime: plan.plannedDeliveryTime
        }
      )
      .pipe(finalize(() => (this.actionLoading = false)))
      .subscribe({
        next: (updated) => {
          this.updateRequestInList(updated);
          this.selectedRequest = updated;
          this.fetchTransporters();
          Swal.fire('Succes', 'Transporteur affecte.', 'success');
        },
        error: (err) => {
          const message = err?.error?.message ?? 'Failed to assign transporter';
          this.error = message;
          Swal.fire('Erreur', message, 'error');
        }
      });
  }

  private updateRequestInList(updated: DeliveryRequest): void {
    this.requests = this.requests.map((r) => (r.id === updated.id ? updated : r));
  }

  trackDelivery(request: DeliveryRequest): void {
    if (!request.assignedVehicleId) {
      Swal.fire('Erreur', 'Aucun véhicule assigné à cette livraison.', 'error');
      return;
    }

    Swal.fire({
      title: 'Suivi en temps reel',
      html: '<div id="tracking-map" style="height: 400px; width: 100%; border-radius: 8px;"></div>',
      width: '800px',
      showConfirmButton: true,
      confirmButtonText: 'Fermer',
      didOpen: () => {
        // Initialize Map
        this.trackingMap = L.map('tracking-map').setView([request.pickupLatitude || 36.8065, request.pickupLongitude || 10.1815], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(this.trackingMap);

        // Add markers for pickup/delivery if they exist
        if (request.pickupLatitude && request.pickupLongitude) {
          L.marker([request.pickupLatitude, request.pickupLongitude]).addTo(this.trackingMap).bindPopup('Point de collecte');
        }
        if (request.deliveryLatitude && request.deliveryLongitude) {
          L.marker([request.deliveryLatitude, request.deliveryLongitude]).addTo(this.trackingMap).bindPopup('Destination');
        }

        // Add Car Marker
        const carIcon = L.divIcon({
          html: '<div style="font-size: 24px; text-shadow: 0px 0px 5px white;">🚚</div>',
          className: 'car-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        // Polling logic
        const fetchLocation = () => {
          this.http.get<{latitude: number, longitude: number}>(`${environment.apiBaseUrl}/api/simulation/vehicles/${request.assignedVehicleId}/location`)
            .subscribe({
              next: (loc) => {
                if (this.carMarker && this.trackingMap) {
                  this.carMarker.setLatLng([loc.latitude, loc.longitude]);
                  this.trackingMap.panTo([loc.latitude, loc.longitude]);
                } else if (this.trackingMap) {
                  this.carMarker = L.marker([loc.latitude, loc.longitude], {icon: carIcon}).addTo(this.trackingMap);
                  this.trackingMap.panTo([loc.latitude, loc.longitude]);
                }
                
                // If the delivery is done, stop polling
                if (loc.latitude === request.deliveryLatitude && loc.longitude === request.deliveryLongitude) {
                  clearInterval(this.trackingInterval);
                  Swal.getTitle()!.innerText = 'Livraison Terminée !';
                }
              },
              error: () => {
                console.log("Could not fetch vehicle location");
              }
            });
        };

        fetchLocation(); // fetch immediately
        this.trackingInterval = setInterval(fetchLocation, 3000); // every 3s
        
        // Fix map rendering issue in modal
        setTimeout(() => {
          if (this.trackingMap) this.trackingMap.invalidateSize();
        }, 100);
      },
      willClose: () => {
        if (this.trackingInterval) {
          clearInterval(this.trackingInterval);
        }
        if (this.trackingMap) {
          this.trackingMap.remove();
          this.trackingMap = null;
        }
        this.carMarker = null;
        this.fetchRequests(); // Refresh to catch status updates like DELIVERED
      }
    });
  }
}

