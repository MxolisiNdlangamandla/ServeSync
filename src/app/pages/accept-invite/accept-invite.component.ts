import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-accept-invite',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-100 to-white p-4">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div class="mb-6">
          <h1 class="text-2xl font-black text-primary">Set Your Password</h1>
          <p class="mt-1 text-sm text-slate-500">You've been invited to join ServeSync. Set a password to get started.</p>
        </div>
        <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
          <div>
            <label class="mb-1 block text-sm font-semibold text-slate-700">Password</label>
            <input class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none" type="password" formControlName="password" placeholder="Min. 6 characters" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-semibold text-slate-700">Confirm Password</label>
            <input class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none" type="password" formControlName="confirmPassword" placeholder="Re-enter password" />
          </div>
          @if (form.controls.password.value !== form.controls.confirmPassword.value && form.controls.confirmPassword.touched) {
            <p class="text-sm text-red-500">Passwords do not match</p>
          }
          <button class="w-full rounded-lg bg-primary px-4 py-3 font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                  [disabled]="form.invalid || form.controls.password.value !== form.controls.confirmPassword.value || loading()">
            {{ loading() ? 'Setting up...' : 'Set Password & Sign In' }}
          </button>
        </form>
        <p class="mt-5 text-center text-sm text-slate-500">Already set up? <a routerLink="/login" class="font-semibold text-accent hover:underline">Sign In</a></p>
      </div>
    </div>
  `
})
export class AcceptInviteComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly inviteToken = this.route.snapshot.queryParamMap.get('token') ?? '';

  readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    const { password, confirmPassword } = this.form.getRawValue();
    if (password !== confirmPassword) return;

    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<{ token: string }>(`${environment.apiUrl}/auth/accept-invite`, {
          token: this.inviteToken,
          password
        })
      );
      if (res?.token) {
        localStorage.setItem('servesync-token', res.token);
        toast.success('Account set up! Redirecting...');
        await this.router.navigateByUrl('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.error?.error ?? 'Failed to set password');
    } finally {
      this.loading.set(false);
    }
  }
}
