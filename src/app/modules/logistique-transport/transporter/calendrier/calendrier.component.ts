import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { NavbarComponent } from '../../shared/navbar/navbar.component';

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

type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
  deliveries: DeliveryRequest[];
  isToday: boolean;
};

@Component({
  selector: 'app-calendrier',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './calendrier.component.html',
  styleUrl: './calendrier.component.css'
})
export class CalendrierComponent implements OnInit {
  transporterId = environment.transporterId;
  deliveries: DeliveryRequest[] = [];
  loading = false;
  error: string | null = null;

  currentMonth: Date = new Date();
  daysInView: CalendarDay[] = [];
  weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  selectedDelivery: DeliveryRequest | null = null;
  isDetailsPopupOpen = false;

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
        next: (data) => {
          this.deliveries = data ?? [];
          this.generateCalendar();
        },
        error: (err) => {
          this.error = err?.error?.message ?? 'Failed to load assigned deliveries';
        }
      });
  }

  generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const startDayIndex = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    this.daysInView = [];
    
    // Previous month days to fill first week
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      this.daysInView.push(this.createCalendarDay(d, false));
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      this.daysInView.push(this.createCalendarDay(d, true));
    }
    
    // Next month days to complete the grid (up to 42 days, 6 weeks max)
    const remainingDays = 42 - this.daysInView.length;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      this.daysInView.push(this.createCalendarDay(d, false));
    }
  }

  createCalendarDay(date: Date, isCurrentMonth: boolean): CalendarDay {
    const today = new Date();
    const isToday = 
      date.getDate() === today.getDate() && 
      date.getMonth() === today.getMonth() && 
      date.getFullYear() === today.getFullYear();

    // Find deliveries happening on this day
    const dayDeliveries = this.deliveries.filter(req => {
      if (!req.plannedPickupTime) return false;
      const pickupDate = new Date(req.plannedPickupTime);
      return pickupDate.getDate() === date.getDate() && 
             pickupDate.getMonth() === date.getMonth() && 
             pickupDate.getFullYear() === date.getFullYear();
    });

    return {
      date,
      isCurrentMonth,
      isToday,
      deliveries: dayDeliveries
    };
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
  }

  prevMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }
  
  todayMonth() {
    this.currentMonth = new Date();
    this.generateCalendar();
  }

  openDetails(delivery: DeliveryRequest) {
    this.selectedDelivery = delivery;
    this.isDetailsPopupOpen = true;
  }

  closeDetails() {
    this.selectedDelivery = null;
    this.isDetailsPopupOpen = false;
  }

  getStatusClass(status: string): string {
    if (status === 'ASSIGNED_TO_TRANSPORTER') return 'bg-blue-100 text-blue-800 border-blue-300';
    if (status === 'PICKED_UP') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (status === 'IN_TRANSIT') return 'bg-purple-100 text-purple-800 border-purple-300';
    if (status === 'DELIVERED') return 'bg-green-100 text-green-800 border-green-300';
    if (status === 'CANCELLED') return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ASSIGNED_TO_TRANSPORTER': return 'Assignée';
      case 'PICKED_UP': return 'Enlevée';
      case 'IN_TRANSIT': return 'En transit';
      case 'ARRIVED_AT_RECEIVER': return 'Arrivée';
      case 'DELIVERED': return 'Livrée';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  }
  
  formatTime(dateString: string | null): string {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }
}
