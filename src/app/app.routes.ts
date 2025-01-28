import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard/dashboard.component';
import { authGuard } from './guard/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () => import('./components/login/login.component')
            .then(m => m.LoginComponent)
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard/dashboard.component')
            .then(m => m.DashboardComponent),
        canActivate: [authGuard]
    }
];