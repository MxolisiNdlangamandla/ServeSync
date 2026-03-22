import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppNotification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/notifications`;

  getNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(this.api);
  }

  async createNotification(data: Partial<AppNotification>): Promise<void> {
    await firstValueFrom(this.http.post(this.api, data));
  }

  async markAllAsRead(): Promise<void> {
    await firstValueFrom(this.http.patch(`${this.api}/read-all`, {}));
  }
}
