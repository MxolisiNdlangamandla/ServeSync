import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 p-4 text-center">
      <h1 class="text-4xl font-black text-primary">404</h1>
      <p class="text-slate-600">Page not found.</p>
      <a routerLink="/" class="rounded-lg bg-primary px-4 py-2 text-white">Back Home</a>
    </div>
  `
})
export class NotFoundComponent {}
