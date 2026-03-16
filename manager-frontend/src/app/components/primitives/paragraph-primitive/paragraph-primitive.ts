import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BasePrimitiveComponent } from '../base-primitive';

@Component({
  selector: 'app-paragraph-primitive',
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
      <textarea matInput 
                [ngModel]="value" 
                (ngModelChange)="updateValue($event)"
                [placeholder]="structure.comment || ''"
                rows="4"></textarea>
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
    textarea {
      resize: vertical;
    }
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class ParagraphPrimitiveComponent extends BasePrimitiveComponent {
  
  getData(): any {
    return this.value;
  }

  setData(data: any): void {
    this.value = data;
  }
}
