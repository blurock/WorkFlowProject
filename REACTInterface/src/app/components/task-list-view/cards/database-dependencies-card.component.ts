import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ReactCloudApiService, DependencyItem, DependencyCheckResponse } from '../../../services/react-cloud-api.service';

@Component({
  selector: 'app-database-dependencies-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressBarModule
  ],
  template: `
    <mat-card class="dependencies-card section-card" [class.collapsed]="!isExpanded">
      <mat-card-header class="dependencies-header">
        <mat-icon mat-card-avatar color="primary" class="dep-avatar-icon">account_tree</mat-icon>
        <mat-card-title class="dep-title">{{ title }}</mat-card-title>
        <mat-card-subtitle class="dep-subtitle">
          <span *ngIf="loading" class="dep-badge loading-badge">Checking usages...</span>
          <span *ngIf="!loading && dependencies.length === 0" class="dep-badge zero-badge">
            <mat-icon class="mini-icon">check</mat-icon> 0 Usages Found
          </span>
          <span *ngIf="!loading && dependencies.length > 0" class="dep-badge found-badge">
            <mat-icon class="mini-icon">hub</mat-icon> {{ dependencies.length }} {{ dependencies.length === 1 ? 'Usage' : 'Usages' }}
          </span>
        </mat-card-subtitle>

        <div class="header-actions">
          <button
            mat-icon-button
            (click)="fetchDependencies()"
            [disabled]="loading"
            matTooltip="Refresh usages & dependencies">
            <mat-icon [class.spin-animation]="loading">refresh</mat-icon>
          </button>
          <button
            mat-icon-button
            (click)="isExpanded = !isExpanded"
            [matTooltip]="isExpanded ? 'Collapse panel' : 'Expand panel'">
            <mat-icon>{{ isExpanded ? 'expand_less' : 'expand_more' }}</mat-icon>
          </button>
        </div>
      </mat-card-header>

      <mat-card-content *ngIf="isExpanded" class="dependencies-content">
        <!-- Loading Progress Bar -->
        <mat-progress-bar *ngIf="loading" mode="indeterminate" class="mb-3"></mat-progress-bar>

        <!-- Error State -->
        <div *ngIf="error" class="dep-error-banner mb-3">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <div class="error-text">
            <strong>Failed to check usages:</strong> {{ error }}
          </div>
          <button mat-stroked-button color="warn" (click)="fetchDependencies()" class="retry-btn">
            Retry
          </button>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && !error && dependencies.length === 0" class="dep-empty-state">
          <mat-icon class="empty-icon">check_circle_outline</mat-icon>
          <div class="empty-title">No Dependencies Found</div>
          <div class="empty-desc">
            No mechanism pathways or mechanisms currently depend on or reference this reaction pattern.
          </div>
        </div>

        <!-- Dependencies List -->
        <div *ngIf="!loading && dependencies.length > 0" class="dependencies-list">
          <div
            *ngFor="let dep of dependencies"
            class="dependency-item-row"
            [ngClass]="getDepClass(dep.type)">
            <div class="dep-icon-wrapper">
              <mat-icon class="dep-item-icon">{{ getDepIcon(dep.type) }}</mat-icon>
            </div>

            <div class="dep-info">
              <div class="dep-name-row">
                <span class="dep-item-name" [matTooltip]="dep.name">{{ dep.name }}</span>
                <span *ngIf="dep.id && dep.id > 0" class="dep-id-tag">ID: {{ dep.id }}</span>
              </div>
              <div class="dep-meta-row">
                <span class="dep-type-chip">{{ formatDepType(dep.type) }}</span>
                <span class="dep-role-chip">{{ dep.role }}</span>
              </div>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .dependencies-card {
      margin-top: 16px;
      border-radius: 12px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
      background: #ffffff;
      overflow: hidden;
      transition: all 0.2s ease-in-out;

      &.collapsed {
        .dependencies-header {
          border-bottom: none;
        }
      }
    }

    .dependencies-header {
      background: #f8fafc;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;

      .dep-avatar-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
        margin-right: 12px;
        color: #0284c7;
      }

      .dep-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }

      .dep-subtitle {
        margin-top: 4px;
        display: flex;
        align-items: center;
        gap: 6px;

        .dep-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.76rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;

          .mini-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
          }

          &.loading-badge {
            background: #f1f5f9;
            color: #64748b;
          }

          &.zero-badge {
            background: #ecfdf5;
            color: #047857;
          }

          &.found-badge {
            background: #eff6ff;
            color: #1d4ed8;
          }
        }
      }

      .header-actions {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .dependencies-content {
      padding: 16px;
    }

    .dep-error-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 10px 14px;
      color: #991b1b;
      font-size: 0.85rem;

      .error-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #dc2626;
      }

      .error-text {
        flex: 1 1 auto;
      }

      .retry-btn {
        height: 28px;
        line-height: 28px;
        padding: 0 10px;
        font-size: 0.78rem;
      }
    }

    .dep-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      text-align: center;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;

      .empty-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: #10b981;
        margin-bottom: 8px;
      }

      .empty-title {
        font-weight: 600;
        font-size: 0.95rem;
        color: #334155;
        margin-bottom: 4px;
      }

      .empty-desc {
        font-size: 0.82rem;
        color: #64748b;
        max-width: 380px;
        line-height: 1.4;
      }
    }

    .dependencies-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .dependency-item-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      transition: all 0.15s ease-in-out;

      &:hover {
        border-color: #93c5fd;
        background: #f8fafc;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      }

      &.type-pathway {
        border-left: 4px solid #0284c7;
      }

      &.type-mechanism {
        border-left: 4px solid #8b5cf6;
      }

      &.type-reaction {
        border-left: 4px solid #10b981;
      }

      .dep-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 8px;
        background: #f1f5f9;

        .dep-item-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: #475569;
        }
      }

      .dep-info {
        flex: 1 1 auto;
        min-width: 0;

        .dep-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;

          .dep-item-name {
            font-weight: 700;
            font-size: 0.88rem;
            color: #0f172a;
            font-family: monospace;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .dep-id-tag {
            font-size: 0.72rem;
            color: #64748b;
            background: #f1f5f9;
            padding: 1px 6px;
            border-radius: 4px;
          }
        }

        .dep-meta-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;

          .dep-type-chip {
            font-size: 0.72rem;
            font-weight: 600;
            padding: 1px 6px;
            border-radius: 4px;
            background: #e0f2fe;
            color: #0369a1;
          }

          .dep-role-chip {
            font-size: 0.72rem;
            color: #475569;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 1px 6px;
            border-radius: 4px;
          }
        }
      }
    }

    .spin-animation {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% {
        transform: rotate(360deg);
      }
    }
  `]
})
export class DatabaseDependenciesCardComponent implements OnInit, OnChanges {
  @Input() public dbName: string = 'ReactionPatterns';
  @Input() public targetName: string = '';
  @Input() public targetId?: number | string;
  @Input() public title: string = 'Reaction Pattern Usages & Dependencies';

