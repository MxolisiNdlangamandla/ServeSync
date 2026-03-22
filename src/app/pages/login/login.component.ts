import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toast } from 'ngx-sonner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-100 to-white p-4">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div class="mb-6">
          <a routerLink="/" class="text-sm font-semibold text-accent hover:underline">&larr; Back to home</a>
          <h1 class="mt-3 text-2xl font-black text-primary">Sign In</h1>
          <p class="mt-1 text-sm text-slate-500">Welcome back to ServeSync</p>
        </div>
        <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
          <div>
            <label class="mb-1 block text-sm font-semibold text-slate-700">Email Address</label>
            <input class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none" formControlName="email" type="email" placeholder="you@business.com" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-semibold text-slate-700">Password</label>
            <input class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none" type="password" formControlName="password" placeholder="Enter your password" />
          </div>
          <button class="w-full rounded-lg bg-primary px-4 py-3 font-bold text-white hover:bg-primary/90 disabled:opacity-50" [disabled]="form.invalid || loading()">{{ loading() ? 'Signing In...' : 'Sign In' }}</button>
        </form>
        <p class="mt-5 text-center text-sm text-slate-500">Don't have an account? <a routerLink="/register" class="font-semibold text-accent hover:underline">Register your store</a></p>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    try {
      const value = this.form.getRawValue();
      await this.auth.login(value.email, value.password);
    } catch (err: any) {
      toast.error(err.error?.error ?? err.message ?? 'Login failed');
    } finally {
      this.loading.set(false);
    }
  }
}
