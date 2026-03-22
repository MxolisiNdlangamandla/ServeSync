import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Eye, Check, Bell, Receipt } from 'lucide-angular';
import { Order } from '../../../core/models/order.model';
import { IndustryService } from '../../../core/services/industry.service';
import { severityClass, formatCurrency } from '../../../core/utils/formatters';
import { TimeElapsedComponent } from '../time-elapsed/time-elapsed.component';

@Component({
  selector: 'app-order-card',
  imports: [RouterLink, TimeElapsedComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="overflow-hidden rounded-xl border bg-white shadow-sm" [class]="borderClass()">
      <div class="border-l-4 p-4" [class]="leftBorderClass()">
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-lg font-bold text-primary">{{ labels().table }} {{ order().table_number }}</h3>
            <p class="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
              <span class="inline-flex items-center gap-1">&#9201; <app-time-elapsed [createdAt]="order().created_at" /></span>
              <span class="font-bold text-primary">{{ money(orderTotal()) }}</span>
            </p>
          </div>
          <div class="flex items-center gap-1.5">
            @if (order().call_staff) {
              <span class="flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                <lucide-angular [img]="bellIcon" class="h-3 w-3"></lucide-angular> {{ labels().staff }}
              </span>
            }
            @if (order().request_bill) {
              <span class="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                <lucide-angular [img]="receiptIcon" class="h-3 w-3"></lucide-angular> Bill
              </span>
            }
            @if (urgency() === 'red') {
              <span class="flex items-center gap-1 text-xs font-semibold text-red-500">
                <span class="h-2 w-2 rounded-full bg-red-500"></span> Urgent
              </span>
            } @else if (urgency() === 'amber') {
              <span class="flex items-center gap-1 text-xs font-semibold text-amber-500">
                <span class="h-2 w-2 rounded-full bg-amber-500"></span> Waiting
              </span>
            } @else {
              <span class="flex items-center gap-1 text-xs font-semibold text-emerald-500">
                <span class="h-2 w-2 rounded-full bg-emerald-500"></span> Fresh
              </span>
            }
          </div>
        </div>

        <!-- Items -->
        <div class="mt-3 space-y-1">
          @for (item of order().items.slice(0, 4); track item.name) {
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-600">{{ item.quantity }}x {{ item.name }}</span>
              <span class="font-medium text-slate-700">{{ money(item.price * item.quantity) }}</span>
            </div>
          }
          @if (order().items.length > 4) {
            <p class="text-xs text-slate-400">+{{ order().items.length - 4 }} more items</p>
          }
        </div>

        <!-- Actions -->
        <div class="mt-4 flex gap-2">
          <a class="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
             [routerLink]="['/orders', order().id]">
            <lucide-angular [img]="eyeIcon" class="h-4 w-4"></lucide-angular>
            View
          </a>
          @if (order().status === 'active') {
            <button class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                    (click)="completeOrder.emit(order().id)">
              <lucide-angular [img]="checkIcon" class="h-4 w-4"></lucide-angular>
              Complete
            </button>
          }
        </div>
      </div>
    </article>
  `
})
export class OrderCardComponent {
  readonly order = input.required<Order>();
  readonly completeOrder = output<string>();
  private readonly industryService = inject(IndustryService);
  readonly labels = this.industryService.labels;
  readonly eyeIcon = Eye;
  readonly checkIcon = Check;
  readonly bellIcon = Bell;
  readonly receiptIcon = Receipt;

  readonly urgency = computed(() => severityClass(this.order().created_at));
  readonly orderTotal = computed(() => this.order().items.reduce((sum, i) => sum + i.price * i.quantity, 0));

  money(value: number): string {
    return formatCurrency(value);
  }

  borderClass(): string {
    const level = this.urgency();
    if (level === 'red') return 'border-red-200';
    if (level === 'amber') return 'border-amber-200';
    return 'border-slate-200';
  }

  leftBorderClass(): string {
    const level = this.urgency();
    if (level === 'red') return 'border-l-red-500';
    if (level === 'amber') return 'border-l-amber-500';
    return 'border-l-emerald-500';
  }
}
