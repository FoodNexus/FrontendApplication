import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { switchMap, tap, retry } from 'rxjs/operators';
import { AppNotification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly API_URL = 'http://localhost:8083/api/notifications';
  
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  constructor(private http: HttpClient) {}

  startPolling(userId: number): void {
    timer(0, 30000).pipe(
      switchMap(() => this.getAll(userId)),
      retry()
    ).subscribe(notifs => this.notificationsSubject.next(notifs));
  }

  getAll(userId: number): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.API_URL}?userId=${userId}`);
  }

  markAsRead(id: number): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/${id}/read`, {}).pipe(
      tap(() => {
        const current = this.notificationsSubject.value.filter(n => n.id !== id);
        this.notificationsSubject.next(current);
      })
    );
  }

  markAllAsRead(userId: number): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/read-all?userId=${userId}`, {}).pipe(
      tap(() => this.notificationsSubject.next([]))
    );
  }
}
