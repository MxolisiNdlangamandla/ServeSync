import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Plus, Search } from 'lucide-angular';
import { Order } from '../../core/models/order.model';
import { OrderService } from '../../core/services/order.service';
import { NotificationService } from '../../core/services/notification.service';
import { IndustryService } from '../../core/services/industry.service';
import { OrderCardComponent } from '../../shared/components/order-card/order-card.component';
import { toast } from 'ngx-sonner';


@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, OrderCardComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-5">
      <header>
        <h1 class="text-3xl font-black text-primary">Dashboard</h1>
        <div class="mt-2 flex flex-wrap gap-3">
          <div class="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">{{ activeCount() }} active</div>
          @if (alertCount() > 0) {
            <div class="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600">{{ alertCount() }} alert{{ alertCount() !== 1 ? 's' : '' }}</div>
          }
        </div>
        <a routerLink="/orders/new" class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">
          <lucide-angular [img]="plusIcon" class="h-4 w-4"></lucide-angular>
          New {{ labels().order }}
        </a>
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
              {{ tab }}
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

  readonly plusIcon = Plus;
  readonly searchIcon = Search;
  readonly labels = this.industryService.labels;
  readonly tabs = ['Active', 'Completed', 'All'];
  readonly orders = signal<Order[]>([]);
  readonly search = signal('');
  readonly currentTab = signal('Active');

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

  constructor() {
    this.load();
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  load(): void {
    this.orderService.getOrders().subscribe((rows) => this.orders.set(rows));
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
  }
}
