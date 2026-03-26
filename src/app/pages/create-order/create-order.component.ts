import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { QrCodeComponent } from 'ng-qrcode';
import { toast } from 'ngx-sonner';
import { LucideAngularModule, ArrowLeft, Search, Plus, QrCode, Minus, Trash2, ShoppingCart, ClipboardCheck } from 'lucide-angular';
import { MenuItem } from '../../core/models/menu-item.model';
import { OrderItem } from '../../core/models/order.model';
import { MenuService } from '../../core/services/menu.service';
import { NotificationService } from '../../core/services/notification.service';
import { OrderService } from '../../core/services/order.service';
import { IndustryService } from '../../core/services/industry.service';
import { AuthService } from '../../core/services/auth.service';
import { formatCurrency } from '../../core/utils/formatters';

type Step = 'build' | 'done';

@Component({
  selector: 'app-create-order',
  imports: [ReactiveFormsModule, QrCodeComponent, RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-5">
      <div>
        <a routerLink="/dashboard" class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary">
          <lucide-angular [img]="icons.arrowLeft" class="h-4 w-4"></lucide-angular> Back
        </a>
        <h1 class="mt-1 text-3xl font-black text-primary">New {{ labels().order }}</h1>
        <p class="text-sm text-slate-500">
          @switch (step()) {
            @case ('build') { Select from the menu or add custom items }
            @case ('done') { Share QR code with the customer }
          }
        </p>
        @if (copiedFromOrderId() && step() === 'build') {
          <div class="mt-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-primary">Draft Mode</p>
            <p class="mt-1 text-sm text-slate-700">Copied from completed order <span class="font-mono text-xs text-slate-600">{{ copiedFromOrderId() }}</span>. Edit items and details, then create a new order.</p>
          </div>
        }
      </div>

      <!-- ───── STEP 1: BUILD ───── -->
      @if (step() === 'build') {
        <!-- Details -->
        <div class="rounded-xl border border-slate-200 bg-white p-5">
          <h2 class="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Details</h2>
          <form class="grid grid-cols-2 gap-3" [formGroup]="metaForm">
            <div>
              <label class="mb-1 block text-sm font-semibold text-slate-700">{{ labels().table }} Number <span class="text-red-500">*</span></label>
              <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none" formControlName="tableNumber" placeholder="e.g. 5, A3, Bar" (input)="onTableNumberInput($event)" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-semibold text-slate-700">{{ labels().customer }} Name <span class="text-xs text-slate-400">(optional)</span></label>
              <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none" formControlName="customerName" placeholder="e.g. John Smith" />
            </div>
          </form>
        </div>

        <!-- Menu Items -->
        <div class="rounded-xl border border-slate-200 bg-white p-5">
          <h2 class="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Menu Items</h2>
          @if (menuLocked()) {
            <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              <p class="font-semibold">Saved menu items are not available on the Starter plan.</p>
              <p class="mt-1 text-amber-800">You can still place the order by adding custom items manually below. Upgrade to Essentials, Professional, or Enterprise to unlock menu management.</p>
            </div>
          } @else {
            <div class="relative mb-4">
              <lucide-angular [img]="icons.search" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"></lucide-angular>
              <input class="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none" placeholder="Search menu..." [value]="search()" (input)="search.set(inputValue($event))" />
            </div>
            @for (group of groupedMenu(); track group.category) {
              <div class="mb-4">
                <h3 class="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{{ group.category }}</h3>
                <div class="space-y-2">
                  @for (item of group.items; track item.id) {
                    <div class="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                      <div class="min-w-0 flex-1">
                        <p class="font-semibold text-primary">{{ item.name }}</p>
                        <p class="truncate text-xs text-slate-400">{{ item.description }}</p>
                        <p class="mt-0.5 text-sm font-bold text-primary">{{ money(item.price) }}</p>
                      </div>
                      <button type="button" class="ml-3 flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50" (click)="addMenuItem(item)">
                        <lucide-angular [img]="icons.plus" class="h-3.5 w-3.5"></lucide-angular> Add
                      </button>
                    </div>
                  }
                </div>
              </div>
            }
            @if (groupedMenu().length === 0) {
              <p class="py-6 text-center text-sm text-slate-400">No saved menu items found. Add custom items below, or create menu items from the Menu page.</p>
            }
          }
        </div>

        <!-- Custom Items -->
        <div class="rounded-xl border border-slate-200 bg-white p-5">
          <h2 class="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Custom Items</h2>
          <p class="mb-3 text-xs text-slate-400">Add something not on the menu</p>
          <div class="mb-2 grid grid-cols-[1fr_4rem_6rem_auto] items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span>Item</span>
            <span class="text-center">Qty</span>
            <span>Price</span>
            <span></span>
          </div>
          <div class="grid grid-cols-[1fr_4rem_6rem_auto] items-center gap-2">
            <input class="rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400" placeholder="Item name" [value]="customName()" (input)="customName.set(inputValue($event))" />
            <input class="rounded-lg border border-slate-300 px-3 py-2 text-center text-sm placeholder:text-slate-400" placeholder="1" type="number" min="1" [value]="customQty()" (input)="customQty.set(intValue($event))" />
            <input class="rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400" placeholder="0.00" type="number" step="0.01" [value]="customPrice()" (input)="customPrice.set(numberValue($event))" />
            <button type="button" class="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50" (click)="addCustomItem()">
              <lucide-angular [img]="icons.plus" class="h-3.5 w-3.5"></lucide-angular> Add
            </button>
          </div>
        </div>

        <!-- Cart Summary -->
        @if (cart().length > 0) {
          <div class="rounded-xl border border-slate-200 bg-white p-5">
            <h2 class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              <lucide-angular [img]="icons.cart" class="h-4 w-4"></lucide-angular>
              Cart ({{ cart().length }} items)
            </h2>
            <div class="space-y-2">
              @for (i of cart(); track i.name) {
                <div class="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <span class="flex-1 font-medium text-slate-700">{{ i.name }}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-400">{{ money(i.price) }} ea</span>
                    <button type="button" class="flex h-6 w-6 items-center justify-center rounded border border-slate-200 text-xs hover:bg-slate-50" (click)="changeQty(i.name, -1)">
                      <lucide-angular [img]="icons.minus" class="h-3 w-3"></lucide-angular>
                    </button>
                    <span class="w-6 text-center font-semibold">{{ i.quantity }}</span>
                    <button type="button" class="flex h-6 w-6 items-center justify-center rounded border border-slate-200 text-xs hover:bg-slate-50" (click)="changeQty(i.name, 1)">
                      <lucide-angular [img]="icons.plus" class="h-3 w-3"></lucide-angular>
                    </button>
                    <span class="w-20 text-right font-bold text-primary">{{ money(i.price * i.quantity) }}</span>
                    <button type="button" class="text-red-400 hover:text-red-600" (click)="remove(i.name)">
                      <lucide-angular [img]="icons.trash" class="h-3.5 w-3.5"></lucide-angular>
                    </button>
                  </div>
                </div>
              }
            </div>
            <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <span class="text-sm font-semibold text-slate-500">Total</span>
              <span class="text-lg font-bold text-primary">{{ money(total()) }}</span>
            </div>
          </div>
        }

        <button class="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 font-bold text-white hover:bg-orange-600 disabled:opacity-50" [disabled]="isCreateDisabled()" (click)="createOrder()">
          <lucide-angular [img]="icons.qr" class="h-5 w-5"></lucide-angular>
          {{ submitting() ? 'Creating...' : 'Create ' + labels().order }}
        </button>
      }

      <!-- ───── STEP 2: DONE ───── -->
      @if (step() === 'done') {
        <div class="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h2 class="text-2xl font-black text-primary">{{ labels().order }} Created!</h2>
          <p class="mt-1 text-slate-500">Share this QR with the {{ labels().customer.toLowerCase() }}.</p>
          <div class="my-6 inline-flex rounded-xl border border-slate-200 p-3">
            <qr-code [value]="customerLink()" [size]="220"></qr-code>
          </div>
          <p class="break-all text-xs text-slate-400">{{ customerLink() }}</p>
          <div class="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" class="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white" (click)="copyLink()">Copy Link</button>
            <a class="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white" [href]="whatsAppLink()" target="_blank" rel="noreferrer">Share WhatsApp</a>
            <a [routerLink]="['/orders', createdOrderId()]" class="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold">Open Detail</a>
          </div>
        </div>
      }
    </section>
  `
})
export class CreateOrderComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly menuService = inject(MenuService);
  private readonly notificationService = inject(NotificationService);
  private readonly industryService = inject(IndustryService);
  private readonly auth = inject(AuthService);
  readonly labels = this.industryService.labels;

  readonly icons = {
    arrowLeft: ArrowLeft, search: Search, plus: Plus, minus: Minus,
    qr: QrCode, trash: Trash2, cart: ShoppingCart, clipboard: ClipboardCheck
  };

  readonly menu = signal<MenuItem[]>([]);
  readonly cart = signal<OrderItem[]>([]);
  readonly search = signal('');
  readonly tableNumber = signal('');
  readonly customName = signal('');
  readonly customQty = signal(1);
  readonly customPrice = signal(0);
  readonly step = signal<Step>('build');
  readonly submitting = signal(false);
  readonly createdOrderId = signal('');
  readonly createdToken = signal('');
  readonly copiedFromOrderId = signal('');

  readonly metaForm = this.fb.nonNullable.group({
    tableNumber: ['', Validators.required],
    customerName: ['']
  });

  readonly groupedMenu = computed(() => {
    const query = this.search().trim().toLowerCase();
    const rows = this.menu().filter((item) => item.available && (!query || item.name.toLowerCase().includes(query)));
    const map = new Map<string, MenuItem[]>();
    rows.forEach((item) => {
      const current = map.get(item.category) ?? [];
      map.set(item.category, [...current, item]);
    });
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  });
  readonly menuLocked = computed(() => this.auth.profile()?.subscription_tier === 'tier1');

  readonly total = computed(() => this.cart().reduce((sum, item) => sum + item.price * item.quantity, 0));

  constructor() {
    this.menuService.getMenuItems().subscribe((rows) => this.menu.set(rows));
    this.prefillFromCopiedOrder();
  }

  private prefillFromCopiedOrder(): void {
    const sourceOrderId = this.route.snapshot.queryParamMap.get('copyFrom');
    if (!sourceOrderId) {
      return;
    }

    this.copiedFromOrderId.set(sourceOrderId);

    this.orderService.getOrder(sourceOrderId).subscribe({
      next: (sourceOrder) => {
        if (!sourceOrder) {
          toast.error('Unable to load copied order');
          return;
        }

        const copiedItems = sourceOrder.items.map((item) => ({
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity)
        }));

        this.cart.set(copiedItems);
        this.metaForm.patchValue({
          tableNumber: sourceOrder.table_number,
          customerName: sourceOrder.customer_name ?? ''
        });
        this.tableNumber.set(sourceOrder.table_number);
        toast.success('Copied order loaded as a new draft');
      },
      error: () => {
        toast.error('Unable to load copied order');
      }
    });
  }

  onTableNumberInput(event: Event): void {
    this.tableNumber.set(this.inputValue(event));
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  numberValue(event: Event): number {
    return Number((event.target as HTMLInputElement).value || 0);
  }

  intValue(event: Event): number {
    return Math.max(1, Math.floor(Number((event.target as HTMLInputElement).value || 1)));
  }

  money(value: number): string {
    return formatCurrency(value);
  }

  addMenuItem(item: MenuItem): void {
    this.upsertCart({ name: item.name, price: Number(item.price), quantity: 1 });
  }

  addCustomItem(): void {
    const name = this.customName().trim();
    if (!name) {
      toast.error('Enter an item name');
      return;
    }
    if (this.customPrice() <= 0) {
      toast.error('Enter a valid price for the custom item');
      return;
    }

    this.upsertCart({ name, price: this.customPrice(), quantity: this.customQty() });
    this.customName.set('');
    this.customQty.set(1);
    this.customPrice.set(0);
    toast.success('Custom item added');
  }

  upsertCart(incoming: OrderItem): void {
    const next = [...this.cart()];
    const found = next.find((i) => i.name.toLowerCase() === incoming.name.toLowerCase());
    if (found) found.quantity += incoming.quantity;
    else next.push(incoming);
    this.cart.set(next);
  }

  changeQty(name: string, delta: number): void {
    this.cart.update((items) => items
      .map((i) => (i.name === name ? { ...i, quantity: i.quantity + delta } : i))
      .filter((i) => i.quantity > 0));
  }

  remove(name: string): void {
    this.cart.update((items) => items.filter((i) => i.name !== name));
  }

  isCreateDisabled(): boolean {
    return this.submitting() || this.tableNumber().trim().length === 0 || this.cart().length === 0;
  }

  private createAccessToken(): string {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }

  async createOrder(): Promise<void> {
    if (this.submitting()) return;

    const table = this.metaForm.controls.tableNumber.value.trim();
    if (!table || this.cart().length === 0) {
      toast.error('Enter a table number and add at least one item');
      return;
    }

    this.submitting.set(true);
    try {
      const created = await this.orderService.createOrder({
        table_number: table,
        items: this.cart(),
        customer_name: this.metaForm.controls.customerName.value || undefined,
        access_token: this.createAccessToken()
      });

      try {
        await this.notificationService.createNotification({
          order_id: created.id,
          table_number: created.table_number,
          type: 'new_order',
          message: `New order created for table ${created.table_number}`
        });
      } catch (notificationError) {
        console.warn('Notification creation failed after order creation', notificationError);
      }

      this.createdOrderId.set(created.id);
      this.createdToken.set(created.access_token);
      this.step.set('done');
      toast.success('Order created');
    } catch (e: any) {
      toast.error(e?.error?.error ?? 'Failed to create order');
    } finally {
      this.submitting.set(false);
    }
  }

  customerLink(): string {
    if (!this.createdOrderId()) return '';
    return `${window.location.origin}/c/${this.createdOrderId()}?token=${this.createdToken()}`;
  }

  whatsAppLink(): string {
    return `https://wa.me/?text=${encodeURIComponent(`Your order link: ${this.customerLink()}`)}`;
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.customerLink()).then(() => toast.success('Link copied'));
  }
}
