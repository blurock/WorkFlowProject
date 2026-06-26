import { Component, Input, OnInit, Output, EventEmitter, HostBinding, inject, Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CatalogObjectNavigationService {
  private fetchObjectSubject = new Subject<string>();
  fetchObject$ = this.fetchObjectSubject.asObservable();

  navigateToPath(path: string) {
    this.fetchObjectSubject.next(path);
  }
}

@Injectable({ providedIn: 'root' })
export class WorkflowVisibilityService {
  showAllFields = false;
}

/**
 * Interface representing the structure returned by DocumentTemplateForUI
 */
export interface OntologyStructure {
  identifier: string;
  classname: string;
  isClassification: boolean;
  isParagraph: boolean;
  isOneLine: boolean;
  isEmail: boolean;
  isURL: boolean;
  isBoolean: boolean;
  isKeyword?: boolean;
  isKeywordSet: boolean;
  isFileSource: boolean;
  isObject?: boolean;
  isArray?: boolean;
  label?: string;
  comment?: string;
  choices?: any;
  properties?: { [key: string]: OntologyStructure };
}

/**
 * Base abstract class for all primitive ontology components.
 */
@Component({
  template: ''
})
export abstract class BasePrimitiveComponent implements OnInit {
  /** The value of the field (JsonObject, JsonArray, or primitive) */
  protected _value: any;

  public initiallyFilled = false;
  protected visibilityService = inject(WorkflowVisibilityService, { optional: true });

  @Input()
  get value(): any {
    return this._value;
  }

  set value(v: any) {
    if (this._value !== v) {
      this._value = v;
    }
  }

  /** The ontology classname of the field */
  @Input() classname!: string;

  /** The UI structure hints from the ontology */
  @Input() structure!: OntologyStructure;

  /** Output for two-way binding */
  @Output() valueChange = new EventEmitter<any>();

  @HostBinding('style.display') get display() {
    if (this.isLayoutComponent()) {
      return '';
    }
    if (this.visibilityService?.showAllFields) {
      return '';
    }
    return this.initiallyFilled ? 'none' : '';
  }

  protected isLayoutComponent(): boolean {
    return false;
  }

  ngOnInit(): void {
    if (this._value === undefined || this._value === null) {
      if (this.structure?.isArray) {
        this._value = [];
      } else if (this.structure?.isObject) {
        this._value = {};
      } else if (this.structure?.isBoolean) {
        this._value = false;
      } else {
        this._value = '';
      }
    }
    this.initiallyFilled = this.isDeeplyFilled(this.structure, this._value);
  }

  updateValue(v: any) {
    if (this._value !== v) {
      this._value = v;
      this.valueChange.emit(v);
    }
  }

  /**
   * Returns true if the primitive has been filled with a valid, non-default value.
   */
  get isFilled(): boolean {
    return this.isDeeplyFilled(this.structure, this._value);
  }

  private isDeeplyFilled(struct: OntologyStructure, value: any): boolean {
    if (!struct) return this.checkValueAssigned(value);

    if (struct.isArray) {
      if (!Array.isArray(value)) return false;
      if (value.length === 0) return true; // Empty array is considered filled

      if (struct.isObject && struct.properties) {
        return value.every(item => this.isDeeplyFilled({ ...struct, isArray: false }, item));
      } else {
        return value.every(item => this.checkValueAssigned(item));
      }
    }

    if (struct.isObject && struct.properties) {
      if (typeof value !== 'object' || value === null) return false;
      const keys = Object.keys(struct.properties);
      for (const key of keys) {
        if (!this.isDeeplyFilled(struct.properties[key], value[key])) {
          return false;
        }
      }
      return true;
    }

    return this.checkValueAssigned(value);
  }

  private checkValueAssigned(value: any): boolean {
    if (value === undefined || value === null || value === '') {
      return false;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed !== 'not assigned' && !trimmed.startsWith('Unassigned classification:');
    }
    if (Array.isArray(value)) {
      return true;
    }
    return true;
  }

  getPropertyStructure(key: string): OntologyStructure {
    if (this.structure?.properties?.[key]) {
      return this.structure.properties[key];
    }
    return {
      identifier: key,
      classname: 'dataset:OneLine',
      isOneLine: true,
      isObject: false,
      isArray: false,
      isClassification: false,
      isParagraph: false,
      isEmail: false,
      isURL: false,
      isBoolean: false,
      isKeywordSet: false,
      isFileSource: false
    };
  }
  get propertyKeys(): string[] {
    if (this.value) {
      return Object.keys(this.value);
    }
    return [];
  }

  /**
   * Returns the current data in its JSON-compatible format.
   * @returns The data object
   */
  abstract getData(): any;

  /**
   * Sets the component data from a JSON-compatible object.
   * @param data The incoming data
   */
  abstract setData(data: any): void;
}
