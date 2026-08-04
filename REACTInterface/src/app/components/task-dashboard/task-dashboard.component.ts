import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';

import { AuthService } from '../../services/auth.service';
import { ReactCloudApiService, CatalogTask } from '../../services/react-cloud-api.service';
import { TaskListViewComponent } from '../task-list-view/task-list-view.component';

@Component({
  selector: 'app-task-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatChipsModule,
    TaskListViewComponent
  ],
  templateUrl: './task-dashboard.component.html',
  styleUrls: ['./task-dashboard.component.scss']
})
export class TaskDashboardComponent {
  public tasks: CatalogTask[];
  public selectedTask: CatalogTask;

  constructor(
    public authService: AuthService,
    private apiService: ReactCloudApiService,
    private router: Router
  ) {
    this.tasks = this.apiService.CATALOG_TASKS;
    this.selectedTask = this.tasks[0];
  }

  public selectTask(task: CatalogTask): void {
    this.selectedTask = task;
  }

  public onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/landing']);
  }
}