  public loading: boolean = false;
  public error: string | null = null;
  public dependencies: DependencyItem[] = [];
  public isExpanded: boolean = true;

  constructor(private reactCloudApi: ReactCloudApiService) {}

  public ngOnInit(): void {
    if (this.targetName || this.targetId !== undefined) {
      this.fetchDependencies();
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if ((changes['targetName'] && !changes['targetName'].firstChange) ||
        (changes['targetId'] && !changes['targetId'].firstChange) ||
        (changes['dbName'] && !changes['dbName'].firstChange)) {
      this.fetchDependencies();
    }
  }

  public fetchDependencies(): void {
    if (!this.targetName && (this.targetId === undefined || this.targetId === '')) {
      this.dependencies = [];
      return;
    }

    this.loading = true;
    this.error = null;

    const numId = this.targetId !== undefined && this.targetId !== null && this.targetId !== ''
      ? Number(this.targetId)
      : undefined;
    const finalId = (numId !== undefined && !isNaN(numId)) ? numId : undefined;

    this.reactCloudApi.checkDatabaseDependencies(this.dbName, this.targetName, finalId).subscribe({
      next: (res: DependencyCheckResponse) => {
        this.dependencies = res.dependencies || [];
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.error || err?.message || 'Failed to check usages and dependencies';
        this.loading = false;
      }
    });
  }

  public getDepIcon(type: string): string {
    const t = (type || '').toLowerCase();
    if (t.includes('pathway')) return 'alt_route';
    if (t.includes('mechanism')) return 'precision_manufacturing';
    if (t.includes('reaction')) return 'sync_alt';
    if (t.includes('molecule')) return 'bubble_chart';
    if (t.includes('substructure')) return 'grain';
    return 'hub';
  }

  public getDepClass(type: string): string {
    const t = (type || '').toLowerCase();
    if (t.includes('pathway')) return 'type-pathway';
    if (t.includes('mechanism')) return 'type-mechanism';
    if (t.includes('reaction')) return 'type-reaction';
    return '';
  }

  public formatDepType(type: string): string {
    if (!type) return '';
    // Format camelCase to readable words if needed
    if (type === 'MechanismPathway') return 'Mechanism Pathway';
    return type;
  }
}
