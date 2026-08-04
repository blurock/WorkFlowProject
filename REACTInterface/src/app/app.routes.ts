import { Routes } from '@angular/router';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { TaskDashboardComponent } from './components/task-dashboard/task-dashboard.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: 'landing', component: LandingPageComponent },
  { path: 'dashboard', component: TaskDashboardComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'landing' }
];
