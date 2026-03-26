import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { toast } from 'ngx-sonner';
import { LucideAngularModule, Plus, Pencil, Trash2, X } from 'lucide-angular';
import { MenuItem } from '../../core/models/menu-item.model';
import { AuthService } from '../../core/services/auth.service';
import { MenuService } from '../../core/services/menu.service';
import { StoreService } from '../../core/services/store.service';
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
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-black text-primary">Menu</h1>
          <p class="text-sm text-slate-500">{{ items().length }} items</p>
          @if (tier2MenuMode()) {
            <p class="mt-1 text-xs font-semibold text-slate-500">Tier 2 menu slots: {{ tier2MenuCount() }}/{{ tier2MenuLimit }}</p>
          }
        </div>
        <div class="flex items-center gap-3">
          @if (showSiteFilter()) {
            <div class="min-w-[180px]">
              <label class="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Site View</label>
              <select class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-primary focus:outline-none"
                [value]="selectedStoreId()"
                (change)="selectStore($event)">
                @for (site of siteOptions(); track site.id) {
                  <option [value]="site.id">{{ site.name }}</option>
                }
              </select>
            </div>
          }
          <button class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white"
            [class]="menuLocked() || tier2MenuLimitReached() ? 'cursor-not-allowed bg-slate-300' : 'bg-primary hover:bg-primary/90'"
            [disabled]="menuLocked() || tier2MenuLimitReached()"
            (click)="addingSpecial.set(true)">
            <lucide-angular [img]="plusIcon" class="h-4 w-4"></lucide-angular>
            Create Menu
          </button>
          @if (!tier2MenuMode()) {
            <button class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white"
              [class]="menuLocked() || categoriesRequired() ? 'cursor-not-allowed bg-slate-300' : 'bg-accent hover:bg-orange-600'"
              [disabled]="menuLocked() || categoriesRequired()"
              (click)="adding.set(true)">
              <lucide-angular [img]="plusIcon" class="h-4 w-4"></lucide-angular>
              Add Item
            </button>
          }
        </div>
      </header>

      @if (tier2MenuLimitReached()) {
        <section class="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p class="text-sm font-semibold text-amber-900">Tier 2 menu limit reached (6/6).</p>
          <p class="mt-1 text-sm text-amber-800">Upgrade your plan to add more than six saved menus.</p>
        </section>
      }

      @if (menuLocked()) {
        <section class="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-sm font-bold text-amber-900">Menu management is not available on your current plan</h2>
              <p class="mt-1 text-sm text-amber-800">You are on the Starter plan. Upgrade to Essentials, Professional, or Enterprise to add saved menu items. You can still create orders using manual custom items.</p>
            </div>
            <a routerLink="/admin" class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
              Upgrade Plan
            </a>
          </div>
        </section>
      } @else if (categoriesRequired()) {
        <section class="rounded-xl border border-sky-200 bg-sky-50 px-5 py-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-sm font-bold text-sky-900">Add categories before creating menu items</h2>
              <p class="mt-1 text-sm text-sky-800">Your menu items need a category first. Create at least one category in Admin, then come back to assign items properly.</p>
            </div>
            <a routerLink="/admin" class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
              Manage Categories
            </a>
          </div>
        </section>
      }

      <div class="relative">
        <input class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none"
          placeholder="Search menu items..."
          [value]="searchTerm()"
          (input)="searchTerm.set(inputValue($event))" />
      </div>

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
                @if (!tier2MenuMode()) {
                  <div>
                    <label class="mb-1 block text-sm font-semibold text-slate-700">Category</label>
                    <select class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="category">
                      <option value="" disabled>Select category</option>
                      @for (cat of categories(); track cat) {
                        <option [value]="cat">{{ cat }}</option>
                      }
                    </select>
                  </div>
                }
              </div>
              <div>
                <label class="mb-1 block text-sm font-semibold text-slate-700">Description</label>
                <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-accent focus:outline-none" formControlName="description" placeholder="Short description" />
              </div>
              @if (showSiteFilter()) {
                <div>
                  <label class="mb-1 block text-sm font-semibold text-slate-700">Assign to Sites</label>
                  <div class="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                    @if (assignableSites().length === 0) {
                      <p class="text-xs text-slate-500">No sites available</p>
                    } @else {
                      @for (site of assignableSites(); track site.id) {
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" 
                                 class="rounded border-slate-300"
                                 [checked]="selectedStoreIds().includes(site.id)"
                                 (change)="toggleStore(site.id, $event)" />
                          <span class="text-sm text-slate-700">{{ site.name }}</span>
                        </label>
                      }
                    }
                  </div>
                </div>
              }
              <button class="w-full rounded-full bg-accent px-4 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-50" [disabled]="addForm.invalid">Add Item</button>
            </form>
          </div>
        </div>
      }

      @if (addingSpecial()) {
        <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" (click)="addingSpecial.set(false)">
          <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" (click)="$event.stopPropagation()">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-bold text-primary">Create Menu</h3>
              <button class="rounded-lg p-1 hover:bg-slate-100" (click)="addingSpecial.set(false)">
                <lucide-angular [img]="xIcon" class="h-5 w-5 text-slate-400"></lucide-angular>
              </button>
            </div>
            <form class="space-y-3" [formGroup]="specialForm" (ngSubmit)="createSpecial()">
              <div>
                <label class="mb-1 block text-sm font-semibold text-slate-700">Menu Name</label>
                <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-accent focus:outline-none" formControlName="name" placeholder="e.g. Kota Combo" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-semibold text-slate-700">What's in it?</label>
                <textarea class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-accent focus:outline-none" rows="3" formControlName="items" placeholder="e.g. Atchar, polony, chips, egg"></textarea>
              </div>
              <div>
                <label class="mb-1 block text-sm font-semibold text-slate-700">How to make it (optional)</label>
                <textarea class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-accent focus:outline-none" rows="3" formControlName="method" placeholder="e.g. Toast bread, layer fillings, add sauce"></textarea>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1 block text-sm font-semibold text-slate-700">Selling Price (R)</label>
                  <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-accent focus:outline-none" formControlName="price" type="number" min="0" step="0.01" placeholder="0.00" />
                </div>
              </div>
              @if (showSiteFilter()) {
                <div>
                  <label class="mb-1 block text-sm font-semibold text-slate-700">Assign to Sites</label>
                  <div class="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                    @if (assignableSites().length === 0) {
                      <p class="text-xs text-slate-500">No sites available</p>
                    } @else {
                      @for (site of assignableSites(); track site.id) {
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" 
                                 class="rounded border-slate-300"
                                 [checked]="selectedStoreIds().includes(site.id)"
                                 (change)="toggleStore(site.id, $event)" />
                          <span class="text-sm text-slate-700">{{ site.name }}</span>
                        </label>
                      }
                    }
                  </div>
                </div>
              }
              <button class="w-full rounded-full bg-primary px-4 py-3 font-bold text-white hover:bg-primary/90 disabled:opacity-50" [disabled]="specialForm.invalid">Save Menu</button>
            </form>
          </div>
        </div>
      }

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
                @if (!tier2MenuMode()) {
                  <div>
                    <label class="mb-1 block text-sm font-semibold text-slate-700">Category</label>
                    <select class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="category">
                      <option value="" disabled>Select category</option>
                      @for (cat of categories(); track cat) {
                        <option [value]="cat">{{ cat }}</option>
                      }
                    </select>
                  </div>
                }
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
                  @if (showSiteFilter() && item.assigned_store_name) {
                    <p class="mt-1 text-xs text-slate-400">{{ item.assigned_store_name }}</p>
                  }
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
  private readonly storeService = inject(StoreService);
  private readonly api = environment.apiUrl;

  readonly plusIcon = Plus;
  readonly pencilIcon = Pencil;
  readonly trashIcon = Trash2;
  readonly xIcon = X;
  readonly showSiteFilter = computed(() => this.storeService.isEnterprise());
  readonly selectedStoreId = this.storeService.selectedStoreId;
  readonly siteOptions = this.storeService.siteOptions;
  readonly assignableSites = computed(() => this.storeService.stores());

  readonly items = signal<MenuItem[]>([]);
  readonly categories = signal<string[]>([]);
  readonly searchTerm = signal('');
  readonly adding = signal(false);
  readonly addingSpecial = signal(false);
  readonly editingId = signal('');
  readonly selectedStoreIds = signal<string[]>([]);

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

  readonly specialForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    items: ['', Validators.required],
    method: [''],
    price: [0, Validators.required]
  });

  readonly grouped = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    const map = new Map<string, MenuItem[]>();
    this.items().forEach((item) => {
      if (q && !item.name.toLowerCase().includes(q) && !item.category.toLowerCase().includes(q)) {
        return;
      }
      map.set(item.category, [...(map.get(item.category) ?? []), item]);
    });
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  });
  readonly menuLocked = computed(() => this.auth.profile()?.subscription_tier === 'tier1');
  readonly tier2MenuMode = computed(() => this.auth.profile()?.subscription_tier === 'tier2');
  readonly tier2MenuLimit = 6;
  readonly tier2MenuCount = computed(() => this.items().filter((item) => item.category === 'Menu').length);
  readonly tier2MenuLimitReached = computed(() => this.tier2MenuMode() && this.tier2MenuCount() >= this.tier2MenuLimit);
  readonly categoriesRequired = computed(() => !this.menuLocked() && !this.tier2MenuMode() && this.categories().length === 0);

  constructor() {
    this.storeService.loadStores().catch(() => undefined);
    this.load();
    effect(() => {
      const sites = this.assignableSites();
      if (sites.length > 0 && this.selectedStoreIds().length === 0) {
        this.selectedStoreIds.set(sites.map(s => s.id));
      }
    });
  }

  load(): void {
    const scopedStoreId = this.currentMenuStoreId();

    this.menuService.getMenuItems(undefined, this.showSiteFilter() ? scopedStoreId : undefined).subscribe((rows) => {
      this.items.set(rows);
      const fromItems = [...new Set(rows.map((row) => row.category))];
      const categoryStoreId = this.showSiteFilter() ? (scopedStoreId === 'all' ? this.assignableSites()[0]?.id : scopedStoreId) : undefined;
      this.http.get<CategoryRecord[]>(`${this.api}/categories`, { params: categoryStoreId ? { storeId: categoryStoreId } : undefined }).subscribe({
        next: (stored) => {
          const storedNames = stored.map((category) => category.name);
          const resolved = [...new Set([...storedNames, ...fromItems])].sort();
          this.categories.set(this.tier2MenuMode() ? ['Menu'] : resolved);
        },
        error: () => this.categories.set(this.tier2MenuMode() ? ['Menu'] : fromItems.sort())
      });
    });
  }

  private currentMenuStoreId(): string | undefined {
    const selectedStoreId = this.selectedStoreId();
    if (!this.showSiteFilter()) {
      return undefined;
    }

    if (selectedStoreId && selectedStoreId !== 'all') {
      return selectedStoreId;
    }

    return selectedStoreId === 'all' ? 'all' : this.assignableSites()[0]?.id;
  }

  money(value: number): string {
    return formatCurrency(value);
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  toggleStore(storeId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.selectedStoreIds();
    if (checked && !current.includes(storeId)) {
      this.selectedStoreIds.set([...current, storeId]);
    } else if (!checked && current.includes(storeId)) {
      this.selectedStoreIds.set(current.filter(id => id !== storeId));
    }
  }

  create(): void {
    if (this.menuLocked()) {
      toast.error('Upgrade to Essentials, Professional, or Enterprise to manage menu items');
      return;
    }

    if (this.categoriesRequired()) {
      toast.error('Add categories first before creating menu items');
      return;
    }

    const value = this.addForm.getRawValue();
    const storesToAssign = this.showSiteFilter() ? this.selectedStoreIds() : [this.assignableSites()[0]?.id];
    
    if (!storesToAssign.length) {
      toast.error('Select at least one site');
      return;
    }

    let created = 0;
    const promises = storesToAssign.map(storeId =>
      this.menuService.createMenuItem({
        name: value.name,
        price: value.price,
        category: this.tier2MenuMode() ? 'Menu' : value.category,
        description: value.description,
        storeId: storeId,
      }).then(() => {
        created++;
      })
    );

    Promise.all(promises)
      .then(() => {
        toast.success(`Menu item added to ${created} site${created > 1 ? 's' : ''}`);
        this.addForm.reset({ name: '', price: 0, category: '', description: '' });
        this.adding.set(false);
        this.load();
      })
      .catch((err: any) => toast.error(err.error?.error ?? 'Failed to add menu item'));
  }

  createSpecial(): void {
    if (this.menuLocked()) {
      toast.error('Upgrade to Essentials, Professional, or Enterprise to manage menu items');
      return;
    }

    if (this.tier2MenuLimitReached()) {
      toast.error('Tier 2 allows up to 6 saved menus');
      return;
    }

    const value = this.specialForm.getRawValue();
    const storesToAssign = this.showSiteFilter() ? this.selectedStoreIds() : [this.assignableSites()[0]?.id];
    
    if (!storesToAssign.length) {
      toast.error('Select at least one site');
      return;
    }

    const itemsLine = value.items.trim();
    const methodLine = value.method.trim();
    const descriptionParts = [`Includes: ${itemsLine}`];
    if (methodLine) {
      descriptionParts.push(`Method: ${methodLine}`);
    }

    let created = 0;
    const promises = storesToAssign.map(storeId =>
      this.menuService.createMenuItem({
        name: value.name.trim(),
        price: value.price,
        category: 'Menu',
        description: descriptionParts.join(' | '),
        storeId: storeId,
      }).then(() => {
        created++;
      })
    );

    Promise.all(promises)
      .then(() => {
        toast.success(`Menu saved to ${created} site${created > 1 ? 's' : ''}`);
        this.specialForm.reset({ name: '', items: '', method: '', price: 0 });
        this.addingSpecial.set(false);
        this.load();
      })
      .catch((err: any) => toast.error(err.error?.error ?? 'Failed to create menu'));
  }

  toggle(item: MenuItem, event: Event): void {
    if (this.menuLocked()) {
      toast.error('Upgrade to Essentials, Professional, or Enterprise to manage menu items');
      return;
    }

    const checked = (event.target as HTMLInputElement).checked;
    this.menuService.updateMenuItem(item.id, { available: checked }).then(() => this.load()).catch((err: any) => toast.error(err.error?.error ?? 'Failed to update menu item'));
  }

  edit(item: MenuItem): void {
    if (this.menuLocked()) {
      toast.error('Upgrade to Essentials, Professional, or Enterprise to manage menu items');
      return;
    }

    if (this.categoriesRequired()) {
      toast.error('Add categories first before editing menu items');
      return;
    }

    this.editingId.set(item.id);
    this.editForm.reset({
      name: item.name,
      price: Number(item.price),
      category: this.tier2MenuMode() ? 'Menu' : item.category,
      description: item.description ?? ''
    });
  }

  saveEdit(): void {
    if (!this.editingId()) return;
    if (this.menuLocked()) {
      toast.error('Upgrade to Essentials, Professional, or Enterprise to manage menu items');
      return;
    }

    const value = this.editForm.getRawValue();
    this.menuService.updateMenuItem(this.editingId(), {
      name: value.name,
      price: value.price,
      category: this.tier2MenuMode() ? 'Menu' : value.category,
      description: value.description
    }).then(() => {
      toast.success('Item updated');
      this.editingId.set('');
      this.load();
    }).catch((err: any) => toast.error(err.error?.error ?? 'Failed to update menu item'));
  }

  remove(id: string): void {
    if (this.menuLocked()) {
      toast.error('Upgrade to Essentials, Professional, or Enterprise to manage menu items');
      return;
    }

    this.menuService.deleteMenuItem(id).then(() => {
      toast.success('Item deleted');
      this.load();
    }).catch((err: any) => toast.error(err.error?.error ?? 'Failed to delete menu item'));
  }

  selectStore(event: Event): void {
    this.storeService.setSelectedStore((event.target as HTMLSelectElement).value);
    this.load();
  }
}
