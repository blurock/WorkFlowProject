import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { BasePrimitiveComponent } from '../base-primitive';

@Component({
  selector: 'app-keyword-set-primitive',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    MatChipsModule, 
    MatFormFieldModule, 
    MatIconModule,
    MatAutocompleteModule,
    MatTooltipModule
  ],
  template: `
    <mat-form-field style="width: 100%; display: block;" appearance="outline" floatLabel="always">
      <mat-label>{{ structure.label || structure.classname }}</mat-label>
      <mat-chip-grid #chipGrid aria-label="Keyword selection">
        <mat-chip-row *ngFor="let keyword of keywords" (removed)="remove(keyword)">
          {{ keyword }}
          <button matChipRemove [attr.aria-label]="'remove ' + keyword">
            <mat-icon>cancel</mat-icon>
          </button>
        </mat-chip-row>
      </mat-chip-grid>
      <input [placeholder]="structure.comment || 'New keyword...'"
             [matChipInputFor]="chipGrid"
             [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
             (matChipInputTokenEnd)="add($event)"/>
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
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class KeywordSetPrimitiveComponent extends BasePrimitiveComponent {
  separatorKeysCodes: number[] = [ENTER, COMMA];
  keywords: string[] = [];

  override ngOnInit(): void {
    super.ngOnInit();
    if (this.value) {
      if (Array.isArray(this.value)) {
        this.keywords = [...this.value];
      } else if (typeof this.value === 'string') {
        this.keywords = this.value.split(',').map(s => s.trim()).filter(s => s);
      }
    }
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.keywords.push(value);
      this.updateValue([...this.keywords]);
    }
    event.chipInput!.clear();
  }

  remove(keyword: string): void {
    const index = this.keywords.indexOf(keyword);
    if (index >= 0) {
      this.keywords.splice(index, 1);
      this.updateValue([...this.keywords]);
    }
  }

  getData(): any {
    return this.keywords;
  }

  setData(data: any): void {
    if (Array.isArray(data)) {
      this.keywords = [...data];
    } else {
      this.keywords = [];
    }
    this.updateValue([...this.keywords]);
  }
}
