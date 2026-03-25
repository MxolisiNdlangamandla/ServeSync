import { ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Eye, Users, Receipt, Bell, Clock, CheckCircle } from 'lucide-angular';
import { OrderService } from '../../core/services/order.service';
import { IndustryService } from '../../core/services/industry.service';
import { StoreService } from '../../core/services/store.service';
import { Order } from '../../core/models/order.model';
import { formatCurrency, minutesSince, severityClass } from '../../core/utils/formatters';
import { TimeElapsedComponent } from '../../shared/components/time-elapsed/time-elapsed.component';

type OverviewRange = 'this-week' | 'last-2-weeks' | 'this-month' | 'last-month' | 'custom-day';

@Component({
  selector: 'app-manager-overview',
  imports: [RouterLink, LucideAngularModule, TimeElapsedComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-5">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 class="text-3xl font-black text-primary">Overview</h1>
          <p class="mt-2 text-sm text-slate-500">{{ rangeSummary() }}</p>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          @if (showSiteFilter()) {
            <select class="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-primary focus:outline-none"
              [value]="selectedStoreId()"
              (change)="selectStore($event)">
              @for (site of siteOptions(); track site.id) {
                <option [value]="site.id">{{ site.name }}</option>
              }
            </select>
          }

          <select class="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-primary focus:outline-none"
            [value]="selectedRange()"
            (change)="selectedRange.set(rangeValue($event))">
            <option value="this-week">This week</option>
            <option value="last-2-weeks">Past 2 weeks</option>
            <option value="this-month">This month</option>
            <option value="last-month">Last month</option>
            <option value="custom-day">Custom day</option>
          </select>

          @if (selectedRange() === 'custom-day') {
            <input type="date"
              class="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-primary focus:outline-none"
              [value]="customDate()"
              (input)="customDate.set(dateValue($event))" />
          }
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Active {{ labels().tables }}</p>
          <p class="text-3xl font-black text-primary">{{ activeTables() }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Paying Now</p>
          <p class="text-3xl font-black text-accent">{{ payingNow() }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Needs {{ labels().staff }}</p>
          <p class="text-3xl font-black text-amber-500">{{ needsStaff() }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Long Wait</p>
          <p class="text-3xl font-black text-red-500">{{ longWait() }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Active Revenue</p>
          <p class="text-3xl font-black text-primary">{{ money(activeRevenue()) }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Completed Revenue</p>
          <p class="text-3xl font-black text-emerald-600">{{ money(completedRevenueInRange()) }}</p>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Completed Orders</p>
        <p class="text-3xl font-black text-emerald-600">{{ completedInRange() }}</p>
      </div>

      <!-- Capacity Bar -->
      <section>
        <h2 class="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Capacity</h2>
        <div class="h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div class="flex h-full">
            @if (greenPct()) {
              <div class="bg-emerald-400" [style.width.%]="greenPct()"></div>
            }
            @if (amberPct()) {
              <div class="bg-amber-400" [style.width.%]="amberPct()"></div>
            }
            @if (redPct()) {
              <div class="bg-red-400" [style.width.%]="redPct()"></div>
            }
          </div>
        </div>
        <div class="mt-1 flex gap-4 text-xs text-slate-400">
          <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-emerald-400"></span> OK</span>
          <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-amber-400"></span> In Progress</span>
          <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-red-400"></span> Urgent</span>
        </div>
      </section>

      <!-- Active Tables -->
      <section>
        <h2 class="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Active {{ labels().tables }}</h2>
        <div class="space-y-3">
          @for (order of filteredActiveOrders(); track order.id) {
            <a [routerLink]="['/orders', order.id]" class="flex items-center gap-3 rounded-xl border bg-white p-4" [class]="tableCard(order)">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-primary">{{ labels().table }} {{ order.table_number }}</h3>
                  @if (order.call_staff) {
                    <span class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      <lucide-angular [img]="bellIcon" class="h-3 w-3"></lucide-angular> {{ labels().staff }}
                    </span>
                  }
                  @if (order.request_bill) {
                    <span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      <lucide-angular [img]="receiptIcon" class="h-3 w-3"></lucide-angular> Bill
                    </span>
                  }
                </div>
                <p class="text-xs text-slate-400">{{ order.items.length }} items &middot; {{ money(orderTotal(order)) }}</p>
              </div>
              <app-time-elapsed [createdAt]="order.created_at"></app-time-elapsed>
              <lucide-angular [img]="eyeIcon" class="h-5 w-5 text-slate-400"></lucide-angular>
            </a>
          }
        </div>
      </section>

      @if (!filteredActiveOrders().length) {
        <div class="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-4xl">🍽️</div>
          <p class="text-lg font-semibold text-slate-500">No active {{ labels().orders.toLowerCase() }} in this range</p>
          <p class="mt-1 text-sm text-slate-400">Change the filter to inspect a different period</p>
        </div>
      }
    </section>
  `
})
export class ManagerOverviewComponent implements OnDestroy {
  private readonly orderService = inject(OrderService);
  private readonly industryService = inject(IndustryService);
  private readonly storeService = inject(StoreService);
  readonly labels = this.industryService.labels;
  private pollHandle?: ReturnType<typeof setInterval>;

  readonly eyeIcon = Eye;
  readonly usersIcon = Users;
  readonly receiptIcon = Receipt;
  readonly bellIcon = Bell;
  readonly clockIcon = Clock;
  readonly checkIcon = CheckCircle;
  readonly siteOptions = this.storeService.siteOptions;
  readonly selectedStoreId = this.storeService.selectedStoreId;
  readonly showSiteFilter = computed(() => this.storeService.isEnterprise());
  readonly selectedRange = signal<OverviewRange>('this-week');
  readonly customDate = signal(this.isoDate(new Date()));

  readonly orders = signal<Order[]>([]);
  readonly now = signal(Date.now());
  private readonly clockHandle = window.setInterval(() => this.now.set(Date.now()), 1000);

  readonly rangeWindow = computed(() => this.resolveRange(this.selectedRange(), this.customDate(), new Date(this.now())));
  readonly rangeSummary = computed(() => {
    const { start, end } = this.rangeWindow();
    return `Showing ${this.storeService.selectedStoreName()} from ${this.formatRangeDate(start)} to ${this.formatRangeDate(end)}`;
  });
  readonly ordersCreatedInRange = computed(() => {
    const { start, end } = this.rangeWindow();
    return this.orders().filter((order) => this.isWithinRange(order.created_at, start, end));
  });
  readonly completedOrdersInRange = computed(() => {
    const { start, end } = this.rangeWindow();
    return this.orders().filter((order) => order.status === 'completed' && this.isWithinRange(order.completed_at, start, end));
  });
  readonly filteredActiveOrders = computed(() => this.ordersCreatedInRange().filter((o) => o.status === 'active'));
  readonly activeTables = computed(() => this.filteredActiveOrders().length);
  readonly payingNow = computed(() => this.filteredActiveOrders().filter((o) => o.request_bill).length);
  readonly needsStaff = computed(() => this.filteredActiveOrders().filter((o) => o.call_staff).length);
  readonly longWait = computed(() => this.filteredActiveOrders().filter((o) => minutesSince(o.created_at, this.now()) >= 20).length);
  readonly completedInRange = computed(() => this.completedOrdersInRange().length);
  readonly activeRevenue = computed(() => this.filteredActiveOrders().reduce((sum, order) => sum + this.orderTotal(order), 0));
  readonly completedRevenueInRange = computed(() => this.completedOrdersInRange().reduce((sum, order) => sum + this.orderTotal(order), 0));

  readonly greenPct = computed(() => {
    const active = this.filteredActiveOrders();
    if (!active.length) return 0;
    return Math.round((active.filter((o) => severityClass(o.created_at, this.now()) === 'emerald').length / active.length) * 100);
  });
  readonly amberPct = computed(() => {
    const active = this.filteredActiveOrders();
    if (!active.length) return 0;
    return Math.round((active.filter((o) => severityClass(o.created_at, this.now()) === 'amber').length / active.length) * 100);
  });
  readonly redPct = computed(() => {
    const active = this.filteredActiveOrders();
    if (!active.length) return 0;
    return Math.round((active.filter((o) => severityClass(o.created_at, this.now()) === 'red').length / active.length) * 100);
  });

  constructor() {
    this.storeService.loadStores().catch(() => undefined);
    effect(() => {
      this.storeService.selectedStoreId();
      this.load();
    });
    this.pollHandle = this.orderService.pollOrders(() => this.load());
  }

  ngOnDestroy(): void {
    if (this.pollHandle) clearInterval(this.pollHandle);
    window.clearInterval(this.clockHandle);
  }

  load(): void {
    this.orderService.getOrders(undefined, this.storeService.selectedStoreId()).subscribe((rows) => this.orders.set(rows));
  }

  money(value: number): string {
    return formatCurrency(value);
  }

  rangeValue(event: Event): OverviewRange {
    return (event.target as HTMLSelectElement).value as OverviewRange;
  }

  dateValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  selectStore(event: Event): void {
    this.storeService.setSelectedStore((event.target as HTMLSelectElement).value);
  }

  orderTotal(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  isWithinRange(value: string | null, start: Date, end: Date): boolean {
    if (!value) return false;

    const date = new Date(value);
    return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
  }

  tableCard(order: Order): string {
    const sev = severityClass(order.created_at, this.now());
    if (sev === 'red') return 'border-l-4 border-l-red-400';
    if (sev === 'amber') return 'border-l-4 border-l-amber-400';
    return 'border-l-4 border-l-emerald-400';
  }

  private resolveRange(range: OverviewRange, customDate: string, now: Date): { start: Date; end: Date } {
    switch (range) {
      case 'last-2-weeks':
        return {
          start: this.startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13)),
          end: now,
        };
      case 'this-month':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
          end: now,
        };
      case 'last-month':
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0),
          end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
        };
      case 'custom-day': {
        const selected = customDate ? new Date(`${customDate}T00:00:00`) : now;
        return {
          start: this.startOfDay(selected),
          end: this.endOfDay(selected),
        };
      }
      case 'this-week':
      default:
        return {
          start: this.startOfWeek(now),
          end: now,
        };
    }
  }

  private startOfWeek(date: Date): Date {
    const normalized = new Date(date);
    const day = normalized.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    normalized.setDate(normalized.getDate() + diff);
    return this.startOfDay(normalized);
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  private endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }

  private formatRangeDate(date: Date): string {
    return new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  }

  private isoDate(date: Date): string {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
}
