import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { DynamicPrimitiveComponent } from '../dynamic-primitive/dynamic-primitive';
import { PrimitiveFileWrapperComponent } from '../dynamic-primitive/primitive-file-wrapper';
import { OntologyStructure } from '../base-primitive';
import { OntologyService } from '../../../services/ontology.service';

@Component({
  selector: 'app-primitive-showcase',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatTabsModule,
    DynamicPrimitiveComponent,
    PrimitiveFileWrapperComponent
  ],
  template: `
    <div class="showcase-container">
      <header>
        <h1>Ontology UI Components (Refactored)</h1>
        <p>Demonstration of automated UI templates from ontology data types, including recursion.</p>
        <p style="color: #6a1b9a; font-weight: bold; background: #f3e5f5; padding: 10px; border-radius: 4px;">
          [Diagnostic: Stabilization Applied - 2026-03-13 12:15]
        </p>
      </header>

      <div class="recursive-showcase">
        <section>
          <h2 class="section-title">1. Simple Recursive Object</h2>
          <p class="section-desc">Testing <code>dataset:DataDescriptionFileStaging</code></p>
          <mat-card class="showcase-card full-width">
            <mat-card-content>
              <app-primitive-file-wrapper 
                *ngIf="simpleRecursiveStruct"
                [structure]="simpleRecursiveStruct" 
                [(value)]="simpleData">
              </app-primitive-file-wrapper>
            </mat-card-content>
          </mat-card>
        </section>

        <section>
          <h2 class="section-title">2. Complex Recursive with Arrays</h2>
          <p class="section-desc">Testing <code>dataset:ActivityRepositoryInitialReadInfo</code></p>
          <mat-card class="showcase-card full-width">
            <mat-card-content>
              <app-primitive-file-wrapper 
                *ngIf="complexRecursiveStruct"
                [structure]="complexRecursiveStruct" 
                [(value)]="complexData">
              </app-primitive-file-wrapper>
            </mat-card-content>
          </mat-card>
        </section>
      </div>

      <mat-divider></mat-divider>

      <section class="primitives-section">
        <h2 class="section-title">3. Standalone Primitives</h2>
        <p class="section-desc">Basic ontology types rendered via the dynamic dispatcher</p>
        <div class="grid">
          <mat-card class="showcase-card">
            <mat-card-header><mat-card-title>Text & Logic</mat-card-title></mat-card-header>
            <mat-card-content>
              <app-dynamic-primitive [structure]="keywordStruct" [(value)]="data.keyword"></app-dynamic-primitive>
              <app-dynamic-primitive [structure]="onelineStruct" [(value)]="data.oneline"></app-dynamic-primitive>
              <app-dynamic-primitive [structure]="booleanStruct" [(value)]="data.boolean"></app-dynamic-primitive>
            </mat-card-content>
          </mat-card>
          
          <mat-card class="showcase-card">
            <mat-card-header><mat-card-title>Advanced Types</mat-card-title></mat-card-header>
            <mat-card-content>
              <app-dynamic-primitive [structure]="paragraphStruct" [(value)]="data.paragraph"></app-dynamic-primitive>
              <app-dynamic-primitive [structure]="keywordSetStruct" [(value)]="data.keywordSet"></app-dynamic-primitive>
            </mat-card-content>
          </mat-card>
        </div>
      </section>

      <div class="actions">
        <button mat-raised-button color="primary" (click)="logData()">Log Data to Console</button>
      </div>
    </div>
  `,
  styles: [`
    .showcase-container {
      padding: 40px;
      background: #fdfdfd;
      min-height: 100vh;
      max-width: 1200px;
      margin: 0 auto;
    }
    header {
      margin-bottom: 48px;
      text-align: center;
    }
    h1 {
      font-size: 2.5rem;
      color: #1a73e8;
      margin-bottom: 12px;
    }
    .section-title {
      font-size: 1.8rem;
      color: #333;
      margin: 40px 0 8px;
    }
    .section-desc {
      color: #666;
      margin-bottom: 24px;
      font-style: italic;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      gap: 32px;
    }
    .showcase-card {
      padding: 24px;
      margin-bottom: 32px;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      border: 1px solid #eee;
    }
    .full-width {
      grid-column: 1 / -1;
    }
    .actions {
      display: flex;
      justify-content: center;
      margin-top: 64px;
      padding-bottom: 64px;
    }
  `]
})
export class PrimitiveShowcaseComponent implements OnInit {
  data: any = {
    keyword: 'OntologyValue',
    oneline: 'A brief title for the object',
    paragraph: 'This is a longer multiline description parsed from the ontology structure.',
    boolean: true,
    keywordSet: ['Ontology', 'Semantic', 'Frontend']
  };

  simpleData: any = {};
  complexData: any = {};

  keywordStruct: OntologyStructure = {
    identifier: 'dataset:keyword', classname: 'dataset:Keyword',
    isClassification: false, isParagraph: false, isOneLine: false, isEmail: false, isURL: false, isBoolean: false, isKeywordSet: false, isFileSource: false,
    label: 'Standard Keyword'
  };

  onelineStruct: OntologyStructure = {
    identifier: 'dataset:title', classname: 'dataset:OnLine',
    isClassification: false, isParagraph: false, isOneLine: true, isEmail: false, isURL: false, isBoolean: false, isKeywordSet: false, isFileSource: false,
    label: 'Document Title'
  };

  paragraphStruct: OntologyStructure = {
    identifier: 'dataset:description', classname: 'dataset:Paragraph',
    isClassification: false, isParagraph: true, isOneLine: false, isEmail: false, isURL: false, isBoolean: false, isKeywordSet: false, isFileSource: false,
    label: 'Detailed Description'
  };

  booleanStruct: OntologyStructure = {
    identifier: 'dataset:active', classname: 'dataset:BooleanDataType',
    isClassification: false, isParagraph: false, isOneLine: false, isEmail: false, isURL: false, isBoolean: true, isKeywordSet: false, isFileSource: false,
    label: 'Is Active'
  };

  keywordSetStruct: OntologyStructure = {
    identifier: 'dataset:keywordset', classname: 'dataset:DescriptionKeywordSet',
    isClassification: false, isParagraph: false, isOneLine: false, isEmail: false, isURL: false, isBoolean: false, isKeywordSet: true, isFileSource: false,
    label: 'Keyword Set'
  };

  simpleRecursiveStruct?: OntologyStructure;
  complexRecursiveStruct?: OntologyStructure;

  private ontologyService = inject(OntologyService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.ontologyService.getUITemplate("dataset:DataDescriptionFileStaging").subscribe({
      next: (struct) => {
        console.log("Fetched Simple Recursive Struct:", struct);
        this.simpleRecursiveStruct = struct;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error fetching simple struct:", err)
    });

    this.ontologyService.getUITemplate("dataset:ActivityRepositoryInitialReadInfo").subscribe({
      next: (struct) => {
        console.log("Fetched Complex Recursive Struct:", struct);
        this.complexRecursiveStruct = struct;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error fetching complex struct:", err)
    });
  }

  logData() {
    console.log('Simple Recursive Data:', this.simpleData);
    console.log('Complex Recursive Data:', this.complexData);
    alert('Logged to console.');
  }
}
