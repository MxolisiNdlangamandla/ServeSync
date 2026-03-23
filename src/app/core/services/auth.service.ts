import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Profile, SubscriptionTier } from '../models/profile.model';

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  storeName: string;
  industry?: string;
  subscriptionTier: SubscriptionTier;
}

interface AuthResponse {
  token: string;
  user: Profile;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api = environment.apiUrl;
  private readonly profileState = signal<Profile | null>(null);
  private readonly loggedIn = signal(false);

  readonly profile = computed(() => this.profileState());
  readonly isLoggedIn = computed(() => this.loggedIn());

  constructor() {
    const token = localStorage.getItem('servesync-token');
    if (token) {
      this.loggedIn.set(true);
      this.loadProfile();
    }
  }

  private async loadProfile(): Promise<void> {
    try {
      const profile = await firstValueFrom(this.http.get<Profile>(`${this.api}/auth/me`));
      this.profileState.set(profile ?? null);
    } catch {
      this.profileState.set(null);
    }
  }

  async signUp(params: SignUpParams): Promise<void> {
    const res = await firstValueFrom(this.http.post<AuthResponse>(`${this.api}/auth/register`, {
      email: params.email,
      password: params.password,
      fullName: params.fullName,
      storeName: params.storeName,
      industry: params.industry || 'restaurant',
      subscriptionTier: params.subscriptionTier
    }));
    if (res?.token) {
      localStorage.setItem('servesync-token', res.token);
      this.profileState.set(res.user);
      this.loggedIn.set(true);
    }
  }

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(this.http.post<AuthResponse>(`${this.api}/auth/login`, { email, password }));
    if (res?.token) {
      localStorage.setItem('servesync-token', res.token);
      this.profileState.set(res.user);
      this.loggedIn.set(true);
      await this.router.navigateByUrl('/dashboard');
    }
  }

  async inviteStaff(email: string, role: string = 'user', fullName?: string): Promise<{ inviteToken?: string }> {
    return firstValueFrom(this.http.post<{ inviteToken?: string }>(`${this.api}/staff/invite`, { email, role, full_name: fullName }));
  }

  async updateProfile(data: { full_name?: string; store_name?: string; subscription_tier?: 'tier1' | 'tier2' | 'tier3' }): Promise<void> {
    const profile = await firstValueFrom(this.http.patch<Profile>(`${this.api}/auth/profile`, data));
    this.profileState.set(profile);
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.api}/auth/logout`, {}));
    } catch {
      // Ignore logout sync failures and clear local session anyway.
    }
    localStorage.removeItem('servesync-token');
    this.profileState.set(null);
    this.loggedIn.set(false);
    await this.router.navigateByUrl('/');
  }
}
