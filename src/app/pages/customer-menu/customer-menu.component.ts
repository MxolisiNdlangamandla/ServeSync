import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, Plus, ShoppingCart } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';
import { MenuService } from '../../core/services/menu.service';
import { OrderService } from '../../core/services/order.service';
import { MenuItem } from '../../core/models/menu-item.model';
import { OrderItem } from '../../core/models/order.model';
import { formatCurrency } from '../../core/utils/formatters';

interface CartItem extends OrderItem {
  id: string;
}

@Component({
  selector: 'app-customer-menu',
  imports: [LucideAngularModule],
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

      <main class="mx-auto max-w-lg px-4 py-5 pb-28">
        <h1 class="mb-4 text-2xl font-black text-primary">Menu</h1>

        @for (group of grouped(); track group.category) {
          <section class="mb-5">
            <h2 class="mb-3 text-xs font-bold uppercase tracking-wide text-accent">{{ group.category }}</h2>
            <div class="space-y-3">
              @for (item of group.items; track item.id) {
                <article class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div class="min-w-0 flex-1">
                    <h3 class="font-bold text-primary">{{ item.name }}</h3>
                    <p class="truncate text-xs text-slate-400">{{ item.description }}</p>
                  </div>
                  <span class="flex-shrink-0 text-sm font-bold text-primary">{{ money(item.price) }}</span>
                  <button class="flex-shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600" (click)="addToCart(item)">
                    <lucide-angular [img]="plusIcon" class="inline-block h-3 w-3"></lucide-angular>
                    Add
                  </button>
                </article>
              }
            </div>
          </section>
        }

        @if (!menuItems().length) {
          <div class="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <p class="text-slate-400">Menu is empty.</p>
          </div>
        }
      </main>

      <!-- Sticky Cart Bar -->
      @if (cart().length) {
        <div class="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white px-4 py-3 shadow-lg">
          <div class="mx-auto flex max-w-lg items-center justify-between">
            <div class="flex items-center gap-2">
              <lucide-angular [img]="cartIcon" class="h-5 w-5 text-accent"></lucide-angular>
              <span class="text-sm font-bold text-primary">{{ totalItems() }} items</span>
              <span class="text-sm font-bold text-accent">{{ money(totalPrice()) }}</span>
            </div>
            <button class="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600" (click)="submitOrder()">
              Place Order
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class CustomerMenuComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly menuService = inject(MenuService);
  private readonly orderService = inject(OrderService);

  readonly plusIcon = Plus;
  readonly cartIcon = ShoppingCart;

  readonly menuItems = signal<MenuItem[]>([]);
  readonly cart = signal<CartItem[]>([]);

  readonly orderId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly accessToken = this.route.snapshot.queryParamMap.get('token') ?? '';

  readonly grouped = computed(() => {
    const map = new Map<string, MenuItem[]>();
    this.menuItems()
      .filter((i) => i.available)
      .forEach((item) => {
        map.set(item.category, [...(map.get(item.category) ?? []), item]);
      });
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  });

  readonly totalItems = computed(() => this.cart().reduce((sum, c) => sum + c.quantity, 0));
  readonly totalPrice = computed(() => this.cart().reduce((sum, c) => sum + c.price * c.quantity, 0));

  constructor() {
    this.menuService.getMenuItems(this.orderId).subscribe((items) => this.menuItems.set(items));
  }

  money(value: number): string {
    return formatCurrency(value);
  }

  addToCart(item: MenuItem): void {
    const current = this.cart();
    const existing = current.find((c) => c.id === item.id);
    if (existing) {
      this.cart.set(current.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      this.cart.set([...current, { id: item.id, name: item.name, price: item.price, quantity: 1 }]);
    }
    toast.success(item.name + ' added');
  }

  async submitOrder(): Promise<void> {
    if (!this.orderId || !this.cart().length) return;
    try {
      const order = await firstValueFrom(this.orderService.getOrder(this.orderId, this.accessToken));
      if (!order) { toast.error('Order not found'); return; }
      const items: OrderItem[] = this.cart().map(({ name, price, quantity }) => ({ name, price, quantity }));
      await this.orderService.appendItems(order, items, this.accessToken);
      toast.success('Items added to order');
      this.cart.set([]);
      this.router.navigate(['/c', this.orderId], { queryParams: { token: this.accessToken } });
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to add items');
    }
  }
}
