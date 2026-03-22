import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, Save, Trash2, Plus } from 'lucide-angular';
import { toast } from 'ngx-sonner';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { IndustryService } from '../../core/services/industry.service';
import { environment } from '../../../environments/environment';

interface Category {
  id: string;
  name: string;
}

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-primary">Settings</h1>

      <!-- Profile Section -->
      <section class="rounded-xl border border-slate-200 bg-white p-5">
        <h2 class="mb-4 text-lg font-semibold text-slate-800">Profile</h2>
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

      <!-- Categories Section -->
      <section class="rounded-xl border border-slate-200 bg-white p-5">
        <h2 class="mb-4 text-lg font-semibold text-slate-800">Menu Categories</h2>
        <p class="mb-4 text-sm text-slate-500">Manage the categories available in your menu.</p>
        <form (submit)="addCategory($event)" class="mb-4 flex gap-2">
          <input #catInput class="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-accent focus:outline-none" placeholder="New category name" />
          <button type="submit" class="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90">
            <lucide-angular [img]="plusIcon" class="h-4 w-4"></lucide-angular>
            Add
          </button>
        </form>
        @if (categories().length) {
          <ul class="divide-y divide-slate-100 rounded-lg border border-slate-200">
            @for (cat of categories(); track cat.id) {
              <li class="flex items-center justify-between px-4 py-3">
                <span class="text-sm font-medium text-slate-700">{{ cat.name }}</span>
                <button (click)="deleteCategory(cat)" class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500">
                  <lucide-angular [img]="trashIcon" class="h-4 w-4"></lucide-angular>
                </button>
              </li>
            }
          </ul>
        } @else {
          <p class="text-sm text-slate-400">No categories yet. Add one above.</p>
        }
      </section>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly industryService = inject(IndustryService);
  private readonly api = environment.apiUrl;

  readonly saveIcon = Save;
  readonly trashIcon = Trash2;
  readonly plusIcon = Plus;

  readonly categories = signal<Category[]>([]);

  readonly profileForm = this.fb.nonNullable.group({
    fullName: [''],
    storeName: ['']
  });

  ngOnInit(): void {
    const p = this.auth.profile();
    if (p) {
      this.profileForm.patchValue({ fullName: p.full_name || '', storeName: p.store_name || '' });
    }
    this.loadCategories();
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

  private async loadCategories(): Promise<void> {
    try {
      const cats = await firstValueFrom(this.http.get<Category[]>(`${this.api}/categories`));
      this.categories.set(cats);
    } catch { /* ignore */ }
  }

  async addCategory(e: Event): Promise<void> {
    e.preventDefault();
    const input = (e.target as HTMLFormElement).querySelector('input') as HTMLInputElement;
    const name = input.value.trim();
    if (!name) return;
    try {
      const cat = await firstValueFrom(this.http.post<Category>(`${this.api}/categories`, { name }));
      this.categories.update(cats => [...cats, cat]);
      input.value = '';
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
}
