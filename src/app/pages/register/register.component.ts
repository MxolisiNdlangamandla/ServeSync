import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { toast } from 'ngx-sonner';
import { AuthService } from '../../core/services/auth.service';
import { INDUSTRY_OPTIONS, IndustryType } from '../../core/models/industry.model';
import { SubscriptionTier } from '../../core/models/profile.model';

function passwordMatch(control: AbstractControl): ValidationErrors | null {
  const pw = control.get('password');
  const confirm = control.get('confirmPassword');
  return pw && confirm && pw.value !== confirm.value ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fade', [
      transition(':enter', [style({ opacity: 0, transform: 'translateY(8px)' }), animate('180ms ease-out', style({ opacity: 1, transform: 'none' }))])
    ])
  ],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-100 to-white p-4">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm" @fade>
        <div class="mb-6">
          <a routerLink="/" class="text-sm font-semibold text-accent hover:underline">&larr; Back to home</a>
          <h1 class="mt-3 text-2xl font-black text-primary">Create Your Account</h1>
          <p class="mt-1 text-sm text-slate-500">Register your business to get started with ServeSync</p>
        </div>

        <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
          <!-- Industry Selection -->
          <div>
            <label class="mb-1 block text-sm font-semibold text-slate-700">What type of business?</label>
            <select class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none" (change)="onIndustryChange($event)">
              @for (ind of industries; track ind.id) {
                <option [value]="ind.id" [selected]="selectedIndustry() === ind.id" [disabled]="!ind.enabled">
                  {{ ind.icon }} {{ ind.name }}{{ !ind.enabled ? ' (Coming Soon)' : '' }}
                </option>
              }
            </select>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">Choose your plan</label>
            <div class="space-y-3">
              @for (plan of plans; track plan.id) {
                <button
                  type="button"
                  class="w-full rounded-xl border-2 p-4 text-left transition-colors"
                  [class]="selectedTier() === plan.id ? 'border-accent bg-accent/5' : 'border-slate-200 hover:border-slate-300'"
                  (click)="selectedTier.set(plan.id)">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="text-sm font-bold text-primary">{{ plan.name }}</div>
                      <div class="mt-1 text-xs text-slate-500">{{ plan.description }}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-lg font-black text-primary">{{ plan.price }}</div>
                      <div class="text-[11px] text-slate-400">{{ plan.unit }}</div>
                    </div>
                  </div>
                  <ul class="mt-3 space-y-1 text-xs text-slate-600">
                    @for (feature of plan.features; track feature) {
                      <li>{{ feature }}</li>
                    }
                  </ul>
                </button>
              }
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm font-semibold text-slate-700">Store / Business Name</label>
            <input class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none" formControlName="storeName" placeholder="e.g. Bella's Kitchen" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-semibold text-slate-700">Your Full Name</label>
            <input class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none" formControlName="fullName" placeholder="e.g. John Smith" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-semibold text-slate-700">Email Address</label>
            <input class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none" formControlName="email" type="email" placeholder="you@business.com" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-semibold text-slate-700">Password</label>
            <input class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none" formControlName="password" type="password" placeholder="Min. 6 characters" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-semibold text-slate-700">Confirm Password</label>
            <input class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none" formControlName="confirmPassword" type="password" placeholder="Re-enter password" />
          </div>

          @if (form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched) {
            <p class="text-sm text-red-500">Passwords do not match</p>
          }

          <button class="w-full rounded-lg bg-accent px-4 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-50" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Creating Account...' : 'Create Account' }}
          </button>
        </form>

        <p class="mt-5 text-center text-sm text-slate-500">
          Already have an account? <a routerLink="/login" class="font-semibold text-accent hover:underline">Sign In</a>
        </p>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly industries = INDUSTRY_OPTIONS;
  readonly selectedIndustry = signal<IndustryType>('restaurant');
  readonly selectedTier = signal<SubscriptionTier>('tier1');
  readonly plans = [
    {
      id: 'tier1' as SubscriptionTier,
      name: 'Starter',
      price: 'Free',
      unit: 'start free',
      description: 'Run the core live service flow for one location.',
      features: ['Create orders', 'Add staff', 'Use manual custom items', 'Customer requests and bill calls']
    },
    {
      id: 'tier3' as SubscriptionTier,
      name: 'Essentials',
      price: 'R259',
      unit: 'per month',
      description: 'For smaller menu-based businesses that need saved items and faster repeat ordering.',
      features: ['Everything in Starter', 'Saved menu items', 'Simple repeat ordering', 'Single-store workflow']
    },
    {
      id: 'tier2' as SubscriptionTier,
      name: 'Professional',
      price: 'R499',
      unit: 'per month',
      description: 'Unlock menu management, payments, and stronger reporting for one store.',
      features: ['Everything in Starter', 'Saved menu items', 'Online payments', 'Advanced analytics']
    },
    {
      id: 'tier4' as SubscriptionTier,
      name: 'Enterprise',
      price: 'From R450',
      unit: 'per shop / month',
      description: 'Support multiple shop locations with centralized control.',
      features: ['Everything in Professional', 'Multiple shops', 'Central oversight', 'Priority support']
    }
  ];

  readonly form = this.fb.nonNullable.group({
    storeName: ['', Validators.required],
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordMatch });

  onIndustryChange(e: Event): void {
    const val = (e.target as HTMLSelectElement).value as IndustryType;
    this.selectedIndustry.set(val);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    const v = this.form.getRawValue();
    try {
      await this.auth.signUp({
        email: v.email,
        password: v.password,
        fullName: v.fullName,
        storeName: v.storeName,
        industry: this.selectedIndustry(),
        subscriptionTier: this.selectedTier()
      });
      toast.success('Account created! Redirecting to dashboard...');
      await this.router.navigateByUrl('/dashboard');
    } catch (err: any) {
      toast.error(err.error?.error ?? err.message ?? 'Registration failed');
    } finally {
      this.loading.set(false);
    }
  }
}
