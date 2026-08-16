import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';

import { AuthService } from '../../services/auth.service';
import { TaskCategoryRegistry } from '../../services/task-category-registry.service';
import { CatalogTask, TaskCategory } from '../../models/task-category.models';
import { TaskListViewComponent } from '../task-list-view/task-list-view.component';
import { SubmechanismCreatorComponent } from '../submechanism-creator/submechanism-creator.component';
import { SubmechanismPathSetComponent } from '../submechanism-path-set/submechanism-path-set.component';
import { CombineSubmechanismsComponent } from '../combine-submechanisms/combine-submechanisms.component';

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
    MatExpansionModule,
    MatTooltipModule,
    MatCardModule,
    TaskListViewComponent,
    SubmechanismCreatorComponent,
    SubmechanismPathSetComponent,
    CombineSubmechanismsComponent
  ],
  templateUrl: './task-dashboard.component.html',
  styleUrls: ['./task-dashboard.component.scss']
})
export class TaskDashboardComponent {
  public categories: TaskCategory[];
  public selectedCategory: TaskCategory;
  public selectedTask: CatalogTask;

  constructor(
    public authService: AuthService,
    private categoryRegistry: TaskCategoryRegistry,
    private router: Router
  ) {
    this.categories = this.categoryRegistry.getAllCategories();
    this.selectedCategory = this.categories[0];
    this.selectedTask = this.categories[0].tasks[0];
  }

  public selectTask(category: TaskCategory, task: CatalogTask): void {
    this.selectedCategory = category;
    this.selectedTask = task;
  }

  public onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/landing']);
  }
}
