import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Store, StoreBillingSummary, StoresResponse, StoreStatus } from '../models/store.model';

export interface CreateStorePayload {
  name: string;
  address_line1?: string;
  city?: string;
  contact_phone?: string;
  status?: StoreStatus;
}

export interface UpdateStorePayload {
  name?: string;
  address_line1?: string;
  city?: string;
  contact_phone?: string;
  status?: StoreStatus;
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly api = `${environment.apiUrl}/stores`;
  private readonly storesState = signal<Store[]>([]);
  private readonly billingState = signal<StoreBillingSummary>({
    activeStoreCount: 0,
    monthlyRate: 450,
    projectedMonthlyTotal: 0,
  });
  private readonly selectedStoreIdState = signal<string>('all');

  readonly stores = computed(() => this.storesState());
  readonly billing = computed(() => this.billingState());
  readonly selectedStoreId = computed(() => this.selectedStoreIdState());
  readonly isEnterprise = computed(() => this.auth.profile()?.subscription_tier === 'tier4');
  readonly canManageStores = computed(() => this.isEnterprise() && this.auth.profile()?.role === 'admin');
  readonly siteOptions = computed(() => {
    const stores = this.stores();
    if (this.isEnterprise()) {
      return [{ id: 'all', name: 'All sites' }, ...stores.map((store) => ({ id: store.id, name: store.name }))];
    }
    return stores.map((store) => ({ id: store.id, name: store.name }));
  });
  readonly selectedStoreName = computed(() => {
    const selectedStoreId = this.selectedStoreId();
    if (selectedStoreId === 'all') {
      return 'All sites';
    }
    return this.stores().find((store) => store.id === selectedStoreId)?.name ?? 'Current site';
  });

  constructor() {
    effect(() => {
      const profile = this.auth.profile();
      const stores = this.storesState();
      const selectedStoreId = this.selectedStoreIdState();

      if (!profile) {
        this.selectedStoreIdState.set('all');
        return;
      }

      if (profile.subscription_tier === 'tier4') {
        if (selectedStoreId === 'all') {
          return;
        }
        if (stores.some((store) => store.id === selectedStoreId)) {
          return;
        }
        this.selectedStoreIdState.set('all');
        return;
      }

      const fallbackStoreId = profile.store_id ?? stores[0]?.id ?? 'all';
      if (selectedStoreId !== fallbackStoreId) {
        this.selectedStoreIdState.set(fallbackStoreId);
      }
    });
  }

  async loadStores(): Promise<void> {
    const response = await firstValueFrom(this.http.get<StoresResponse>(this.api));
    this.storesState.set(response.stores);
    this.billingState.set(response.billing);
  }

  async createStore(payload: CreateStorePayload): Promise<Store> {
    const store = await firstValueFrom(this.http.post<Store>(this.api, payload));
    this.storesState.update((stores) => [...stores, store]);
    this.billingState.update((billing) => {
      const activeStoreCount = payload.status === 'inactive' ? billing.activeStoreCount : billing.activeStoreCount + 1;
      return {
        ...billing,
        activeStoreCount,
        projectedMonthlyTotal: activeStoreCount * billing.monthlyRate,
      };
    });
    return store;
  }

  async updateStore(storeId: string, payload: UpdateStorePayload): Promise<Store> {
    const updatedStore = await firstValueFrom(this.http.patch<Store>(`${this.api}/${storeId}`, payload));
    this.storesState.update((stores) => stores.map((store) => store.id === storeId ? updatedStore : store));
    const activeStoreCount = this.storesState().filter((store) => (store.id === storeId ? updatedStore : store).status === 'active').length;
    this.billingState.update((billing) => ({
      ...billing,
      activeStoreCount,
      projectedMonthlyTotal: activeStoreCount * billing.monthlyRate,
    }));
    return updatedStore;
  }

  setSelectedStore(storeId: string): void {
    this.selectedStoreIdState.set(storeId);
  }
}