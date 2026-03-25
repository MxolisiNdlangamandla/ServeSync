import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Plus, Search } from 'lucide-angular';
import { Order } from '../../core/models/order.model';
import { OrderService } from '../../core/services/order.service';
import { NotificationService } from '../../core/services/notification.service';
import { IndustryService } from '../../core/services/industry.service';
import { StoreService } from '../../core/services/store.service';
import { OrderCardComponent } from '../../shared/components/order-card/order-card.component';
import { toast } from 'ngx-sonner';


@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, OrderCardComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-5">
      <header>
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 class="text-3xl font-black text-primary">Dashboard</h1>
            <div class="mt-2 flex flex-wrap gap-3">
              <div class="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">{{ activeCount() }} active</div>
              @if (alertCount() > 0) {
                <div class="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600">{{ alertCount() }} alert{{ alertCount() !== 1 ? 's' : '' }}</div>
              }
            </div>
            @if (showSiteFilter()) {
              <div class="mt-3 max-w-xs">
                <label class="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Site View</label>
                <select class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-primary focus:outline-none"
                  [value]="selectedStoreId()"
                  (change)="selectStore($event)">
                  @for (site of siteOptions(); track site.id) {
                    <option [value]="site.id">{{ site.name }}</option>
                  }
                </select>
              </div>
            }
            <a routerLink="/orders/new" class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">
              <lucide-angular [img]="plusIcon" class="h-4 w-4"></lucide-angular>
              New {{ labels().order }}
            </a>
          </div>

          <div class="lg:min-w-[260px] lg:max-w-[300px]">
            <div class="rounded-xl bg-slate-50/60 px-4 py-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-base font-medium text-primary">{{ liveDayLabel() }}</p>
                  <p class="mt-1 text-sm text-slate-500">{{ liveDateLabel() }}</p>
                </div>
                <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700"
                  [class]="isOnline() ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">
                  {{ isOnline() ? 'Online' : 'Offline' }}
                </span>
              </div>
              <p class="mt-2 text-xl font-medium tracking-tight text-primary">{{ liveTimeLabel() }}</p>
              <p class="mt-1 text-sm text-slate-500">Updating in real time.</p>
            </div>
          </div>
        </div>
      </header>

      <div class="space-y-3">
        <div class="relative">
          <lucide-angular [img]="searchIcon" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"></lucide-angular>
          <input class="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none" [placeholder]="'Search ' + labels().tables.toLowerCase() + '...'" [value]="search()" (input)="search.set(inputValue($event))" />
        </div>
        <div class="flex gap-6 border-b border-slate-200">
          @for (tab of tabs; track tab) {
            <button class="relative pb-2.5 text-sm font-semibold transition-colors"
                    [class]="tab === currentTab() ? 'text-primary' : 'text-slate-400 hover:text-slate-600'"
                    (click)="currentTab.set(tab)">
              <span>{{ tab }}</span>
              <span class="ml-2 text-xs font-semibold"
                    [class]="tab === currentTab() ? 'text-primary/70' : 'text-slate-400'">
                {{ tabCount(tab) }}
              </span>
              @if (tab === currentTab()) {
                <span class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary"></span>
              }
            </button>
          }
        </div>
      </div>

      <div class="space-y-4">
        @for (order of filteredOrders(); track order.id) {
          <app-order-card [order]="order" (completeOrder)="complete($event)" />
        }
        @if (filteredOrders().length === 0) {
          <div class="rounded-xl border border-dashed border-slate-300 p-16 text-center">
            <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-4xl">📋</div>
            <p class="text-lg font-semibold text-slate-500">No {{ labels().orders.toLowerCase() }} yet</p>
            <p class="mt-1 text-sm text-slate-400">Create your first {{ labels().order.toLowerCase() }} to get started</p>
            <a routerLink="/orders/new" class="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-sm font-bold text-white hover:bg-orange-600">
              <lucide-angular [img]="plusIcon" class="h-4 w-4"></lucide-angular>
              New {{ labels().order }}
            </a>
          </div>
        }
      </div>
    </section>
  `
})
export class DashboardComponent implements OnDestroy {
  private readonly orderService = inject(OrderService);
  private readonly notificationService = inject(NotificationService);
  private readonly industryService = inject(IndustryService);
  private readonly storeService = inject(StoreService);
  private readonly dayFormatter = new Intl.DateTimeFormat('en-ZA', { weekday: 'long' });
  private readonly dateFormatter = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  private readonly timeFormatter = new Intl.DateTimeFormat('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  readonly plusIcon = Plus;
  readonly searchIcon = Search;
  readonly labels = this.industryService.labels;
  readonly siteOptions = this.storeService.siteOptions;
  readonly selectedStoreId = this.storeService.selectedStoreId;
  readonly showSiteFilter = computed(() => this.storeService.isEnterprise());
  readonly tabs = ['Active', 'Completed', 'Cancelled', 'All'];
  readonly orders = signal<Order[]>([]);
  readonly search = signal('');
  readonly currentTab = signal('Active');
  readonly now = signal(new Date());
  readonly isOnline = signal(typeof navigator !== 'undefined' ? navigator.onLine : true);

  readonly liveDayLabel = computed(() => this.dayFormatter.format(this.now()));
  readonly liveDateLabel = computed(() => this.dateFormatter.format(this.now()));
  readonly liveTimeLabel = computed(() => this.timeFormatter.format(this.now()));
  readonly statsWindowOrders = computed(() => {
    const windowStart = this.now().getTime() - (24 * 60 * 60 * 1000);
    return this.orders().filter((order) => new Date(order.created_at).getTime() >= windowStart);
  });

  readonly filteredOrders = computed(() => {
    const q = this.search().trim().toLowerCase();
    const tab = this.currentTab().toLowerCase();
    const byTab = this.orders().filter((order) => {
      if (tab === 'all') return true;
      return order.status === tab;
    });
    const bySearch = byTab.filter((order) => {
      if (!q) return true;
      return order.table_number.toLowerCase().includes(q) || order.items.some((i) => i.name.toLowerCase().includes(q));
    });
    return bySearch.sort((a, b) => {
      const aAlert = a.call_staff || a.request_bill ? 1 : 0;
      const bAlert = b.call_staff || b.request_bill ? 1 : 0;
      if (aAlert !== bAlert) return bAlert - aAlert;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  });

  readonly activeCount = computed(() => this.orders().filter((o) => o.status === 'active').length);
  readonly alertCount = computed(() => this.orders().filter((o) => o.call_staff || o.request_bill).length);

  private readonly pollHandle = this.orderService.pollOrders(() => this.load());
  private readonly clockHandle = window.setInterval(() => this.now.set(new Date()), 1000);
  private readonly onlineHandler = () => this.isOnline.set(true);
  private readonly offlineHandler = () => this.isOnline.set(false);

  constructor() {
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
    this.storeService.loadStores().catch(() => undefined);
    effect(() => {
      this.storeService.selectedStoreId();
      this.load();
    });
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  selectStore(event: Event): void {
    this.storeService.setSelectedStore((event.target as HTMLSelectElement).value);
  }

  tabCount(tab: string): number {
    const statsOrders = this.statsWindowOrders();
    switch (tab) {
      case 'Active':
        return statsOrders.filter((order) => order.status === 'active').length;
      case 'Completed':
        return statsOrders.filter((order) => order.status === 'completed').length;
      case 'Cancelled':
        return statsOrders.filter((order) => order.status === 'cancelled').length;
      case 'All':
        return statsOrders.length;
      default:
        return 0;
    }
  }

  load(): void {
    this.orderService.getOrders(undefined, this.storeService.selectedStoreId()).subscribe((rows) => this.orders.set(rows));
  }

  complete(id: string): void {
    this.orderService.updateOrder(id, { status: 'completed', call_staff: false, request_bill: false }).then(async () => {
      const order = this.orders().find((o) => o.id === id);
      if (order) {
        await this.notificationService.createNotification({
          order_id: order.id,
          table_number: order.table_number,
          type: 'new_order',
          message: `Order for table ${order.table_number} marked complete`
        });
      }
      toast.success('Order completed');
      this.load();
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to complete order';
      toast.error(message);
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.pollHandle);
    clearInterval(this.clockHandle);
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
  }
}
