import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MenuItem } from '../models/menu-item.model';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/menu`;

  getMenuItems(orderId?: string): Observable<MenuItem[]> {
    const params: Record<string, string> = {};
    if (orderId) params['order_id'] = orderId;
    return this.http.get<MenuItem[]>(this.api, { params });
  }

  async createMenuItem(data: Partial<MenuItem>): Promise<void> {
    await firstValueFrom(this.http.post(this.api, data));
  }

  async updateMenuItem(id: string, data: Partial<MenuItem>): Promise<void> {
    await firstValueFrom(this.http.patch(`${this.api}/${id}`, data));
  }

  async deleteMenuItem(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.api}/${id}`));
  }
}
