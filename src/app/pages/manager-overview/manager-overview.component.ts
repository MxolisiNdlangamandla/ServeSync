import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Eye, Users, Receipt, Bell, Clock, CheckCircle } from 'lucide-angular';
import { OrderService } from '../../core/services/order.service';
import { IndustryService } from '../../core/services/industry.service';
import { Order } from '../../core/models/order.model';
import { formatCurrency, minutesSince, severityClass } from '../../core/utils/formatters';
import { TimeElapsedComponent } from '../../shared/components/time-elapsed/time-elapsed.component';

@Component({
  selector: 'app-manager-overview',
  imports: [RouterLink, LucideAngularModule, TimeElapsedComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-5">
      <h1 class="text-3xl font-black text-primary">Overview</h1>

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
          <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Completed Revenue Today</p>
          <p class="text-3xl font-black text-emerald-600">{{ money(completedRevenueToday()) }}</p>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Completed Today</p>
        <p class="text-3xl font-black text-emerald-600">{{ completedToday() }}</p>
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
          @for (order of activeOrders(); track order.id) {
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

      @if (!activeOrders().length) {
        <div class="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-4xl">🍽️</div>
          <p class="text-lg font-semibold text-slate-500">No active {{ labels().orders.toLowerCase() }}</p>
          <p class="mt-1 text-sm text-slate-400">All {{ labels().tables.toLowerCase() }} are clear right now</p>
        </div>
      }
    </section>
  `
})
export class ManagerOverviewComponent implements OnDestroy {
  private readonly orderService = inject(OrderService);
  private readonly industryService = inject(IndustryService);
  readonly labels = this.industryService.labels;
  private pollHandle?: ReturnType<typeof setInterval>;

  readonly eyeIcon = Eye;
  readonly usersIcon = Users;
  readonly receiptIcon = Receipt;
  readonly bellIcon = Bell;
  readonly clockIcon = Clock;
  readonly checkIcon = CheckCircle;

  readonly orders = signal<Order[]>([]);
  readonly now = signal(Date.now());
  private readonly clockHandle = window.setInterval(() => this.now.set(Date.now()), 1000);

  readonly activeOrders = computed(() => this.orders().filter((o) => o.status === 'active'));
  readonly activeTables = computed(() => this.activeOrders().length);
  readonly payingNow = computed(() => this.activeOrders().filter((o) => o.request_bill).length);
  readonly needsStaff = computed(() => this.activeOrders().filter((o) => o.call_staff).length);
  readonly longWait = computed(() => this.activeOrders().filter((o) => minutesSince(o.created_at, this.now()) >= 20).length);
  readonly completedToday = computed(() => {
    return this.orders().filter((o) => o.status === 'completed' && this.isToday(o.completed_at)).length;
  });
  readonly activeRevenue = computed(() => this.activeOrders().reduce((sum, order) => sum + this.orderTotal(order), 0));
  readonly completedRevenueToday = computed(() => {
    return this.orders()
      .filter((o) => o.status === 'completed' && this.isToday(o.completed_at))
      .reduce((sum, order) => sum + this.orderTotal(order), 0);
  });

  readonly greenPct = computed(() => {
    const active = this.activeOrders();
    if (!active.length) return 0;
    return Math.round((active.filter((o) => severityClass(o.created_at, this.now()) === 'emerald').length / active.length) * 100);
  });
  readonly amberPct = computed(() => {
    const active = this.activeOrders();
    if (!active.length) return 0;
    return Math.round((active.filter((o) => severityClass(o.created_at, this.now()) === 'amber').length / active.length) * 100);
  });
  readonly redPct = computed(() => {
    const active = this.activeOrders();
    if (!active.length) return 0;
    return Math.round((active.filter((o) => severityClass(o.created_at, this.now()) === 'red').length / active.length) * 100);
  });

  constructor() {
    this.load();
    this.pollHandle = this.orderService.pollOrders(() => this.load());
  }

  ngOnDestroy(): void {
    if (this.pollHandle) clearInterval(this.pollHandle);
    window.clearInterval(this.clockHandle);
  }

  load(): void {
    this.orderService.getOrders().subscribe((rows) => this.orders.set(rows));
  }

  money(value: number): string {
    return formatCurrency(value);
  }

  orderTotal(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  isToday(value: string | null): boolean {
    if (!value) return false;

    const date = new Date(value);
    const now = new Date();
    return date.getFullYear() === now.getFullYear()
      && date.getMonth() === now.getMonth()
      && date.getDate() === now.getDate();
  }

  tableCard(order: Order): string {
    const sev = severityClass(order.created_at, this.now());
    if (sev === 'red') return 'border-l-4 border-l-red-400';
    if (sev === 'amber') return 'border-l-4 border-l-amber-400';
    return 'border-l-4 border-l-emerald-400';
  }
}
