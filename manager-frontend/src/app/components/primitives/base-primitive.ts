import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

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
  }

  updateValue(v: any) {
    if (this._value !== v) {
      this._value = v;
      this.valueChange.emit(v);
    }
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
