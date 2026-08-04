import { Component, Input, OnInit, OnChanges, AfterViewInit, OnDestroy, SimpleChanges, ViewChild, ViewContainerRef, ComponentRef, forwardRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OntologyStructure, BasePrimitiveComponent } from '../base-primitive';
import { KeywordPrimitiveComponent } from '../keyword-primitive/keyword-primitive';
import { OneLinePrimitiveComponent } from '../oneline-primitive/oneline-primitive';
import { ParagraphPrimitiveComponent } from '../paragraph-primitive/paragraph-primitive';
import { EmailPrimitiveComponent } from '../email-primitive/email-primitive';
import { UrlPrimitiveComponent } from '../url-primitive/url-primitive';
import { BooleanPrimitiveComponent } from '../boolean-primitive/boolean-primitive';
import { ClassificationPrimitiveComponent } from '../classification-primitive/classification-primitive';
import { KeywordSetPrimitiveComponent } from '../keyword-set-primitive/keyword-set-primitive';
import { FileSourceIdentifierPrimitiveComponent } from '../file-source-primitive/file-source-primitive';

import { resolveCustomInterface } from '../../interfaces/interfaces.registry';
import { JsonObjectPrimitiveComponent } from '../json-object-primitive/json-object-primitive';
import { JsonArrayPrimitiveComponent } from '../json-array-primitive/json-array-primitive';

@Component({
  selector: 'app-dynamic-primitive',
  standalone: true,
  imports: [
    CommonModule,
    KeywordPrimitiveComponent,
    OneLinePrimitiveComponent,
    ParagraphPrimitiveComponent,
    EmailPrimitiveComponent,
    UrlPrimitiveComponent,
    BooleanPrimitiveComponent,
    ClassificationPrimitiveComponent,
    KeywordSetPrimitiveComponent,
    FileSourceIdentifierPrimitiveComponent,
    forwardRef(() => JsonObjectPrimitiveComponent),
    forwardRef(() => JsonArrayPrimitiveComponent)
  ],
  template: `
    <div class="dynamic-wrap">
      <!-- Case 0: Custom Registered Interface Component Container -->
      <ng-container #customContainer></ng-container>

      <ng-container *ngIf="!customComponent">
        <!-- Case 1: Array of Keywords -> Use KeywordSet (Chips) -->
        <app-keyword-set-primitive *ngIf="structure.isArray && structure.isKeyword"
          [structure]="structure" [value]="value" (valueChange)="onChildValueChange($event)">
        </app-keyword-set-primitive>

        <!-- Case 2: Standard Array -> Use JsonArray (Recursion) -->
        <app-json-array-primitive *ngIf="structure.isArray && !structure.isKeyword"
          [structure]="structure" [value]="value" (valueChange)="onChildValueChange($event)">
        </app-json-array-primitive>

        <!-- Case 3: Object -> Use JsonObject (Recursion) -->
        <app-json-object-primitive *ngIf="structure.isObject && !structure.isArray"
          [structure]="structure" [value]="value" (valueChange)="onChildValueChange($event)">
        </app-json-object-primitive>

        <!-- Case 4: Primitives -->
        <app-keyword-primitive *ngIf="!structure.isArray && !structure.isObject && (structure.isKeyword || (!structure.isClassification && !structure.isParagraph && !structure.isOneLine && !structure.isEmail && !structure.isURL && !structure.isBoolean && !structure.isKeywordSet && !structure.isFileSource))" 
          [structure]="structure" [value]="value" (valueChange)="onChildValueChange($event)">
        </app-keyword-primitive>
        
        <app-classification-primitive *ngIf="structure.isClassification && !structure.isArray" [structure]="structure" [value]="value" (valueChange)="onChildValueChange($event)"></app-classification-primitive>
        <app-paragraph-primitive *ngIf="structure.isParagraph && !structure.isArray" [structure]="structure" [value]="value" (valueChange)="onChildValueChange($event)"></app-paragraph-primitive>
        <app-oneline-primitive *ngIf="structure.isOneLine && !structure.isArray" [structure]="structure" [value]="value" (valueChange)="onChildValueChange($event)"></app-oneline-primitive>
        <app-email-primitive *ngIf="structure.isEmail && !structure.isArray" [structure]="structure" [value]="value" (valueChange)="onChildValueChange($event)"></app-email-primitive>
        <app-url-primitive *ngIf="structure.isURL && !structure.isArray" [structure]="structure" [value]="value" (valueChange)="onChildValueChange($event)"></app-url-primitive>
        <app-boolean-primitive *ngIf="structure.isBoolean && !structure.isArray" [structure]="structure" [value]="value" (valueChange)="onChildValueChange($event)"></app-boolean-primitive>
        <app-keyword-set-primitive *ngIf="structure.isKeywordSet && !structure.isArray" [structure]="structure" [value]="value" (valueChange)="onChildValueChange($event)"></app-keyword-set-primitive>
        <app-file-source-primitive *ngIf="structure.isFileSource && !structure.isArray" [structure]="structure" [value]="value" (valueChange)="onChildValueChange($event)"></app-file-source-primitive>
      </ng-container>
    </div>
  `,
  styles: [`
    .dynamic-wrap {
      width: 100%;
      display: block;
    }
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class DynamicPrimitiveComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() structure!: OntologyStructure;

  private _value: any;
  @Input()
  get value() { return this._value; }
  set value(v: any) {
    if (this._value !== v) {
      this._value = v;
      if (this.componentRef) {
        this.componentRef.setInput('value', v);
      }
    }
  }

  @Output() valueChange = new EventEmitter<any>();

  @ViewChild('customContainer', { read: ViewContainerRef, static: false }) customContainer?: ViewContainerRef;
  private componentRef?: ComponentRef<any>;
  private isViewInit = false;

  get customComponent() {
    if (this.structure && this.structure.classname) {
      const resolved = resolveCustomInterface(this.structure.classname);
      return resolved;
    }
    return undefined;
  }

  ngOnInit(): void {
    if (!this.structure) {
      console.warn("DynamicPrimitive initialized without structure!");
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['structure'] || changes['value']) {
      this.updateCustomComponent();
    }
  }

  ngAfterViewInit(): void {
    this.isViewInit = true;
    // Defer creation slightly to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.updateCustomComponent();
    });
  }

  ngOnDestroy(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  private updateCustomComponent() {
    if (!this.isViewInit || !this.customContainer) return;

    const compType = this.customComponent;
    if (!compType) {
      this.customContainer.clear();
      this.componentRef = undefined;
      return;
    }

    // If already created and matches type, update inputs
    if (this.componentRef && this.componentRef.componentType === compType) {
      this.componentRef.setInput('structure', this.structure);
      this.componentRef.setInput('value', this.value);
      this.componentRef.setInput('classname', this.structure.classname);
      return;
    }

    // Recreate
    this.customContainer.clear();
    const ref = this.customContainer.createComponent(compType);
    this.componentRef = ref;
    ref.setInput('structure', this.structure);
    ref.setInput('value', this.value);
    ref.setInput('classname', this.structure.classname);

    if (ref.instance.valueChange) {
      ref.instance.valueChange.subscribe((v: any) => {
        this.onChildValueChange(v);
      });
    }
  }

  onChildValueChange(v: any) {
    if (this._value !== v) {
      this._value = v;
      this.valueChange.emit(v);
    }
  }
}
