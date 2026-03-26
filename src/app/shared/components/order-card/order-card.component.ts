import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnDestroy, output, signal } from '@angular/core';
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
            <h3 class="text-lg font-bold text-primary">{{ labels().table }} {{ order().table_number }} <span class="ml-1 text-sm font-semibold text-slate-500">· #{{ orderNumber() }}</span></h3>
            <p class="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
              <span class="inline-flex items-center gap-1">&#9201; {{ timeLabel() }} <app-time-elapsed [createdAt]="order().created_at" [endAt]="timeEndAt()" /></span>
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
            @if (order().status === 'completed') {
              <span class="flex items-center gap-1 text-xs font-semibold text-slate-500">
                <span class="h-2 w-2 rounded-full bg-slate-400"></span> Completed
              </span>
            } @else if (order().status === 'cancelled') {
              <span class="flex items-center gap-1 text-xs font-semibold text-red-500">
                <span class="h-2 w-2 rounded-full bg-red-500"></span> Cancelled
              </span>
            } @else if (urgency() === 'red') {
              <span class="flex items-center gap-1 text-xs font-semibold text-red-500">
                <span class="h-2 w-2 rounded-full bg-red-500"></span> {{ urgencyLabel() }}
              </span>
            } @else if (urgency() === 'amber') {
              <span class="flex items-center gap-1 text-xs font-semibold text-amber-500">
                <span class="h-2 w-2 rounded-full bg-amber-500"></span> {{ urgencyLabel() }}
              </span>
            } @else {
              <span class="flex items-center gap-1 text-xs font-semibold text-emerald-500">
                <span class="h-2 w-2 rounded-full bg-emerald-500"></span> {{ urgencyLabel() }}
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
          } @else if (order().status === 'completed') {
            <a class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90"
               routerLink="/orders/new"
               [queryParams]="{ copyFrom: order().id }">
              Copy Order
            </a>
          }
        </div>

        @if (order().status === 'completed') {
          <div class="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
            <div>
              <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Payment</p>
              <div class="mt-2 flex gap-2">
                <button type="button"
                        class="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                        (click)="markPaid.emit({ id: order().id, method: 'cash' })">
                  Pay Cash
                </button>
                <button type="button"
                        class="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                        (click)="markPaid.emit({ id: order().id, method: 'card' })">
                  Pay Card
                </button>
              </div>
              @if (order().payment_status === 'paid') {
                <p class="mt-2 text-xs font-medium text-emerald-700">
                  Paid via {{ order().payment_method ?? 'recorded method' }}
                </p>
              }
            </div>

            <div>
              <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Service Review</p>
              <div class="mt-2 flex items-center gap-1">
                @for (star of stars; track star) {
                  <button type="button"
                          class="text-lg leading-none"
                          [class]="selectedRating() >= star ? 'text-amber-500' : 'text-slate-300'"
                          (click)="selectedRating.set(star)">
                    ★
                  </button>
                }
              </div>
              <textarea class="mt-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700 placeholder:text-slate-400"
                        rows="2"
                        maxlength="300"
                        placeholder="Optional comment"
                        [value]="reviewComment()"
                        (input)="onReviewCommentInput($event)"></textarea>
              <button type="button"
                      class="mt-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      [disabled]="selectedRating() < 1"
                      (click)="submitReview()">
                Save Review
              </button>
            </div>
          </div>
        }
      </div>
    </article>
  `
})
export class OrderCardComponent implements OnDestroy {
  readonly order = input.required<Order>();
  readonly completeOrder = output<string>();
  readonly markPaid = output<{ id: string; method: 'cash' | 'card' }>();
  readonly saveReview = output<{ id: string; rating: number; comment: string | null }>();
  private readonly industryService = inject(IndustryService);
  readonly labels = this.industryService.labels;
  readonly eyeIcon = Eye;
  readonly checkIcon = Check;
  readonly bellIcon = Bell;
  readonly receiptIcon = Receipt;
  readonly stars = [1, 2, 3, 4, 5] as const;
  readonly selectedRating = signal(0);
  readonly reviewComment = signal('');
  private readonly now = signal(Date.now());
  private readonly timer = window.setInterval(() => this.now.set(Date.now()), 1000);

  private readonly syncReviewState = effect(() => {
    const order = this.order();
    this.selectedRating.set(order.review_rating ?? 0);
    this.reviewComment.set(order.review_comment ?? '');
  });

  readonly urgency = computed(() => severityClass(this.order().created_at, this.now()));
  readonly orderTotal = computed(() => this.order().items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  readonly urgencyLabel = computed(() => {
    const level = this.urgency();
    if (level === 'red') return 'Urgent';
    if (level === 'amber') return 'In Progress';
    return 'Open';
  });

  timeLabel(): string {
    return this.order().status === 'completed' ? 'Took' : '';
  }

  timeEndAt(): string | null {
    return this.order().status === 'completed' ? (this.order().completed_at ?? this.order().updated_at) : null;
  }

  money(value: number): string {
    return formatCurrency(value);
  }

  orderNumber(): string {
    return this.order().id.slice(0, 8).toUpperCase();
  }

  onReviewCommentInput(event: Event): void {
    this.reviewComment.set((event.target as HTMLTextAreaElement).value);
  }

  submitReview(): void {
    const rating = this.selectedRating();
    if (rating < 1) {
      return;
    }

    const comment = this.reviewComment().trim();
    this.saveReview.emit({ id: this.order().id, rating, comment: comment || null });
  }

  borderClass(): string {
    if (this.order().status === 'completed') return 'border-slate-200';
    if (this.order().status === 'cancelled') return 'border-red-200';
    const level = this.urgency();
    if (level === 'red') return 'border-red-200';
    if (level === 'amber') return 'border-amber-200';
    return 'border-slate-200';
  }

  leftBorderClass(): string {
    if (this.order().status === 'completed') return 'border-l-slate-400';
    if (this.order().status === 'cancelled') return 'border-l-red-500';
    const level = this.urgency();
    if (level === 'red') return 'border-l-red-500';
    if (level === 'amber') return 'border-l-amber-500';
    return 'border-l-emerald-500';
  }

  ngOnDestroy(): void {
    window.clearInterval(this.timer);
  }
}
