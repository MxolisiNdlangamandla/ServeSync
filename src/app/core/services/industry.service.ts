import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { INDUSTRY_LABELS, IndustryLabels, IndustryType } from '../models/industry.model';

@Injectable({ providedIn: 'root' })
export class IndustryService {
  private readonly auth = inject(AuthService);

  readonly industry = computed<IndustryType>(() => {
    const profile = this.auth.profile();
    return (profile?.industry as IndustryType) || 'restaurant';
  });

  readonly labels = computed<IndustryLabels>(() => {
    return INDUSTRY_LABELS[this.industry()] ?? INDUSTRY_LABELS['restaurant'];
  });
}
