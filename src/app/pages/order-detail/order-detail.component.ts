import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, ArrowLeft, Pencil, Bell, Receipt, Check, X, QrCode, Trash2, Plus } from 'lucide-angular';
import { QrCodeComponent } from 'ng-qrcode';
import { toast } from 'ngx-sonner';
import { OrderService } from '../../core/services/order.service';
import { IndustryService } from '../../core/services/industry.service';
import { Order, OrderItem } from '../../core/models/order.model';
import { formatCurrency, minutesSince, severityClass } from '../../core/utils/formatters';
import { TimeElapsedComponent } from '../../shared/components/time-elapsed/time-elapsed.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, ReactiveFormsModule, LucideAngularModule, QrCodeComponent, TimeElapsedComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (order()) {
      <section class="space-y-5">
        <!-- Back -->
        <a routerLink="/dashboard" class="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
          <lucide-angular [img]="arrowLeftIcon" class="h-4 w-4"></lucide-angular> Back to Dashboard
        </a>

        <!-- Header -->
        <header class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-black text-primary">{{ labels().table }} {{ order()!.table_number }}</h1>
            <div class="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <app-time-elapsed [createdAt]="order()!.created_at"></app-time-elapsed>
              <app-status-badge [createdAt]="order()!.created_at"></app-status-badge>
            </div>
          </div>
          <span class="rounded-full px-3 py-1 text-xs font-bold uppercase" [class]="statusBadge()">{{ statusLabel() }}</span>
        </header>

        <!-- Alerts -->
        @if (order()!.call_staff) {
          <div class="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
            <div class="flex items-center gap-2 text-amber-800">
              <lucide-angular [img]="bellIcon" class="h-5 w-5"></lucide-angular>
              <span class="text-sm font-semibold">{{ labels().staff }} requested</span>
            </div>
            <button class="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-300" (click)="dismiss('call_staff')">Dismiss</button>
          </div>
        }
        @if (order()!.request_bill) {
          <div class="flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3">
            <div class="flex items-center gap-2 text-primary">
              <lucide-angular [img]="receiptIcon" class="h-5 w-5"></lucide-angular>
              <span class="text-sm font-semibold">Bill requested</span>
            </div>
            <button class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20" (click)="dismiss('request_bill')">Dismiss</button>
          </div>
        }

        <!-- Items -->
        <section class="rounded-xl border border-slate-200 bg-white">
          <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 class="font-bold text-primary">Items</h2>
            @if (!editing()) {
              <button class="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline" (click)="startEdit()">
                <lucide-angular [img]="pencilIcon" class="h-3.5 w-3.5"></lucide-angular> Edit
              </button>
            }
          </div>

          @if (!editing()) {
            @for (item of order()!.items; track item.name) {
              <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0">
                <div class="flex items-center gap-2">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">{{ item.quantity }}</span>
                  <span class="font-medium text-primary">{{ item.name }}</span>
                </div>
                <span class="text-sm font-bold text-primary">{{ money(item.price * item.quantity) }}</span>
              </div>
            }
          } @else {
            <form [formGroup]="editItemsForm">
              <div formArrayName="items">
                @for (ctrl of itemsArray.controls; track $index) {
                  <div [formGroupName]="$index" class="flex items-center gap-2 border-b border-slate-100 px-4 py-2 last:border-b-0">
                    <input class="flex-1 rounded border border-slate-200 px-2 py-1 text-sm" formControlName="name" />
                    <input class="w-14 rounded border border-slate-200 px-2 py-1 text-center text-sm" formControlName="quantity" type="number" min="0" />
                    <input class="w-20 rounded border border-slate-200 px-2 py-1 text-sm" formControlName="price" type="number" step="0.01" />
                    <button type="button" class="p-1 text-red-400 hover:text-red-600" (click)="removeItem($index)">
                      <lucide-angular [img]="trashIcon" class="h-4 w-4"></lucide-angular>
                    </button>
                  </div>
                }
              </div>
            </form>
            <div class="px-4 pt-3">
              <button type="button" class="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100" (click)="addItem()">
                <lucide-angular [img]="plusIcon" class="h-4 w-4"></lucide-angular>
                Add Item
              </button>
            </div>
            <div class="flex justify-end gap-2 px-4 py-3">
              <button type="button" class="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100" (click)="editing.set(false)">Cancel</button>
              <button type="button" class="rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-white hover:bg-orange-600" (click)="saveItems()">Save</button>
            </div>
          }

          <div class="flex items-center justify-between bg-slate-50 px-4 py-3 font-bold text-primary">
            <span>Total</span>
            <span class="text-accent">{{ money(total()) }}</span>
          </div>
        </section>

        <!-- QR Code -->
        <section class="rounded-xl border border-slate-200 bg-white p-4">
          <h2 class="mb-3 flex items-center gap-2 font-bold text-primary">
            <lucide-angular [img]="qrIcon" class="h-5 w-5 text-accent"></lucide-angular> {{ labels().customer }} QR
          </h2>
          <div class="flex justify-center">
            <qr-code [value]="qrUrl()" [size]="180"></qr-code>
          </div>
          <p class="mt-2 text-center text-xs text-slate-400">Scan to view order &amp; menu</p>
        </section>

        <!-- Actions -->
        @if (order()!.status === 'active') {
          <div class="flex gap-3">
            <button class="flex-1 rounded-full bg-emerald-500 px-4 py-3 font-bold text-white hover:bg-emerald-600" (click)="complete()">
              <lucide-angular [img]="checkIcon" class="mr-1.5 inline-block h-4 w-4"></lucide-angular> Complete Order
            </button>
            <button class="flex-1 rounded-full border-2 border-red-300 px-4 py-3 font-bold text-red-500 hover:bg-red-50" (click)="cancel()">
              <lucide-angular [img]="xIcon" class="mr-1.5 inline-block h-4 w-4"></lucide-angular> Cancel
            </button>
          </div>
        }
      </section>
    } @else {
      <div class="flex min-h-[40vh] items-center justify-center">
        <p class="text-slate-400">Loading order...</p>
      </div>
    }
  `
})
export class OrderDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly industryService = inject(IndustryService);
  readonly labels = this.industryService.labels;
  private readonly fb = inject(FormBuilder);

  readonly arrowLeftIcon = ArrowLeft;
  readonly pencilIcon = Pencil;
  readonly bellIcon = Bell;
  readonly receiptIcon = Receipt;
  readonly checkIcon = Check;
  readonly xIcon = X;
  readonly qrIcon = QrCode;
  readonly trashIcon = Trash2;
  readonly plusIcon = Plus;

  readonly order = signal<Order | null>(null);
  readonly editing = signal(false);
  readonly editItemsForm = this.fb.group({ items: this.fb.array<FormGroup>([]) });

  private readonly orderId = this.route.snapshot.paramMap.get('id') ?? '';

  get itemsArray(): FormArray<FormGroup> {
    return this.editItemsForm.get('items') as FormArray<FormGroup>;
  }

  readonly total = () => {
    if (this.editing()) {
      return this.itemsArray.controls.reduce((sum, control) => {
        const quantity = Number(control.get('quantity')?.value ?? 0);
        const price = Number(control.get('price')?.value ?? 0);
        return sum + quantity * price;
      }, 0);
    }

    const o = this.order();
    return o ? o.items.reduce((sum, item) => sum + item.price * item.quantity, 0) : 0;
  };

  readonly statusBadge = () => {
    const s = this.order()?.status;
    if (s === 'active') return 'bg-emerald-100 text-emerald-700';
    if (s === 'completed') return 'bg-slate-100 text-slate-600';
    return 'bg-red-100 text-red-600';
  };

  readonly statusLabel = () => {
    const s = this.order()?.status;
    if (s === 'active') return 'Open';
    if (s === 'completed') return 'Concluded';
    return 'Cancelled';
  };

  constructor() {
    this.load();
  }

  load(): void {
    this.orderService.getOrder(this.orderId).subscribe((order) => this.order.set(order));
  }

  money(value: number): string {
    return formatCurrency(value);
  }

  qrUrl(): string {
    const token = this.order()?.access_token ?? '';
    return `${window.location.origin}/c/${this.orderId}?token=${token}`;
  }

  startEdit(): void {
    const items = this.order()?.items ?? [];
    this.itemsArray.clear();
    items.forEach((item) => {
      this.itemsArray.push(this.fb.group({
        name: [item.name, Validators.required],
        quantity: [item.quantity, [Validators.required, Validators.min(1)]],
        price: [item.price, [Validators.required, Validators.min(0)]]
      }));
    });
    this.editing.set(true);
  }

  addItem(): void {
    this.itemsArray.push(this.fb.group({
      name: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(0)]]
    }));
  }

  removeItem(index: number): void {
    this.itemsArray.removeAt(index);
  }

  async saveItems(): Promise<void> {
    const items = this.itemsArray.getRawValue()
      .map((item) => ({
        name: String(item['name'] ?? '').trim(),
        quantity: Number(item['quantity'] ?? 0),
        price: Number(item['price'] ?? 0)
      }))
      .filter((item) => item.name && item.quantity > 0) as OrderItem[];

    if (!items.length) {
      toast.error('Add at least one item before saving');
      return;
    }

    try {
      await this.orderService.updateOrder(this.orderId, { items });
      toast.success('Items updated');
      this.editing.set(false);
      this.load();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to update');
    }
  }

  async dismiss(field: 'call_staff' | 'request_bill'): Promise<void> {
    try {
      await this.orderService.updateOrder(this.orderId, { [field]: false });
      toast.success('Alert dismissed');
      this.load();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed');
    }
  }

  async complete(): Promise<void> {
    try {
      await this.orderService.updateOrder(this.orderId, { status: 'completed' });
      toast.success('Order completed');
      this.router.navigateByUrl('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to complete order';
      toast.error(message);
    }
  }

  async cancel(): Promise<void> {
    try {
      await this.orderService.updateOrder(this.orderId, { status: 'cancelled' });
      toast.success('Order cancelled');
      this.router.navigateByUrl('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to cancel order';
      toast.error(message);
    }
  }
}
