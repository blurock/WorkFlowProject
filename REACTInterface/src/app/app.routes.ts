import { Routes } from '@angular/router';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { TaskDashboardComponent } from './components/task-dashboard/task-dashboard.component';
import { LoggingAdminComponent } from './components/logging-admin/logging-admin.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: 'landing', component: LandingPageComponent },
  { path: 'dashboard', component: TaskDashboardComponent, canActivate: [authGuard] },
  { path: 'logging-admin', component: LoggingAdminComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'landing' }
];
