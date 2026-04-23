import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BasePrimitiveComponent } from '../base-primitive';

@Component({
  selector: 'app-boolean-primitive',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatSlideToggleModule, 
    MatIconModule, 
    MatTooltipModule
  ],
  template: `
    <div class="primitive-container" [class.filled-field]="isFilled">
      <div class="toggle-wrap">
        <mat-slide-toggle [ngModel]="value" (ngModelChange)="updateValue($event)" color="primary">
          <span class="toggle-label">{{ structure.label || structure.classname }}</span>
        </mat-slide-toggle>
        <mat-icon *ngIf="isFilled" class="filled-icon" matTooltip="Field is filled">check_circle</mat-icon>
        <mat-icon *ngIf="structure.comment && !isFilled" [matTooltip]="structure.comment" class="info-icon">info</mat-icon>
      </div>
    </div>
  `,
  styles: [`
    .primitive-container {
      margin-bottom: 8px;
      padding: 8px 12px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    .filled-field {
      background-color: rgba(76, 175, 80, 0.04);
    }
    .toggle-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .toggle-label {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }
    .info-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: rgba(0, 0, 0, 0.38);
      cursor: help;
    }
    .filled-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #4caf50;
    }
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class BooleanPrimitiveComponent extends BasePrimitiveComponent {
  
  override ngOnInit(): void {
    if (this.value === undefined || this.value === null || this.value === '') {
      this.value = false;
    } else if (typeof this.value === 'string') {
        this.value = this.value.toLowerCase() === 'true';
    }
  }

  getData(): any {
    return this.value;
  }

  setData(data: any): void {
    this.value = !!data;
  }
}
