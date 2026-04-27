import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { AppNotification } from '../../models/notification.model';
import { AuthService } from '../../../gestion-user/services/auth.service';

interface ActiveToast extends AppNotification {
  closing?: boolean;
}

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.scss']
})
export class NotificationToastComponent implements OnInit {

  visibleToasts: ActiveToast[] = [];
  private processedIds = new Set<number>();

  constructor(
    private service: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.service.notifications$.subscribe(allNotifs => {
      // Pour les toasts, on filtre les notifications NOUVELLES et NON LUES
      const newNotifs = allNotifs.filter(n => !this.processedIds.has(n.id) && !n.isRead);
      newNotifs.forEach(notif => this.addToast(notif));
    });
  }

  private addToast(notif: AppNotification): void {
    const toast: ActiveToast = { ...notif, closing: false };
    this.visibleToasts.push(toast);
    this.processedIds.add(notif.id);

    // Démarrer la fermeture après 6s
    setTimeout(() => this.closeToast(toast), 6000);
  }

  closeToast(toast: ActiveToast): void {
    toast.closing = true;
    setTimeout(() => {
      this.visibleToasts = this.visibleToasts.filter(t => t.id !== toast.id);
    }, 500); // 500ms = durée du fadeOut
  }

  closeManually(id: number): void {
    const toast = this.visibleToasts.find(t => t.id === id);
    if (toast) this.closeToast(toast);
  }

  clearAll(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.idUser) {
      this.service.markAllAsRead(user.idUser).subscribe();
    }
    this.visibleToasts = [];
  }
}
