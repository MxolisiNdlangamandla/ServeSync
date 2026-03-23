import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { toast } from 'ngx-sonner';
import { LucideAngularModule, Plus, Pencil, Trash2, X } from 'lucide-angular';
import { MenuItem } from '../../core/models/menu-item.model';
import { AuthService } from '../../core/services/auth.service';
import { MenuService } from '../../core/services/menu.service';
import { formatCurrency } from '../../core/utils/formatters';
import { environment } from '../../../environments/environment';

interface CategoryRecord {
  id: string;
  name: string;
}

@Component({
  selector: 'app-menu-manager',
  imports: [ReactiveFormsModule, LucideAngularModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-5">
      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-black text-primary">Menu</h1>
          <p class="text-sm text-slate-500">{{ items().length }} items</p>
        </div>
        <button class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white"
          [class]="menuLocked() ? 'cursor-not-allowed bg-slate-300' : 'bg-accent hover:bg-orange-600'"
          [disabled]="menuLocked()"
          (click)="adding.set(true)">
          <lucide-angular [img]="plusIcon" class="h-4 w-4"></lucide-angular>
          Add Item
        </button>
      </header>

      @if (menuLocked()) {
        <section class="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-sm font-bold text-amber-900">Menu management is not available on your current plan</h2>
              <p class="mt-1 text-sm text-amber-800">You are on the Starter plan. Upgrade to Professional or Enterprise to add saved menu items. You can still create orders using manual custom items.</p>
            </div>
            <a routerLink="/settings" class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
              Upgrade Plan
            </a>
          </div>
        </section>
      }

      <!-- Add Modal -->
      @if (adding()) {
        <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" (click)="adding.set(false)">
          <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" (click)="$event.stopPropagation()">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-bold text-primary">Add Menu Item</h3>
              <button class="rounded-lg p-1 hover:bg-slate-100" (click)="adding.set(false)">
                <lucide-angular [img]="xIcon" class="h-5 w-5 text-slate-400"></lucide-angular>
              </button>
            </div>
            <form class="space-y-3" [formGroup]="addForm" (ngSubmit)="create()">
              <div>
                <label class="mb-1 block text-sm font-semibold text-slate-700">Name</label>
                <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-accent focus:outline-none" formControlName="name" placeholder="e.g. Classic Burger" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1 block text-sm font-semibold text-slate-700">Price (R)</label>
                  <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-accent focus:outline-none" formControlName="price" type="number" placeholder="0.00" />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-semibold text-slate-700">Category</label>
                  <select class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="category">
                    <option value="" disabled>Select category</option>
                    @for (cat of categories(); track cat) {
                      <option [value]="cat">{{ cat }}</option>
                    }
                  </select>
                </div>
              </div>
              <div>
                <label class="mb-1 block text-sm font-semibold text-slate-700">Description</label>
                <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-accent focus:outline-none" formControlName="description" placeholder="Short description" />
              </div>
              <button class="w-full rounded-full bg-accent px-4 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-50" [disabled]="addForm.invalid">Add Item</button>
            </form>
          </div>
        </div>
      }

      <!-- Edit Modal -->
      @if (editingId()) {
        <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" (click)="editingId.set('')">
          <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" (click)="$event.stopPropagation()">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-bold text-primary">Edit Menu Item</h3>
              <button class="rounded-lg p-1 hover:bg-slate-100" (click)="editingId.set('')">
                <lucide-angular [img]="xIcon" class="h-5 w-5 text-slate-400"></lucide-angular>
              </button>
            </div>
            <form class="space-y-3" [formGroup]="editForm" (ngSubmit)="saveEdit()">
              <div>
                <label class="mb-1 block text-sm font-semibold text-slate-700">Name</label>
                <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="name" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1 block text-sm font-semibold text-slate-700">Price (R)</label>
                  <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" type="number" formControlName="price" />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-semibold text-slate-700">Category</label>
                  <select class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="category">
                    <option value="" disabled>Select category</option>
                    @for (cat of categories(); track cat) {
                      <option [value]="cat">{{ cat }}</option>
                    }
                  </select>
                </div>
              </div>
              <div>
                <label class="mb-1 block text-sm font-semibold text-slate-700">Description</label>
                <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="description" />
              </div>
              <button class="w-full rounded-full bg-primary px-4 py-3 font-bold text-white disabled:opacity-50" [disabled]="editForm.invalid">Save Changes</button>
            </form>
          </div>
        </div>
      }

      <!-- Menu Items grouped by category -->
      @if (!items().length && !menuLocked()) {
        <section class="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-2xl">🍽️</div>
          <h2 class="text-lg font-bold text-primary">No menu items yet</h2>
          <p class="mx-auto mt-2 max-w-md text-sm text-slate-500">Your menu is still empty. Add your first item to start building the menu your team will use when creating orders.</p>
        </section>
      }

      @for (group of grouped(); track group.category) {
        <section>
          <h2 class="mb-3 text-xs font-bold uppercase tracking-wide text-accent">{{ group.category }}</h2>
          <div class="space-y-3">
            @for (item of group.items; track item.id) {
              <article class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div class="min-w-0 flex-1">
                  <h3 class="font-bold text-primary">{{ item.name }}</h3>
                  <p class="truncate text-xs text-slate-400">{{ item.description }}</p>
                </div>
                <span class="text-sm font-bold text-primary">{{ money(item.price) }}</span>
                <label class="relative inline-flex cursor-pointer">
                  <input type="checkbox" class="peer sr-only" [checked]="item.available" (change)="toggle(item, $event)" />
                  <div class="h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full"></div>
                </label>
                <button class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary" (click)="edit(item)">
                  <lucide-angular [img]="pencilIcon" class="h-4 w-4"></lucide-angular>
                </button>
                <button class="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500" (click)="remove(item.id)">
                  <lucide-angular [img]="trashIcon" class="h-4 w-4"></lucide-angular>
                </button>
              </article>
            }
          </div>
        </section>
      }
    </section>
  `
})
export class MenuManagerComponent {
  private readonly menuService = inject(MenuService);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly api = environment.apiUrl;

  readonly plusIcon = Plus;
  readonly pencilIcon = Pencil;
  readonly trashIcon = Trash2;
  readonly xIcon = X;

  readonly items = signal<MenuItem[]>([]);
  readonly categories = signal<string[]>([]);
  readonly adding = signal(false);
  readonly editingId = signal('');

  readonly addForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    price: [0, Validators.required],
    category: ['', Validators.required],
    description: ['']
  });

  readonly editForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    price: [0, Validators.required],
    category: ['', Validators.required],
    description: ['']
  });

  readonly grouped = computed(() => {
    const map = new Map<string, MenuItem[]>();
    this.items().forEach((item) => {
      map.set(item.category, [...(map.get(item.category) ?? []), item]);
    });
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  });
  readonly menuLocked = computed(() => this.auth.profile()?.subscription_tier === 'tier1');

  constructor() {
    this.load();
  }

  load(): void {
    this.menuService.getMenuItems().subscribe((rows) => {
      this.items.set(rows);
      // Derive categories from existing items + stored categories
      const fromItems = [...new Set(rows.map((r) => r.category))];
      this.http.get<CategoryRecord[]>(`${this.api}/categories`).subscribe({
        next: (stored) => {
          const storedNames = stored.map((category) => category.name);
          const merged = [...new Set([...storedNames, ...fromItems])].sort();
          this.categories.set(merged);
        },
        error: () => this.categories.set(fromItems.sort())
      });
    });
  }

  money(value: number): string {
    return formatCurrency(value);
  }

  create(): void {
    if (this.menuLocked()) {
      toast.error('Upgrade to Professional or Enterprise to manage menu items');
      return;
    }

    this.menuService.createMenuItem(this.addForm.getRawValue()).then(() => {
      toast.success('Menu item added');
      this.addForm.reset({ name: '', price: 0, category: '', description: '' });
      this.adding.set(false);
      this.load();
    }).catch((err: any) => toast.error(err.error?.error ?? 'Failed to add menu item'));
  }

  toggle(item: MenuItem, event: Event): void {
    if (this.menuLocked()) {
      toast.error('Upgrade to Professional or Enterprise to manage menu items');
      return;
    }

    const checked = (event.target as HTMLInputElement).checked;
    this.menuService.updateMenuItem(item.id, { available: checked }).then(() => this.load()).catch((err: any) => toast.error(err.error?.error ?? 'Failed to update menu item'));
  }

  edit(item: MenuItem): void {
    if (this.menuLocked()) {
      toast.error('Upgrade to Professional or Enterprise to manage menu items');
      return;
    }

    this.editingId.set(item.id);
    this.editForm.reset({
      name: item.name,
      price: Number(item.price),
      category: item.category,
      description: item.description ?? ''
    });
  }

  saveEdit(): void {
    if (!this.editingId()) return;
    if (this.menuLocked()) {
      toast.error('Upgrade to Professional or Enterprise to manage menu items');
      return;
    }

    this.menuService.updateMenuItem(this.editingId(), this.editForm.getRawValue()).then(() => {
      toast.success('Item updated');
      this.editingId.set('');
      this.load();
    }).catch((err: any) => toast.error(err.error?.error ?? 'Failed to update menu item'));
  }

  remove(id: string): void {
    if (this.menuLocked()) {
      toast.error('Upgrade to Professional or Enterprise to manage menu items');
      return;
    }

    this.menuService.deleteMenuItem(id).then(() => {
      toast.success('Item deleted');
      this.load();
    }).catch((err: any) => toast.error(err.error?.error ?? 'Failed to delete menu item'));
  }
}
