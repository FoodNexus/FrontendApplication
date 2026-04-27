import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { AppNotification } from '../../models/notification.model';
import { AuthService } from '../../../gestion-user/services/auth.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss']
})
export class NotificationBellComponent implements OnInit {

  notifications: AppNotification[] = [];
  isOpen = false;

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  constructor(
    private service: NotificationService,
    private authService: AuthService,
    private eRef: ElementRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.idUser) {
      this.service.startPolling(user.idUser);
    }

    this.service.notifications$.subscribe(data => {
      this.notifications = data;
    });
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  markAsRead(id: number, event: Event): void {
    event.stopPropagation();
    this.service.markAsRead(id).subscribe();
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    const user = this.authService.getCurrentUser();
    if (user && user.idUser) {
      this.service.markAllAsRead(user.idUser).subscribe();
    }
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
