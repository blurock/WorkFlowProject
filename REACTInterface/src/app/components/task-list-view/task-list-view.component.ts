import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ReactCloudApiService, CatalogItem, CatalogTask } from '../../services/react-cloud-api.service';

@Component({
  selector: 'app-task-list-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  templateUrl: './task-list-view.component.html',
  styleUrls: ['./task-list-view.component.scss']
})
export class TaskListViewComponent implements OnChanges {
  @Input({ required: true }) task!: CatalogTask;

  public items: CatalogItem[] = [];
  public isLoading: boolean = false;
  public hasExecuted: boolean = false;
  public errorMessage: string | null = null;
  public selectedItem: CatalogItem | null = null;

  constructor(
    private apiService: ReactCloudApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task'] && this.task) {
      this.selectedItem = null;
      this.loadTaskData();
    }
  }

  public loadTaskData(): void {
    if (!this.task) return;

    this.isLoading = true;
    this.errorMessage = null;

    this.apiService.runInputTask(this.task.inpFile).subscribe({
      next: (parsedItems) => {
        this.items = parsedItems;
        this.isLoading = false;
        this.hasExecuted = true;
      },
      error: (err) => {
        this.isLoading = false;
        this.hasExecuted = true;
        this.errorMessage = err?.error?.error || 'Failed to connect to REACTCLOUD server. Is the API server running?';
        this.snackBar.open(`Error executing ${this.task.title}: ${this.errorMessage}`, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  public onItemClick(item: CatalogItem): void {
    this.selectedItem = item;
    this.snackBar.open(`Selected item #${item.id}: ${item.name}`, 'OK', {
      duration: 3000
    });
  }
}
