import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { environment } from '../../../../../environments/environment';

type DeliveryRequest = {
  id: number;
  title: string;
  weightKg: number | null;
  pickupAddress: string | null;
  deliveryAddress: string | null;
  requestedPickupStart: string | null;
  requestedPickupEnd: string | null;
  requestedDeliveryStart: string | null;
  requestedDeliveryEnd: string | null;
  plannedPickupTime: string | null;
  plannedDeliveryTime: string | null;
  status: string;
  assignedTransporterId: number | null;
  assignedVehicleId: number | null;
};

@Component({
  selector: 'app-mes-livraisons',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './mes-livraisons.component.html',
  styleUrl: './mes-livraisons.component.css'
})
export class MesLivraisonsComponent implements OnInit {
  transporterId = environment.transporterId;

  deliveries: DeliveryRequest[] = [];
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchAssignedDeliveries();
  }

  fetchAssignedDeliveries(): void {
    this.loading = true;
    this.error = null;

    this.http
      .get<DeliveryRequest[]>(
        `${environment.apiBaseUrl}/api/delivery-requests/transporter/${this.transporterId}`
      )
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => (this.deliveries = data ?? []),
        error: (err) =>
          (this.error =
            err?.error?.message ?? 'Failed to load assigned deliveries')
      });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ASSIGNED_TO_TRANSPORTER':
        return 'Assignée';
      case 'PICKED_UP':
        return 'Enlevée';
      case 'IN_TRANSIT':
        return 'En transit';
      case 'ARRIVED_AT_RECEIVER':
        return 'Arrivée';
      case 'DELIVERED':
        return 'Livrée';
      case 'CANCELLED':
        return 'Annulée';
      default:
        return status;
    }
  }

  getStatusClass(status: string): string {
    if (status === 'ASSIGNED_TO_TRANSPORTER') return 'status-accepted';
    if (status === 'DELIVERED') return 'status-accepted';
    if (status === 'CANCELLED') return 'status-declined';
    return 'status-default';
  }

  scheduleSummary(req: DeliveryRequest): string {
    if (req.plannedPickupTime || req.plannedDeliveryTime) {
      return `${req.plannedPickupTime ?? '-'} → ${req.plannedDeliveryTime ?? '-'}`;
    }
    const pu =
      req.requestedPickupStart && req.requestedPickupEnd
        ? `${req.requestedPickupStart} – ${req.requestedPickupEnd}`
        : '-';
    return `Pickup window: ${pu}`;
  }
}

