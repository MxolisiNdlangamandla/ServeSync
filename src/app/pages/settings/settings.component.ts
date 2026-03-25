import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, Save, Trash2, Plus, ChartColumnIncreasing, Users, UtensilsCrossed, Pencil, Settings2, Building2 } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { toast } from 'ngx-sonner';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SubscriptionTier } from '../../core/models/profile.model';
import { Store } from '../../core/models/store.model';
import { StoreService } from '../../core/services/store.service';
import { StaffManagerComponent } from '../staff-manager/staff-manager.component';
import { environment } from '../../../environments/environment';

interface Category {
  id: string;
  name: string;
  is_global?: boolean;
  store_id?: string | null;
  store_name?: string | null;
  assigned_store_ids?: string[];
}

type AdminTab = 'settings' | 'team';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, LucideAngularModule, RouterLink, StaffManagerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <section class="rounded-2xl border border-slate-200 bg-white p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Admin Workspace</p>
            <h1 class="mt-2 text-3xl font-black text-primary">Settings and Team Controls</h1>
            <p class="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              Open business settings, enterprise store controls, and team access from one place without losing the original settings workflow.
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <button type="button"
                class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                [class]="activeTab() === 'settings' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                (click)="activeTab.set('settings')">
                <lucide-angular [img]="settingsIcon" class="h-4 w-4"></lucide-angular>
                Settings
              </button>
              <button type="button"
                class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                [class]="activeTab() === 'team' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                (click)="activeTab.set('team')">
                <lucide-angular [img]="usersIcon" class="h-4 w-4"></lucide-angular>
                Admin Team
              </button>
            </div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 lg:min-w-[280px]">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Admin Focus</p>
            <div class="mt-3 flex items-center justify-between gap-3">
              <div>
                <p class="text-xl font-black text-primary">{{ activeTab() === 'settings' ? 'Business Settings' : 'Admin Team' }}</p>
                <p class="mt-1 text-sm text-slate-500">{{ activeTab() === 'settings' ? 'Profile, stores, categories, and package controls.' : 'Roles, invites, and team access management.' }}</p>
              </div>
              <span class="rounded-full px-3 py-1 text-xs font-bold" [class]="currentPlanBadgeClass()">
                Live
              </span>
            </div>
          </div>
        </div>
      </section>

      @if (activeTab() === 'settings') {
        <section class="rounded-xl border border-slate-200 bg-white p-5">
          <h2 class="mb-4 text-lg font-semibold text-slate-800">Business Settings</h2>
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
                <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="fullName" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Store Name</label>
                <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="storeName" />
              </div>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-500" [value]="auth.profile()?.email" disabled />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Role</label>
                <input class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm capitalize text-slate-500" [value]="auth.profile()?.role" disabled />
              </div>
            </div>
            <button type="submit" [disabled]="profileForm.pristine || profileForm.invalid" class="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50">
              <lucide-angular [img]="saveIcon" class="h-4 w-4"></lucide-angular>
              Save Changes
            </button>
          </form>
        </section>

        @if (canManageStores()) {
          <section class="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Store Network</p>
                <h2 class="mt-2 text-2xl font-black text-primary">Add and manage enterprise stores</h2>
                <p class="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                  Add branches, edit business details, and let projected billing update automatically based on active sites.
                </p>
              </div>
            </div>

            <div class="grid gap-3 md:grid-cols-3">
              <article class="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Active Sites</p>
                <p class="mt-2 text-2xl font-black text-primary">{{ enterpriseBilling().activeStoreCount }}</p>
              </article>
              <article class="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Rate Per Site</p>
                <p class="mt-2 text-2xl font-black text-primary">{{ money(enterpriseBilling().monthlyRate) }}</p>
              </article>
              <article class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Projected Next Billing</p>
                <p class="mt-2 text-2xl font-black text-emerald-700">{{ money(enterpriseBilling().projectedMonthlyTotal) }}</p>
              </article>
            </div>

            <form [formGroup]="storeForm" (ngSubmit)="addStore()" class="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 lg:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Store Name</label>
                <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="name" placeholder="e.g. ServeSync Sandton" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="contactPhone" placeholder="e.g. +27 10 555 1000" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Address</label>
                <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="addressLine1" placeholder="Street address" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">City</label>
                <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="city" placeholder="City / area" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Billing Status</label>
                <select class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="status">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div class="flex items-end">
                <button type="submit" class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50" [disabled]="storeForm.invalid">
                  <lucide-angular [img]="plusIcon" class="h-4 w-4"></lucide-angular>
                  Add Store
                </button>
              </div>
            </form>

            <div class="grid gap-3 lg:grid-cols-2">
              @for (store of stores(); track store.id) {
                <article class="rounded-2xl border border-slate-200 bg-white p-4">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="flex flex-wrap items-center gap-2">
                        <h3 class="text-lg font-black text-primary">{{ store.name }}</h3>
                        @if (store.is_primary) {
                          <span class="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">Primary</span>
                        }
                        <span class="rounded-full px-2.5 py-1 text-[11px] font-bold" [class]="store.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">
                          {{ store.status === 'active' ? 'Billing active' : 'Billing paused' }}
                        </span>
                      </div>
                      <p class="mt-2 text-sm text-slate-500">{{ store.address_line1 || 'Address not added yet' }}</p>
                      <p class="mt-1 text-sm text-slate-500">{{ store.city || 'City not added yet' }}</p>
                      <p class="mt-1 text-sm text-slate-500">{{ store.contact_phone || 'Phone not added yet' }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <button type="button" class="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-primary/30 hover:text-primary" (click)="editStore(store)">
                        <lucide-angular [img]="pencilIcon" class="h-4 w-4"></lucide-angular>
                      </button>
                      @if (!store.is_primary) {
                        <button type="button" class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-primary/30 hover:text-primary" (click)="toggleStoreStatus(store)">
                          {{ store.status === 'active' ? 'Pause billing' : 'Resume billing' }}
                        </button>
                      }
                    </div>
                  </div>
                </article>
              }
            </div>

            @if (editingStore(); as store) {
              <div class="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
                <div class="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Edit Store</p>
                      <h3 class="mt-2 text-2xl font-black text-primary">{{ store.name }}</h3>
                      <p class="mt-2 text-sm text-slate-500">Update branch details and billing status without leaving Admin.</p>
                    </div>
                    <button type="button" class="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700" (click)="editingStore.set(null)">
                      Close
                    </button>
                  </div>

                  <form [formGroup]="editStoreForm" (ngSubmit)="saveStoreEdit()" class="mt-5 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label class="mb-1 block text-sm font-medium text-slate-700">Store Name</label>
                      <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="name" />
                    </div>
                    <div>
                      <label class="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                      <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="contactPhone" />
                    </div>
                    <div>
                      <label class="mb-1 block text-sm font-medium text-slate-700">Address</label>
                      <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="addressLine1" />
                    </div>
                    <div>
                      <label class="mb-1 block text-sm font-medium text-slate-700">City</label>
                      <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="city" />
                    </div>
                    <div>
                      <label class="mb-1 block text-sm font-medium text-slate-700">Billing Status</label>
                      <select class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="status">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div class="flex items-end justify-end gap-2 sm:col-span-2">
                      <button type="button" class="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800" (click)="editingStore.set(null)">
                        Cancel
                      </button>
                      <button type="submit" class="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90" [disabled]="editStoreForm.invalid">
                        Save Store
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            }
          </section>
        }

        <section class="rounded-xl border border-slate-200 bg-white p-5">
          <h2 class="mb-4 text-lg font-semibold text-slate-800">Menu Categories</h2>
          <p class="mb-4 text-sm text-slate-500">New categories default to all sites. Switch to selected sites only when you need a category limited to specific locations.</p>
          <form [formGroup]="categoryForm" (ngSubmit)="addCategory()" class="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div class="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Category Name</label>
                <input class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-accent focus:outline-none" formControlName="name" placeholder="e.g. Drinks" />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Assigned Site</label>
                <select class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none" formControlName="assignmentMode" (change)="syncCategoryDefaults()">
                  <option value="all">All sites</option>
                  <option value="selected">Selected sites</option>
                </select>
              </div>
            </div>

            @if (categoryForm.controls.assignmentMode.value === 'selected') {
              <div class="rounded-xl border border-slate-200 bg-white p-4">
                <div class="mb-3 flex items-center gap-2">
                  <lucide-angular [img]="buildingIcon" class="h-4 w-4 text-primary"></lucide-angular>
                  <p class="text-sm font-semibold text-slate-700">Select which sites should see this category</p>
                </div>
                <div class="grid gap-2 sm:grid-cols-2">
                  @for (site of categorySites(); track site.id) {
                    <label class="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                      <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" [checked]="selectedCategoryStoreIds().includes(site.id)" (change)="toggleCategorySite(site.id, $event)" />
                      <span>{{ site.name }}</span>
                    </label>
                  }
                </div>
              </div>
            }

            <div class="flex justify-end">
              <button type="submit" class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50" [disabled]="categoryForm.invalid || categorySelectionInvalid()">
                <lucide-angular [img]="plusIcon" class="h-4 w-4"></lucide-angular>
                Add Category
              </button>
            </div>
          </form>

          @if (categories().length) {
            <ul class="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
              @for (cat of categories(); track cat.id) {
                <li class="flex items-center justify-between gap-4 px-4 py-3">
                  <div>
                    <span class="text-sm font-medium text-slate-700">{{ cat.name }}</span>
                    <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      @if (cat.is_global) {
                        <span class="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">All sites</span>
                      } @else {
                        @for (siteName of categorySiteNames(cat); track siteName) {
                          <span class="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">{{ siteName }}</span>
                        }
                      }
                    </div>
                  </div>
                  <button (click)="deleteCategory(cat)" class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500">
                    <lucide-angular [img]="trashIcon" class="h-4 w-4"></lucide-angular>
                  </button>
                </li>
              }
            </ul>
          } @else {
            <p class="mt-4 text-sm text-slate-400">No categories yet. Add one above.</p>
          }
        </section>
      } @else {
        <section class="rounded-xl border border-slate-200 bg-white p-5">
          <app-staff-manager />
        </section>
      }

      <section class="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Plan Access</p>
            <h2 class="mt-2 text-2xl font-black text-primary">Everything about your package stays here</h2>
            <p class="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              Review what your current plan unlocks, compare the full ladder, and change your subscription from inside ServeSync without leaving the app.
            </p>
          </div>
          <button type="button" class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            (click)="togglePlans()">
            {{ showPlans() ? 'Hide Upgrade Options' : 'Upgrade From Here' }}
          </button>
        </div>

        @if (showPlans()) {
          <div class="grid gap-3 lg:grid-cols-4">
            @for (plan of plans; track plan.id) {
              <button type="button"
                class="rounded-xl border p-4 text-left transition-colors"
                [class]="selectedPlan() === plan.id
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : currentPlanId() === plan.id
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-primary/40'"
                (click)="selectedPlan.set(plan.id)">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-bold text-primary">{{ plan.name }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ plan.price }}</p>
                  </div>
                  @if (currentPlanId() === plan.id) {
                    <span class="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">Current</span>
                  } @else if (selectedPlan() === plan.id) {
                    <span class="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary">Selected</span>
                  }
                </div>
                <p class="mt-3 text-sm text-slate-600">{{ plan.description }}</p>
              </button>
            }
          </div>

          <div class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-slate-600">
              {{ selectedPlan() === currentPlanId() ? 'Your current subscription is already selected.' : 'Confirm the selected plan to update your subscription without leaving the app.' }}
            </p>
            <button type="button"
              class="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
              [disabled]="selectedPlan() === currentPlanId() || savingPlan()"
              (click)="confirmPlan()">
              {{ savingPlan() ? 'Updating...' : 'Confirm Subscription' }}
            </button>
          </div>
        }

        <div class="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)]">
          <article class="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Current Plan</p>
                <h3 class="mt-2 text-2xl font-black text-primary">{{ planAccess().name }}</h3>
              </div>
              <span class="rounded-full px-3 py-1 text-xs font-bold" [class]="planAccess().badgeClass">
                {{ planAccess().badge }}
              </span>
            </div>
            <p class="mt-3 text-sm leading-7 text-slate-600">{{ planAccess().summary }}</p>

            <div class="mt-5 grid gap-3 sm:grid-cols-2">
              @for (item of planHighlights(); track item.label) {
                <article class="rounded-xl border border-slate-200 bg-white p-4">
                  <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{{ item.label }}</p>
                  <p class="mt-2 text-lg font-black text-primary">{{ item.value }}</p>
                  <p class="mt-1 text-sm leading-6 text-slate-500">{{ item.note }}</p>
                </article>
              }
            </div>

            <div class="mt-5 grid gap-4 md:grid-cols-2">
              <div class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Available Now</p>
                <ul class="mt-3 space-y-2 text-sm text-slate-700">
                  @for (item of planAccess().available; track item) {
                    <li class="flex gap-2">
                      <span class="text-emerald-600">&#10003;</span>
                      <span>{{ item }}</span>
                    </li>
                  }
                </ul>
              </div>
              <div class="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Needs Upgrade</p>
                <ul class="mt-3 space-y-2 text-sm text-slate-700">
                  @for (item of planAccess().locked; track item) {
                    <li class="flex gap-2">
                      <span class="text-amber-600">&#10005;</span>
                      <span>{{ item }}</span>
                    </li>
                  }
                </ul>
              </div>
            </div>
          </article>

          <article class="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Admin Shortcuts</p>
                <h3 class="mt-2 text-2xl font-black text-primary">Manage the business from Admin</h3>
              </div>
              <p class="text-sm text-slate-500">Jump into the operational areas linked to your current package.</p>
            </div>

            <div class="mt-5 grid gap-3 md:grid-cols-2">
              @for (item of adminLinks; track item.path) {
                <a [routerLink]="item.path" class="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-primary/30 hover:bg-primary/5">
                  <div class="flex items-start gap-3">
                    <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-primary shadow-sm">
                      <lucide-angular [img]="item.icon" class="h-5 w-5"></lucide-angular>
                    </span>
                    <div>
                      <p class="text-sm font-black text-primary">{{ item.label }}</p>
                      <p class="mt-1 text-sm leading-6 text-slate-500">{{ item.text }}</p>
                    </div>
                  </div>
                </a>
              }
            </div>
          </article>
        </div>

        <article class="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Pricing Ladder</p>
              <h3 class="mt-2 text-2xl font-black text-primary">How the plans step up</h3>
            </div>
            <p class="text-sm text-slate-500">Keep the package differences visible here while the main dashboard stays focused on service.</p>
          </div>

          <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            @for (plan of dashboardPlans(); track plan.id) {
              <article class="rounded-xl border p-4"
                [class]="plan.state === 'current'
                  ? 'border-primary bg-primary/5'
                  : plan.state === 'available'
                      ? 'border-emerald-200 bg-emerald-50/60'
                      : 'border-slate-200 bg-white'">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h4 class="text-sm font-black text-primary">{{ plan.name }}</h4>
                    <p class="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{{ plan.price }}</p>
                  </div>
                  <span class="rounded-full px-2.5 py-1 text-[11px] font-bold"
                    [class]="plan.state === 'current'
                      ? 'bg-primary text-white'
                      : plan.state === 'available'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'">{{ plan.badge }}</span>
                </div>
                <p class="mt-3 text-sm leading-6 text-slate-600">{{ plan.summary }}</p>
                <ul class="mt-3 space-y-2 text-xs leading-6 text-slate-600">
                  @for (feature of plan.features; track feature) {
                    <li class="flex gap-2">
                      <span class="text-accent">•</span>
                      <span>{{ feature }}</span>
                    </li>
                  }
                </ul>
              </article>
            }
          </div>
        </article>
      </section>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly storeService = inject(StoreService);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly api = environment.apiUrl;

  readonly saveIcon = Save;
  readonly trashIcon = Trash2;
  readonly plusIcon = Plus;
  readonly pencilIcon = Pencil;
  readonly settingsIcon = Settings2;
  readonly usersIcon = Users;
  readonly buildingIcon = Building2;
  readonly currentTier = computed(() => this.auth.profile()?.subscription_tier ?? 'tier1');
  readonly canManageStores = this.storeService.canManageStores;
  readonly stores = this.storeService.stores;
  readonly enterpriseBilling = this.storeService.billing;
  readonly adminLinks = [
    { path: '/overview', label: 'Overview', text: 'Track active revenue, completed totals, and service pressure.', icon: ChartColumnIncreasing },
    { path: '/menu', label: 'Menu Manager', text: 'Build menu items once categories are ready for assignment.', icon: UtensilsCrossed },
    { path: '/admin', label: 'Admin Controls', text: 'Manage team access, categories, stores, and subscription controls.', icon: Users },
  ] as const;
  readonly activeTab = signal<AdminTab>('settings');
  readonly editingStore = signal<Store | null>(null);
  readonly selectedCategoryStoreIds = signal<string[]>([]);

  readonly categories = signal<Category[]>([]);
  readonly siteOptions = this.storeService.siteOptions;
  readonly selectedStoreId = this.storeService.selectedStoreId;
  readonly canManageGlobalCategories = computed(() => this.auth.profile()?.role === 'admin' && this.storeService.isEnterprise());
  readonly categorySites = computed(() => this.storeService.stores().length ? this.storeService.stores() : this.siteOptions().filter((site) => site.id !== 'all'));
  readonly showPlans = signal(false);
  readonly savingPlan = signal(false);
  readonly selectedPlan = signal<SubscriptionTier>('tier1');
  readonly plans: ReadonlyArray<{ id: SubscriptionTier; name: string; price: string; description: string }> = [
    {
      id: 'tier1',
      name: 'Starter',
      price: 'Free',
      description: 'Core live service flow for one location with manual custom items.'
    },
    {
      id: 'tier3',
      name: 'Essentials',
      price: 'R259 / month',
      description: 'Saved menu items and faster repeat ordering for smaller menu-based businesses.'
    },
    {
      id: 'tier2',
      name: 'Professional',
      price: 'R499 / month',
      description: 'Unlock saved menu items, payments, and stronger reporting for one store.'
    },
    {
      id: 'tier4',
      name: 'Enterprise',
      price: 'From R450 / shop / month',
      description: 'Add multi-location oversight, centralized management, and priority support.'
    }
  ];

  readonly profileForm = this.fb.nonNullable.group({
    fullName: [''],
    storeName: ['']
  });

  readonly storeForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    addressLine1: [''],
    city: [''],
    contactPhone: [''],
    status: ['active' as 'active' | 'inactive'],
  });

  readonly categoryForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    assignmentMode: ['all' as 'all' | 'selected']
  });

  readonly editStoreForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    addressLine1: [''],
    city: [''],
    contactPhone: [''],
    status: ['active' as 'active' | 'inactive'],
  });

  readonly categorySelectionInvalid = computed(() => this.categoryForm.controls.assignmentMode.value === 'selected' && this.selectedCategoryStoreIds().length === 0);

  readonly planAccess = computed(() => {
    switch (this.currentTier()) {
      case 'tier2':
        return {
          name: 'Professional',
          badge: 'Live now',
          badgeClass: 'bg-emerald-100 text-emerald-700',
          summary: 'Professional gives you stronger day-to-day control for one store with menu management, payments, and deeper operational visibility.',
          available: [
            'Saved menu items and faster repeat order entry',
            'Online payments',
            'Advanced analytics and staff reporting',
            'Up to 12 staff accounts',
          ],
          locked: [
            'Multi-location management',
            'Central branch oversight',
            'Priority enterprise onboarding',
          ],
        };
      case 'tier3':
        return {
          name: 'Essentials',
          badge: 'Current plan',
          badgeClass: 'bg-sky-100 text-sky-700',
          summary: 'Essentials gives smaller menu-based businesses saved menu items and faster repeat ordering without jumping into the heavier Professional plan.',
          available: [
            'Saved menu items',
            'Faster repeat order entry',
            'Single-store menu workflow',
            'Everything in Starter',
          ],
          locked: [
            'Online payments',
            'Advanced analytics',
            'Multi-location management',
          ],
        };
      case 'tier4':
        return {
          name: 'Enterprise',
          badge: 'Highest live plan',
          badgeClass: 'bg-primary text-white',
          summary: 'Enterprise is built for operators scaling across locations and needing stronger branch-level visibility and support.',
          available: [
            'Everything in Professional',
            'Multiple shops and locations',
            'Centralized management across stores',
            'Priority support and onboarding',
          ],
          locked: ['Dedicated enterprise implementation extras can still be customized per client'],
        };
      default:
        return {
          name: 'Starter',
          badge: 'Current plan',
          badgeClass: 'bg-amber-100 text-amber-700',
          summary: 'Starter gives you the core live service flow for one location, with clear upgrade paths as the business needs more structure.',
          available: [
            'Live order dashboard',
            'Customer requests and bill calls',
            'Manual custom-item order entry',
            'Up to 3 staff accounts',
          ],
          locked: [
            'Saved menu items',
            'Online payments',
            'Advanced analytics',
            'Multi-location management',
          ],
        };
    }
  });

  readonly planHighlights = computed(() => {
    switch (this.currentTier()) {
      case 'tier3':
        return [
          { label: 'Locations', value: '1 store', note: 'Built for a single location getting more structured.' },
          { label: 'Menu Workflow', value: 'Saved items', note: 'Menu items can be reused to speed up repeat orders.' },
          { label: 'Payments', value: 'Not included', note: 'Keep service flow clean before moving to payment features.' },
          { label: 'Reporting', value: 'Basic visibility', note: 'You can see floor flow without the deeper analytics tools.' },
        ];
      case 'tier2':
        return [
          { label: 'Locations', value: '1 store', note: 'Optimized for a growing single-site operation.' },
          { label: 'Menu Workflow', value: 'Full menu', note: 'Saved items and faster repeat ordering for the floor team.' },
          { label: 'Payments', value: 'Enabled', note: 'Online payment steps are available inside the service flow.' },
          { label: 'Reporting', value: 'Advanced', note: 'Unlock stronger analytics and operational insight.' },
        ];
      case 'tier4':
        return [
          { label: 'Locations', value: 'Multi-store', note: 'Run more than one branch with central oversight.' },
          { label: 'Menu Workflow', value: 'Shared control', note: 'Coordinate menu and service rules across locations.' },
          { label: 'Payments', value: 'Enabled', note: 'Keep payment flow available across the estate.' },
          { label: 'Support', value: 'Priority', note: 'Enterprise onboarding and support stay closer to your rollout.' },
        ];
      default:
        return [
          { label: 'Locations', value: '1 store', note: 'A single-location setup focused on the core service flow.' },
          { label: 'Menu Workflow', value: 'Manual items', note: 'Orders can be created manually without saved menu items.' },
          { label: 'Payments', value: 'Locked', note: 'Upgrade when you need payment collection in the flow.' },
          { label: 'Reporting', value: 'Core dashboard', note: 'You keep live floor visibility without advanced analytics.' },
        ];
    }
  });

  readonly dashboardPlans = computed(() => {
    const tier = this.currentTier();
    const rank = this.planRank(tier);
    return [
      {
        id: 'tier1',
        name: 'Starter',
        price: 'Free',
        badge: tier === 'tier1' ? 'Current' : rank > this.planRank('tier1') ? 'Included below you' : 'Available now',
        state: tier === 'tier1' ? 'current' : rank > this.planRank('tier1') ? 'lower' : 'available',
        summary: 'For single-location teams that need the basic live service flow.',
        features: ['1 location', 'Manual custom items', 'Core order and request handling'],
      },
      {
        id: 'tier3',
        name: 'Essentials',
        price: 'R259 / month',
        badge: tier === 'tier3' ? 'Current' : rank > this.planRank('tier3') ? 'Included below you' : 'Available now',
        state: tier === 'tier3' ? 'current' : rank > this.planRank('tier3') ? 'lower' : 'available',
        summary: 'For smaller menu-based businesses that need saved items and faster repeat ordering.',
        features: ['Saved menu items', 'Repeat order speed', 'Single-store workflow'],
      },
      {
        id: 'tier2',
        name: 'Professional',
        price: 'R499 / month',
        badge: tier === 'tier2' ? 'Current' : rank > this.planRank('tier2') ? 'Included below you' : 'Available now',
        state: tier === 'tier2' ? 'current' : rank > this.planRank('tier2') ? 'lower' : 'available',
        summary: 'For growing single-store teams that need tighter floor control and reporting.',
        features: ['Saved menus', 'Payments', 'Advanced analytics'],
      },
      {
        id: 'tier4',
        name: 'Enterprise',
        price: 'From R450 / shop / month',
        badge: tier === 'tier4' ? 'Current' : 'Available now',
        state: tier === 'tier4' ? 'current' : 'available',
        summary: 'For operators running multiple branches and needing central oversight.',
        features: ['Multiple locations', 'Central branch oversight', 'Priority support'],
      },
    ] as const;
  });

  currentPlanId(): SubscriptionTier {
    return this.auth.profile()?.subscription_tier ?? 'tier1';
  }

  currentPlanLabel(): string {
    switch (this.auth.profile()?.subscription_tier) {
      case 'tier3':
        return 'Essentials';
      case 'tier2':
        return 'Professional';
      case 'tier4':
        return 'Enterprise';
      default:
        return 'Starter';
    }
  }

  currentPlanDescription(): string {
    switch (this.auth.profile()?.subscription_tier) {
      case 'tier3':
        return 'Saved menu items and faster repeat ordering enabled';
      case 'tier2':
        return 'Menu management, payments, and advanced reporting enabled';
      case 'tier4':
        return 'Multi-location oversight and enterprise support enabled';
      default:
        return 'Core live service flow with manual custom items';
    }
  }

  currentPlanBadgeClass(): string {
    switch (this.auth.profile()?.subscription_tier) {
      case 'tier3':
        return 'bg-sky-100 text-sky-700';
      case 'tier2':
        return 'bg-emerald-100 text-emerald-700';
      case 'tier4':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  }

  planRank(tier: SubscriptionTier): number {
    switch (tier) {
      case 'tier3':
        return 1;
      case 'tier2':
        return 2;
      case 'tier4':
        return 3;
      default:
        return 0;
    }
  }

  ngOnInit(): void {
    const p = this.auth.profile();
    if (p) {
      this.profileForm.patchValue({ fullName: p.full_name || '', storeName: p.store_name || '' });
      this.selectedPlan.set(p.subscription_tier);
    }
    this.syncCategoryDefaults();
    this.loadCategories();
    this.loadStores();
  }

  togglePlans(): void {
    this.selectedPlan.set(this.currentPlanId());
    this.showPlans.update((visible) => !visible);
  }

  async confirmPlan(): Promise<void> {
    if (this.selectedPlan() === this.currentPlanId()) {
      return;
    }

    this.savingPlan.set(true);
    try {
      await this.auth.updateProfile({ subscription_tier: this.selectedPlan() });
      await this.loadStores();
      this.showPlans.set(false);
      toast.success('Subscription updated');
    } catch {
      toast.error('Failed to update subscription');
    } finally {
      this.savingPlan.set(false);
    }
  }

  async saveProfile(): Promise<void> {
    const { fullName, storeName } = this.profileForm.getRawValue();
    try {
      await this.auth.updateProfile({ full_name: fullName, store_name: storeName });
      this.profileForm.markAsPristine();
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
  }

  money(value: number): string {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value);
  }

  async addStore(): Promise<void> {
    if (this.storeForm.invalid) {
      this.storeForm.markAllAsTouched();
      return;
    }

    try {
      const value = this.storeForm.getRawValue();
      await this.storeService.createStore({
        name: value.name,
        address_line1: value.addressLine1,
        city: value.city,
        contact_phone: value.contactPhone,
        status: value.status,
      });
      this.storeForm.reset({ name: '', addressLine1: '', city: '', contactPhone: '', status: 'active' });
      toast.success('Store added');
    } catch {
      toast.error('Failed to add store');
    }
  }

  async toggleStoreStatus(store: Store): Promise<void> {
    try {
      await this.storeService.updateStore(store.id, { status: store.status === 'active' ? 'inactive' : 'active' });
      toast.success(store.status === 'active' ? 'Store billing paused' : 'Store billing resumed');
    } catch {
      toast.error('Failed to update store status');
    }
  }

  private async loadCategories(): Promise<void> {
    try {
      const storeId = this.canManageGlobalCategories() ? 'all' : this.selectedStoreId() !== 'all' ? this.selectedStoreId() : undefined;
      const cats = await firstValueFrom(this.http.get<Category[]>(`${this.api}/categories`, { params: storeId ? { storeId } : undefined }));
      this.categories.set(cats);
    } catch { /* ignore */ }
  }

  private async loadStores(): Promise<void> {
    try {
      await this.storeService.loadStores();
      this.syncCategoryDefaults();
    } catch {
      // Ignore store loading failures for non-enterprise accounts.
    }
  }

  syncCategoryDefaults(): void {
    if (this.categoryForm.controls.assignmentMode.value === 'all') {
      this.selectedCategoryStoreIds.set([]);
      return;
    }

    const availableSites = this.categorySites().map((site) => site.id);
    const current = this.selectedCategoryStoreIds().filter((storeId) => availableSites.includes(storeId));
    if (current.length) {
      this.selectedCategoryStoreIds.set(current);
      return;
    }

    const selectedStoreId = this.selectedStoreId();
    const fallbackStoreId = selectedStoreId !== 'all' ? selectedStoreId : availableSites[0];
    this.selectedCategoryStoreIds.set(fallbackStoreId ? [fallbackStoreId] : []);
  }

  async addCategory(): Promise<void> {
    const { name, assignmentMode } = this.categoryForm.getRawValue();
    if (!name.trim()) return;

    try {
      const payload = {
        name: name.trim(),
        isGlobal: assignmentMode === 'all',
        assignedStoreIds: assignmentMode === 'selected' ? this.selectedCategoryStoreIds() : undefined,
      };
      await firstValueFrom(this.http.post<Category>(`${this.api}/categories`, payload));
      this.categoryForm.reset({ name: '', assignmentMode: 'all' });
      this.selectedCategoryStoreIds.set([]);
      await this.loadCategories();
      toast.success('Category added');
    } catch {
      toast.error('Failed to add category');
    }
  }

  async deleteCategory(cat: Category): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.api}/categories/${cat.id}`));
      this.categories.update(cats => cats.filter(c => c.id !== cat.id));
      toast.success('Category removed');
    } catch {
      toast.error('Failed to remove category');
    }
  }

  editStore(store: Store): void {
    this.editingStore.set(store);
    this.editStoreForm.reset({
      name: store.name,
      addressLine1: store.address_line1 ?? '',
      city: store.city ?? '',
      contactPhone: store.contact_phone ?? '',
      status: store.status,
    });
  }

  async saveStoreEdit(): Promise<void> {
    const store = this.editingStore();
    if (!store || this.editStoreForm.invalid) {
      return;
    }

    try {
      const value = this.editStoreForm.getRawValue();
      await this.storeService.updateStore(store.id, {
        name: value.name,
        address_line1: value.addressLine1,
        city: value.city,
        contact_phone: value.contactPhone,
        status: value.status,
      });
      this.editingStore.set(null);
      toast.success('Store updated');
    } catch {
      toast.error('Failed to update store');
    }
  }

  toggleCategorySite(storeId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedCategoryStoreIds.update((current) => {
      if (checked) {
        return current.includes(storeId) ? current : [...current, storeId];
      }
      return current.filter((id) => id !== storeId);
    });
  }

  categorySiteNames(category: Category): string[] {
    const assignedIds = category.assigned_store_ids ?? (category.store_id ? [category.store_id] : []);
    return assignedIds
      .map((storeId) => this.categorySites().find((site) => site.id === storeId)?.name)
      .filter((name): name is string => Boolean(name));
  }
}
