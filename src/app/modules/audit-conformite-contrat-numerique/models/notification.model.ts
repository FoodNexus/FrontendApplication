export interface AppNotification {
  id: number;
  message: string;
  type: 'ALERTE' | 'RAPPEL';
  createdAt: string;
  isRead: boolean;
}
