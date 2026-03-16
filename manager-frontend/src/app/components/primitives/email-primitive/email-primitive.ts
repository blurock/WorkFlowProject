import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BasePrimitiveComponent } from '../base-primitive';

@Component({
  selector: 'app-email-primitive',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatIconModule, 
    MatTooltipModule
  ],
  template: `
    <mat-form-field appearance="outline" style="width: 100%; display: block;" floatLabel="always">
      <mat-label>{{ structure.label || structure.classname }}</mat-label>
      <mat-icon matPrefix>email</mat-icon>
      <input matInput type="email" 
             [ngModel]="value" 
             (ngModelChange)="updateValue($event)"
             [placeholder]="structure.comment || 'Enter email'">
      <mat-icon matSuffix *ngIf="structure.comment" [matTooltip]="structure.comment" class="info-icon">info</mat-icon>
    </mat-form-field>
  `,
  styles: [`
    .primitive-field {
      width: 100%;
      margin-bottom: 8px;
    }
    .info-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: rgba(0, 0, 0, 0.38);
      cursor: help;
    }
    mat-icon[matPrefix] {
        margin-right: 8px;
        color: rgba(0, 0, 0, 0.54);
    }
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class EmailPrimitiveComponent extends BasePrimitiveComponent {
  
  getData(): any {
    return this.value;
  }

  setData(data: any): void {
    this.value = data;
  }
}
