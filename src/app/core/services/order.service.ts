import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateOrderPayload, Order, OrderItem } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/orders`;

  getOrders(status?: string, storeId?: string): Observable<Order[]> {
    const params: Record<string, string> = {};
    if (status && status !== 'all') params['status'] = status;
    if (storeId && storeId !== 'all') params['storeId'] = storeId;
    return this.http.get<Order[]>(this.api, { params });
  }

  getOrder(id: string, accessToken?: string): Observable<Order | null> {
    const params: Record<string, string> = {};
    if (accessToken) params['token'] = accessToken;
    return this.http.get<Order | null>(`${this.api}/${id}`, { params });
  }

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    return firstValueFrom(this.http.post<Order>(this.api, payload));
  }

  async updateOrder(id: string, patch: Partial<Order>, accessToken?: string): Promise<void> {
    const params: Record<string, string> = {};
    if (accessToken) params['token'] = accessToken;
    await firstValueFrom(this.http.patch(`${this.api}/${id}`, patch, { params }));
  }

  async appendItems(order: Order, addItems: OrderItem[], accessToken?: string): Promise<void> {
    const items = [...order.items];
    addItems.forEach((incoming) => {
      const found = items.find((item) => item.name.toLowerCase() === incoming.name.toLowerCase());
      if (found) {
        found.quantity += incoming.quantity;
      } else {
        items.push(incoming);
      }
    });
    await this.updateOrder(order.id, { items }, accessToken);
  }

  pollOrders(callback: () => void, intervalMs = 5000): ReturnType<typeof setInterval> {
    return setInterval(callback, intervalMs);
  }
}
