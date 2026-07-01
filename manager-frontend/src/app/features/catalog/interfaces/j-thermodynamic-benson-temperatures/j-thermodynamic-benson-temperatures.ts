import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { BasePrimitiveComponent } from '../../primitives/base-primitive';
import { OntologyService } from '../../../../core/services/ontology.service';

@Component({
  selector: 'app-j-thermodynamic-benson-temperatures',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <mat-form-field class="temperatures-field" appearance="outline" floatLabel="always">
      <mat-label>{{ structure.label || 'Benson Temperatures List' }}</mat-label>
      <mat-chip-grid #chipGrid aria-label="Temperature selection">
        <mat-chip-row *ngFor="let temp of temperatures" (removed)="remove(temp)">
          {{ temp }} K
          <button matChipRemove [attr.aria-label]="'remove ' + temp">
            <mat-icon>cancel</mat-icon>
          </button>
        </mat-chip-row>
      </mat-chip-grid>
      <input type="number"
             [placeholder]="structure.comment || 'Add temperature...'"
             [matChipInputFor]="chipGrid"
             [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
             (matChipInputTokenEnd)="add($event)"/>
      <mat-icon matSuffix *ngIf="temperatures.length > 0" class="filled-icon" matTooltip="List is set">check_circle</mat-icon>
      <mat-icon matSuffix *ngIf="structure.comment && temperatures.length === 0" [matTooltip]="structure.comment" class="info-icon">info</mat-icon>
    </mat-form-field>
  `,
  styles: [`
    .temperatures-field {
      width: 100%;
      display: block;
      margin-bottom: 8px;
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
      color: #3b82f6;
      margin-right: 4px;
    }
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class JThermodynamicBensonTemperaturesComponent extends BasePrimitiveComponent implements OnInit {
  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);
  
  separatorKeysCodes: number[] = [ENTER, COMMA];
  temperatures: number[] = [];
  loading = false;

  override ngOnInit(): void {
    super.ngOnInit();
    this.extractTemperatures();

    if (!this.structure || !this.structure.properties) {
      this.loading = true;
      this.ontologyService.getUITemplate('dataset:bensontemperaturelist').subscribe({
        next: (res) => {
          this.structure = res['dataobject'];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[JThermodynamicBensonTemperaturesComponent] Failed to load UI template', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  override get value(): any {
    return this._value;
  }

  override set value(val: any) {
    if (this._value !== val) {
      this._value = val;
      this.extractTemperatures();
      this.cdr.detectChanges();
    }
  }

  private extractTemperatures(): void {
    if (this.value) {
      const list = this.value['dataset:thermotemperature'];
      if (Array.isArray(list)) {
        this.temperatures = list
          .map(t => Number(t))
          .filter(t => !isNaN(t))
          .sort((a, b) => a - b);
      } else {
        this.temperatures = [];
      }
    } else {
      this.temperatures = [];
    }
  }

  add(event: MatChipInputEvent): void {
    const rawVal = (event.value || '').trim();
    if (rawVal) {
      const tempNum = Number(rawVal);
      if (!isNaN(tempNum) && !this.temperatures.includes(tempNum)) {
        this.temperatures.push(tempNum);
        this.temperatures.sort((a, b) => a - b);
        this.updateValueObject();
      }
    }
    event.chipInput!.clear();
  }

  remove(temp: number): void {
    const index = this.temperatures.indexOf(temp);
    if (index >= 0) {
      this.temperatures.splice(index, 1);
      this.updateValueObject();
    }
  }

  private updateValueObject(): void {
    if (!this.value || typeof this.value !== 'object') {
      this.value = {};
    }
    const updatedValue = {
      ...this.value,
      'dataset:thermotemperature': [...this.temperatures]
    };
    this.updateValue(updatedValue);
    this.cdr.detectChanges();
  }

  getData(): any {
    return this.value;
  }

  setData(data: any): void {
    this.value = data || {};
  }
}
