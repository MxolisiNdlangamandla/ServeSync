import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Plus, Search } from 'lucide-angular';
import { Order } from '../../core/models/order.model';
import { OrderService } from '../../core/services/order.service';
import { NotificationService } from '../../core/services/notification.service';
import { IndustryService } from '../../core/services/industry.service';
import { AuthService } from '../../core/services/auth.service';
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

      <section class="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)]">
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Current Plan</p>
              <h2 class="mt-2 text-2xl font-black text-primary">{{ planAccess().name }}</h2>
            </div>
            <span class="rounded-full px-3 py-1 text-xs font-bold"
              [class]="planAccess().badgeClass">{{ planAccess().badge }}</span>
          </div>
          <p class="mt-3 text-sm leading-7 text-slate-600">{{ planAccess().summary }}</p>

          <div class="mt-5 grid gap-4 md:grid-cols-2">
            <div class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Available Now</p>
              <ul class="mt-3 space-y-2 text-sm text-slate-700">
                @for (item of planAccess().available; track item) {
                  <li class="flex gap-2">
                    <span class="text-emerald-600">&#10003;</span>
                    <span>{{ item }}</span>
                  </li>
                }
              </ul>
            </div>
            <div class="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Not In Your Plan</p>
              <ul class="mt-3 space-y-2 text-sm text-slate-700">
                @for (item of planAccess().locked; track item) {
                  <li class="flex gap-2">
                    <span class="text-amber-600">&#10005;</span>
                    <span>{{ item }}</span>
                  </li>
                }
              </ul>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Plan Flow</p>
              <h2 class="mt-2 text-2xl font-black text-primary">What changes as you move up</h2>
            </div>
            <p class="text-sm text-slate-500">Each plan makes the next upgrade step visible, including what stays locked until you move up.</p>
          </div>

          <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            @for (plan of dashboardPlans(); track plan.name) {
              <article class="rounded-xl border p-4"
                [class]="plan.state === 'current'
                  ? 'border-primary bg-primary/5'
                  : plan.state === 'available'
                      ? 'border-emerald-200 bg-emerald-50/60'
                      : 'border-slate-200 bg-white'">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="text-sm font-black text-primary">{{ plan.name }}</h3>
                    <p class="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{{ plan.price }}</p>
                  </div>
                  <span class="rounded-full px-2.5 py-1 text-[11px] font-bold"
                    [class]="plan.state === 'current'
                      ? 'bg-primary text-white'
                      : plan.state === 'available'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'">{{ plan.badge }}</span>
                </div>
                <p class="mt-3 text-sm leading-6 text-slate-600">{{ plan.summary }}</p>
                <ul class="mt-3 space-y-2 text-xs leading-6 text-slate-600">
                  @for (feature of plan.features; track feature) {
                    <li class="flex gap-2">
                      <span class="text-accent">•</span>
                      <span>{{ feature }}</span>
                    </li>
                  }
                </ul>
              </article>
            }
          </div>
        </div>
      </section>

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
  private readonly auth = inject(AuthService);

  readonly plusIcon = Plus;
  readonly searchIcon = Search;
  readonly labels = this.industryService.labels;
  readonly tabs = ['Active', 'Completed', 'All'];
  readonly orders = signal<Order[]>([]);
  readonly search = signal('');
  readonly currentTab = signal('Active');
  readonly currentTier = computed(() => this.auth.profile()?.subscription_tier ?? 'tier1');

  readonly planAccess = computed(() => {
    switch (this.currentTier()) {
      case 'tier2':
        return {
          name: 'Professional',
          badge: 'Live now',
          badgeClass: 'bg-emerald-100 text-emerald-700',
          summary: 'Professional gives you stronger day-to-day control for one store with menu management, payments, and deeper operational visibility.',
          available: [
            'Saved menu items and faster repeat order entry',
            'Online payments',
            'Advanced analytics and staff reporting',
            'Up to 12 staff accounts',
          ],
          locked: [
            'Multi-location management',
            'Central branch oversight',
            'Priority enterprise onboarding',
          ],
        };
      case 'tier4':
        return {
          name: 'Essentials',
          badge: 'Current plan',
          badgeClass: 'bg-sky-100 text-sky-700',
          summary: 'Essentials gives smaller menu-based businesses saved menu items and faster repeat ordering without jumping into the heavier Professional plan.',
          available: [
            'Saved menu items',
            'Faster repeat order entry',
            'Single-store menu workflow',
            'Everything in Starter',
          ],
          locked: [
            'Online payments',
            'Advanced analytics',
            'Multi-location management',
          ],
        };
      case 'tier3':
        return {
          name: 'Enterprise',
          badge: 'Highest live plan',
          badgeClass: 'bg-primary text-white',
          summary: 'Enterprise is built for operators scaling across locations and needing stronger branch-level visibility and support.',
          available: [
            'Everything in Professional',
            'Multiple shops and locations',
            'Centralized management across stores',
            'Priority support and onboarding',
          ],
          locked: ['Dedicated enterprise implementation extras can still be customized per client'],
        };
      default:
        return {
          name: 'Starter',
          badge: 'Current plan',
          badgeClass: 'bg-amber-100 text-amber-700',
          summary: 'Starter gives you the core live service flow for one location, with clear upgrade paths as the business needs more structure.',
          available: [
            'Live order dashboard',
            'Customer requests and bill calls',
            'Manual custom-item order entry',
            'Up to 3 staff accounts',
          ],
          locked: [
            'Saved menu items',
            'Online payments',
            'Advanced analytics',
            'Multi-location management',
          ],
        };
    }
  });

  readonly dashboardPlans = computed(() => {
    const tier = this.currentTier();
    const rank = this.planRank(tier);
    return [
      {
        id: 'tier1',
        name: 'Starter',
        price: 'Free',
        badge: tier === 'tier1' ? 'Current' : rank > this.planRank('tier1') ? 'Included below you' : 'Available now',
        state: tier === 'tier1' ? 'current' : rank > this.planRank('tier1') ? 'lower' : 'available',
        summary: 'For single-location teams that need the basic live service flow.',
        features: ['1 location', 'Manual custom items', 'Core order and request handling'],
      },
      {
        id: 'tier4',
        name: 'Essentials',
        price: 'R259 / month',
        badge: tier === 'tier4' ? 'Current' : rank > this.planRank('tier4') ? 'Included below you' : 'Available now',
        state: tier === 'tier4' ? 'current' : rank > this.planRank('tier4') ? 'lower' : 'available',
        summary: 'For smaller menu-based businesses that need saved items and faster repeat ordering.',
        features: ['Saved menu items', 'Repeat order speed', 'Single-store workflow'],
      },
      {
        id: 'tier2',
        name: 'Professional',
        price: 'R499 / month',
        badge: tier === 'tier2' ? 'Current' : rank > this.planRank('tier2') ? 'Included below you' : 'Available now',
        state: tier === 'tier2' ? 'current' : rank > this.planRank('tier2') ? 'lower' : 'available',
        summary: 'For growing single-store teams that need tighter floor control and reporting.',
        features: ['Saved menus', 'Payments', 'Advanced analytics'],
      },
      {
        id: 'tier3',
        name: 'Enterprise',
        price: 'From R450 / shop / month',
        badge: tier === 'tier3' ? 'Current' : 'Available now',
        state: tier === 'tier3' ? 'current' : 'available',
        summary: 'For operators running multiple branches and needing central oversight.',
        features: ['Multiple locations', 'Central branch oversight', 'Priority support'],
      },
    ] as const;
  });

  planRank(tier: 'tier1' | 'tier2' | 'tier3' | 'tier4'): number {
    switch (tier) {
      case 'tier4':
        return 1;
      case 'tier2':
        return 2;
      case 'tier3':
        return 3;
      default:
        return 0;
    }
  }

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
