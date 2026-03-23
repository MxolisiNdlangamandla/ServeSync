import { ChangeDetectionStrategy, Component, inject, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule, Bell, HandHelping, Receipt, UtensilsCrossed, Plus, CreditCard, Send, Star } from 'lucide-angular';
import { toast } from 'ngx-sonner';
import { OrderService } from '../../core/services/order.service';
import { NotificationService } from '../../core/services/notification.service';
import { Order, OrderItem } from '../../core/models/order.model';
import { formatCurrency } from '../../core/utils/formatters';

@Component({
  selector: 'app-customer-order',
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Header -->
      <header class="sticky top-0 z-20 bg-white shadow-sm">
        <div class="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">S</div>
          <span class="text-lg font-bold text-primary">ServeSync</span>
        </div>
      </header>

      @if (order()) {
        <main class="mx-auto max-w-lg space-y-5 px-4 py-5 pb-8">
          <section class="text-center">
            <h1 class="text-2xl font-black text-primary">Table {{ order()!.table_number }}</h1>
            <p class="text-sm text-slate-500">Your order</p>
          </section>

          <!-- Items -->
          <section class="rounded-xl border border-slate-200 bg-white">
            @for (item of order()!.items; track item.name) {
              <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0">
                <div class="flex items-center gap-2">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">{{ item.quantity }}</span>
                  <span class="font-medium text-primary">{{ item.name }}</span>
                </div>
                <span class="text-sm font-bold text-primary">{{ money(item.price * item.quantity) }}</span>
              </div>
            }
            <div class="flex items-center justify-between bg-slate-50 px-4 py-3 font-bold text-primary">
              <span>Total</span>
              <span class="text-accent">{{ money(total()) }}</span>
            </div>
          </section>

          <!-- Alert Badges -->
          @if (order()!.call_staff) {
            <div class="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-amber-800">
              <lucide-angular [img]="handIcon" class="h-5 w-5"></lucide-angular>
              <span class="text-sm font-semibold">Staff has been called</span>
            </div>
          }
          @if (order()!.request_bill) {
            <div class="flex items-center gap-2 rounded-xl bg-primary/5 px-4 py-3 text-primary">
              <lucide-angular [img]="receiptIcon" class="h-5 w-5"></lucide-angular>
              <span class="text-sm font-semibold">Bill has been requested</span>
            </div>
          }

          <!-- Add Item (inline form) -->
          @if (order()!.status === 'active') {
            <section class="rounded-xl border border-slate-200 bg-white p-4">
              <h2 class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                <lucide-angular [img]="plusIcon" class="h-4 w-4"></lucide-angular> Add Item
              </h2>
              <div class="flex items-center gap-2">
                <input class="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none" placeholder="Item name" [value]="newItemName()" (input)="newItemName.set(inputValue($event))" />
                <input class="w-16 rounded-lg border border-slate-300 px-3 py-2.5 text-center text-sm placeholder:text-slate-400" placeholder="Qty" type="number" min="1" [value]="newItemQty()" (input)="newItemQty.set(intValue($event))" />
                <button class="flex items-center gap-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50" [disabled]="!newItemName().trim() || addingItem()" (click)="addItem()">
                  <lucide-angular [img]="sendIcon" class="h-4 w-4"></lucide-angular>
                  {{ addingItem() ? '...' : 'Add' }}
                </button>
              </div>
              <p class="mt-2 text-xs text-slate-400">Or browse the full menu below</p>
            </section>
          }

          <!-- Actions -->
          @if (order()!.status === 'active') {
            <div class="space-y-3">
              <a [routerLink]="['/c', orderId, 'menu']" [queryParams]="{token: accessToken}" class="block w-full rounded-full bg-accent px-4 py-3 text-center font-bold text-white hover:bg-orange-600">
                <lucide-angular [img]="utensilsIcon" class="mr-1.5 inline-block h-4 w-4"></lucide-angular>
                Browse Menu
              </a>
              <button class="w-full rounded-full border-2 border-amber-400 px-4 py-3 font-bold text-amber-600 hover:bg-amber-50 disabled:opacity-50" [disabled]="order()!.call_staff" (click)="callStaff()">
                <lucide-angular [img]="bellIcon" class="mr-1.5 inline-block h-4 w-4"></lucide-angular>
                {{ order()!.call_staff ? 'Staff Called' : 'Call Staff' }}
              </button>
              <button class="w-full rounded-full border-2 border-primary px-4 py-3 font-bold text-primary hover:bg-primary/5 disabled:opacity-50" [disabled]="order()!.request_bill" (click)="requestBill()">
                <lucide-angular [img]="receiptIcon" class="mr-1.5 inline-block h-4 w-4"></lucide-angular>
                {{ order()!.request_bill ? 'Bill Requested' : 'Request Bill' }}
              </button>
            </div>
          }

          <!-- Payment Section (gated by subscription) -->
          @if (order()!.status === 'active' && paymentEnabled()) {
            <section class="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
              <h2 class="mb-2 flex items-center gap-2 font-bold text-primary">
                <lucide-angular [img]="creditCardIcon" class="h-5 w-5 text-emerald-600"></lucide-angular>
                Payment
              </h2>
              @if (order()!.payment_status === 'unpaid') {
                <p class="mb-3 text-sm text-slate-500">Pay for your order directly.</p>
                <button class="w-full rounded-full bg-emerald-500 px-4 py-3 font-bold text-white hover:bg-emerald-600" (click)="initiatePayment()">
                  Pay {{ money(total()) }}
                </button>
              } @else if (order()!.payment_status === 'pending') {
                <div class="flex items-center gap-2 text-amber-600">
                  <span class="h-2 w-2 animate-pulse rounded-full bg-amber-500"></span>
                  <span class="text-sm font-semibold">Payment pending...</span>
                </div>
              } @else {
                <div class="flex items-center gap-2 text-emerald-600">
                  <span class="text-sm font-semibold">&#10003; Payment complete</span>
                </div>
              }
            </section>
          }

          <!-- Order completed / cancelled state -->
          @if (order()!.status !== 'active') {
            <div class="space-y-4">
              <div class="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center">
                <p class="text-sm font-semibold text-slate-500">
                  This order has been <span class="font-bold" [class]="order()!.status === 'completed' ? 'text-slate-600' : 'text-red-500'">{{ order()!.status }}</span>.
                </p>
              </div>

              @if (order()!.status === 'completed') {
                <section class="rounded-xl border border-slate-200 bg-white p-4">
                  <h2 class="mb-3 text-sm font-bold text-primary">Leave a review</h2>

                  @if (order()!.review_rating) {
                    <div class="space-y-2 rounded-lg bg-slate-50 p-4">
                      <p class="text-sm font-semibold text-slate-700">Thanks for your feedback.</p>
                      <p class="text-sm text-amber-500">{{ reviewStars(order()!.review_rating || 0) }}</p>
                      @if (order()!.review_comment) {
                        <p class="text-sm text-slate-600">{{ order()!.review_comment }}</p>
                      }
                    </div>
                  } @else {
                    <div class="flex gap-2">
                      @for (star of [1, 2, 3, 4, 5]; track star) {
                        <button type="button" class="rounded-full p-2 transition-colors"
                          [class]="reviewRating() >= star ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'"
                          (click)="reviewRating.set(star)">
                          <lucide-angular [img]="starIcon" class="h-5 w-5 fill-current"></lucide-angular>
                        </button>
                      }
                    </div>
                    <textarea class="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none"
                      rows="4"
                      placeholder="Share a quick review"
                      [value]="reviewComment()"
                      (input)="reviewComment.set(inputValue($event))"></textarea>
                    <button type="button" class="mt-3 w-full rounded-full bg-primary px-4 py-3 font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                      [disabled]="submittingReview()"
                      (click)="submitReview()">
                      {{ submittingReview() ? 'Submitting...' : 'Submit Review' }}
                    </button>
                  }
                </section>
              }
            </div>
          }
        </main>
      } @else {
        <div class="flex min-h-[60vh] items-center justify-center">
          <p class="text-slate-400">Loading order...</p>
        </div>
      }
    </div>
  `
})
export class CustomerOrderComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly notificationService = inject(NotificationService);

  readonly bellIcon = Bell;
  readonly handIcon = HandHelping;
  readonly receiptIcon = Receipt;
  readonly utensilsIcon = UtensilsCrossed;
  readonly plusIcon = Plus;
  readonly creditCardIcon = CreditCard;
  readonly sendIcon = Send;
  readonly starIcon = Star;

  readonly order = signal<Order | null>(null);
  readonly orderId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly accessToken = this.route.snapshot.queryParamMap.get('token') ?? '';
  readonly newItemName = signal('');
  readonly newItemQty = signal(1);
  readonly addingItem = signal(false);
  readonly reviewRating = signal(5);
  readonly reviewComment = signal('');
  readonly submittingReview = signal(false);

  // Payment is enabled for Tier 2+ subscriptions
  // This is set when the order loads (the backend could include this, but for now we show it)
  readonly paymentEnabled = signal(false);

  readonly total = () => {
    const o = this.order();
    return o ? o.items.reduce((sum, item) => sum + item.price * item.quantity, 0) : 0;
  };

  private pollHandle: ReturnType<typeof setInterval>;

  constructor() {
    this.load();
    // Poll for updates every 5s so customer sees waiter's changes
    this.pollHandle = setInterval(() => this.load(), 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.pollHandle);
  }

  load(): void {
    this.orderService.getOrder(this.orderId, this.accessToken).subscribe((order) => {
      if (order) this.order.set(order);
    });
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  intValue(event: Event): number {
    return Math.max(1, Math.floor(Number((event.target as HTMLInputElement).value || 1)));
  }

  money(value: number): string {
    return formatCurrency(value);
  }

  async addItem(): Promise<void> {
    const name = this.newItemName().trim();
    if (!name) return;
    this.addingItem.set(true);
    try {
      const order = this.order()!;
      const newItems: OrderItem[] = [{ name, price: 0, quantity: this.newItemQty() }];
      await this.orderService.appendItems(order, newItems, this.accessToken);
      await this.notificationService.createNotification({
        order_id: order.id,
        table_number: order.table_number,
        type: 'item_added',
        message: `Table ${order.table_number} added: ${this.newItemQty()}x ${name}`
      });
      this.newItemName.set('');
      this.newItemQty.set(1);
      toast.success('Item added');
      this.load();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to add item');
    } finally {
      this.addingItem.set(false);
    }
  }

  async callStaff(): Promise<void> {
    try {
      const order = this.order()!;
      await this.orderService.updateOrder(this.orderId, { call_staff: true }, this.accessToken);
      await this.notificationService.createNotification({
        order_id: order.id,
        table_number: order.table_number,
        type: 'call_staff',
        message: `Table ${order.table_number} is calling for staff`
      });
      toast.success('Staff notified');
      this.load();
    } catch (e: any) {
      toast.error(e.message ?? 'Request failed');
    }
  }

  async requestBill(): Promise<void> {
    try {
      const order = this.order()!;
      await this.orderService.updateOrder(this.orderId, { request_bill: true }, this.accessToken);
      await this.notificationService.createNotification({
        order_id: order.id,
        table_number: order.table_number,
        type: 'bill_request',
        message: `Table ${order.table_number} requested the bill`
      });
      toast.success('Bill requested');
      this.load();
    } catch (e: any) {
      toast.error(e.message ?? 'Request failed');
    }
  }

  async initiatePayment(): Promise<void> {
    try {
      await this.orderService.updateOrder(this.orderId, { payment_status: 'pending' }, this.accessToken);
      toast.success('Payment initiated');
      this.load();
    } catch (e: any) {
      toast.error(e.message ?? 'Payment failed');
    }
  }

  reviewStars(count: number): string {
    return '★'.repeat(count) + '☆'.repeat(Math.max(0, 5 - count));
  }

  async submitReview(): Promise<void> {
    if (this.submittingReview() || this.order()?.status !== 'completed' || this.order()?.review_rating) {
      return;
    }

    this.submittingReview.set(true);
    try {
      await this.orderService.updateOrder(this.orderId, {
        review_rating: this.reviewRating(),
        review_comment: this.reviewComment().trim() || null
      } as Partial<Order>, this.accessToken);
      toast.success('Thanks for the review');
      this.load();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to submit review');
    } finally {
      this.submittingReview.set(false);
    }
  }
}
