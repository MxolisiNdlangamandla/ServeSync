import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { StaffLayoutComponent } from './layout/staff-layout/staff-layout.component';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./pages/landing/landing.component').then((m) => m.LandingComponent)
	},
	{
		path: 'login',
		loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent)
	},
	{
		path: 'register',
		loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent)
	},
	{
		path: 'accept-invite',
		loadComponent: () => import('./pages/accept-invite/accept-invite.component').then((m) => m.AcceptInviteComponent)
	},
	{
		path: 'c/:id',
		loadComponent: () => import('./pages/customer-order/customer-order.component').then((m) => m.CustomerOrderComponent)
	},
	{
		path: 'c/:id/menu',
		loadComponent: () => import('./pages/customer-menu/customer-menu.component').then((m) => m.CustomerMenuComponent)
	},
	{
		path: '',
		canActivate: [authGuard],
		component: StaffLayoutComponent,
		children: [
			{
				path: 'dashboard',
				loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent)
			},
			{
				path: 'overview',
				loadComponent: () => import('./pages/manager-overview/manager-overview.component').then((m) => m.ManagerOverviewComponent)
			},
			{
				path: 'orders/new',
				loadComponent: () => import('./pages/create-order/create-order.component').then((m) => m.CreateOrderComponent)
			},
			{
				path: 'orders/:id',
				loadComponent: () => import('./pages/order-detail/order-detail.component').then((m) => m.OrderDetailComponent)
			},
			{
				path: 'menu',
				loadComponent: () => import('./pages/menu-manager/menu-manager.component').then((m) => m.MenuManagerComponent)
			},
			{
				path: 'staff',
				loadComponent: () => import('./pages/staff-manager/staff-manager.component').then((m) => m.StaffManagerComponent)
			},
			{
				path: 'settings',
				loadComponent: () => import('./pages/settings/settings.component').then((m) => m.SettingsComponent)
			}
		]
	},
	{
		path: '**',
		loadComponent: () => import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent)
	}
];
