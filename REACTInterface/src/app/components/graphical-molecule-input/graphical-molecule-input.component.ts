import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';

import { KetcherViewerComponent } from '../ketcher-viewer/ketcher-viewer.component';
import { ReactCloudApiService } from '../../services/react-cloud-api.service';
import { ExistenceCheckService } from '../../services/existence-check.service';
import { ExecutionOutputParserService, ExecutionOutputSections, MoleculeSubSection } from '../../services/execution-output-parser.service';
import { TaskOutputParserService } from '../../services/task-output-parser.service';
import { ChemStructureParserService } from '../../services/chem-structure-parser.service';
import { TargetMoleculeService } from '../../services/target-molecule.service';
import { CommandTemplatesRegistry } from '../../templates/command-templates.registry';
import { MoleculeSection } from '../../models/task-list.models';
import { ElectronicPropertiesCardComponent } from '../task-list-view/cards/electronic-properties-card.component';
import { AtomicRadiiCardComponent } from '../task-list-view/cards/atomic-radii-card.component';

export type StructureType = 'Molecule' | 'Substructure';
export type ThermoMethod = 'NASA' | 'Benson Table';
export type BensonUnitType = 'Calorie' | 'Joule';

export interface AlternativeNameRow {
  type: 'CHEMKIN' | 'Short' | 'Formula' | string;
  name: string;
}

export interface BensonTempRow {
  temperature: number;
  value: number;
}

@Component({
  selector: 'app-graphical-molecule-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatRadioModule,
    MatTableModule,
    MatProgressBarModule,
    MatChipsModule,
    KetcherViewerComponent,
    ElectronicPropertiesCardComponent,
    AtomicRadiiCardComponent
  ],
  templateUrl: './graphical-molecule-input.component.html',
  styleUrls: ['./graphical-molecule-input.component.scss']
})
export class GraphicalMoleculeInputComponent implements OnInit {
  @ViewChild('ketcherCanvas') ketcherCanvas!: KetcherViewerComponent;

  public initialMolfile: string | null = null;

  // Panel 1: Structure Type and Name
  public structureType: StructureType = 'Molecule';
  public structureName: string = '';

  // Panel 2: Alternative Names (for Molecules only)
  public alternativeNames: AlternativeNameRow[] = [
    { type: 'CHEMKIN', name: '' },
    { type: 'Short', name: '' },
    { type: 'Formula', name: '' }
  ];
  public altNameTypes: string[] = ['CHEMKIN', 'Short', 'Formula'];
  public altNameColumns: string[] = ['type', 'name', 'actions'];

  // Panel 3: Thermodynamic Information (for Molecules only)
  public thermoMethod: ThermoMethod = 'NASA';
  
  // Panel 3a: NASA CHEMKIN Block
  public nasaTextBlock: string = '';

  // Panel 3b: Benson Thermodynamic Data
  public bensonUnit: BensonUnitType = 'Calorie';
  public bensonEnthalpy: number | null = null;
  public bensonEntropy: number | null = null;
  public bensonTemperatures: BensonTempRow[] = [
    { temperature: 298, value: 0 },
    { temperature: 400, value: 0 },
    { temperature: 500, value: 0 },
    { temperature: 600, value: 0 },
    { temperature: 800, value: 0 },
    { temperature: 1000, value: 0 },
    { temperature: 1500, value: 0 }
  ];
  public bensonColumns: string[] = ['temperature', 'value', 'actions'];

  // Panel 4: Actions & Execution State
  public isChecking: boolean = false;
  public isStoring: boolean = false;
  public checkCompleted: boolean = false;
  public inDatabase: boolean = false;
  public matchedDbId: string = '';
  public storeCompleted: boolean = false;
  public statusMessage: string = '';
  public errorMessage: string = '';

  // Panel 5: Execution Log Panel
  public executionLogText: string = '';
  public logExpanded: boolean = true;

  // Panel 6: Molecule Information Panel (Output / Semi-Empirical Calculations)
  public electronicSection: MoleculeSection | null = null;
  public atomicRadiiSection: MoleculeSection | null = null;
  public moleculeInfoExpanded: boolean = true;
  public moleculeSdfPreview: string = '';

  constructor(
    private reactCloudApi: ReactCloudApiService,
    private existenceCheckService: ExistenceCheckService,
    private outputParserService: ExecutionOutputParserService,
    private taskOutputParser: TaskOutputParserService,
    private chemParser: ChemStructureParserService,
    private targetMoleculeService: TargetMoleculeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.resetThermodynamicDefaults();

    if (this.targetMoleculeService?.pendingMolfileForEditor) {
      this.initialMolfile = this.targetMoleculeService.pendingMolfileForEditor;
      if (this.targetMoleculeService.pendingStructureTypeForEditor) {
        this.structureType = this.targetMoleculeService.pendingStructureTypeForEditor;
      }
      if (this.targetMoleculeService.pendingStructureNameForEditor) {
        this.structureName = this.targetMoleculeService.pendingStructureNameForEditor;
      }
      this.targetMoleculeService.pendingMolfileForEditor = null;
      this.targetMoleculeService.pendingStructureNameForEditor = null;
      this.snackBar.open('Structure successfully imported into Molecule Creator & Editor', 'Dismiss', { duration: 3000 });
    }
  }

  // --- Helpers for Panel 1 ---
  public get isMolecule(): boolean {
    return this.structureType === 'Molecule';
  }

  public onStructureTypeChange(): void {
    this.checkCompleted = false;
    this.inDatabase = false;
    this.storeCompleted = false;
    this.errorMessage = '';
    this.statusMessage = '';
  }

  // --- Helpers for Panel 2: Alternative Names ---
  public addAlternativeNameRow(): void {
    this.alternativeNames = [...this.alternativeNames, { type: 'CHEMKIN', name: '' }];
  }

  public removeAlternativeNameRow(index: number): void {
    if (this.alternativeNames.length > 1) {
      this.alternativeNames = this.alternativeNames.filter((_, i) => i !== index);
    } else {
      this.alternativeNames[0].name = '';
    }
  }

  // --- Helpers for Panel 3: Thermodynamics ---
  public addBensonTempRow(): void {
    const nextTemp = this.bensonTemperatures.length > 0 
      ? this.bensonTemperatures[this.bensonTemperatures.length - 1].temperature + 100 
      : 298;
    this.bensonTemperatures = [...this.bensonTemperatures, { temperature: nextTemp, value: 0 }];
  }

  public removeBensonTempRow(index: number): void {
    if (this.bensonTemperatures.length > 1) {
      this.bensonTemperatures = this.bensonTemperatures.filter((_, i) => i !== index);
    }
  }

  private resetThermodynamicDefaults(): void {
    this.nasaTextBlock = '';
    this.bensonEnthalpy = null;
    this.bensonEntropy = null;
    this.bensonTemperatures = [
      { temperature: 298, value: 0 },
      { temperature: 400, value: 0 },
      { temperature: 500, value: 0 },
      { temperature: 600, value: 0 },
      { temperature: 800, value: 0 },
      { temperature: 1000, value: 0 },
      { temperature: 1500, value: 0 }
    ];
  }

  // --- Step 1: Check Database ---
  public async checkDatabase(): Promise<void> {
    this.errorMessage = '';
    this.statusMessage = '';
    this.checkCompleted = false;
    this.storeCompleted = false;
    this.inDatabase = false;
    this.matchedDbId = '';

    const name = (this.structureName || '').trim();
    if (!name) {
      this.errorMessage = 'Please enter a structure name in Panel 1 before checking.';
      return;
    }

    if (!this.ketcherCanvas) {
      this.errorMessage = 'Ketcher canvas is not available.';
      return;
    }

    this.isChecking = true;
    this.statusMessage = 'Exporting drawing from Ketcher and translating...';

    try {
      // 1. Export drawing from Ketcher
      const exportedMolfile = await this.ketcherCanvas.exportStructureFromKetcher('mol');
      if (!exportedMolfile || !exportedMolfile.trim()) {
        throw new Error('No chemical structure detected in Ketcher drawing canvas. Please draw a molecule first.');
      }

      // 2. Translate Ketcher molfile to canonical REACTCLOUD SDF
      const activeAltNames = this.isMolecule 
        ? this.alternativeNames.filter(a => !!a.name && a.name.trim().length > 0)
        : [];
      
      const translatedSdf = this.chemParser.translateKetcherToSdf(
        exportedMolfile,
        name,
        this.structureType,
        activeAltNames
      );

      if (!translatedSdf) {
        throw new Error('Failed to parse and translate Ketcher molfile counts line. Verify structure in canvas.');
      }

      this.moleculeSdfPreview = translatedSdf;
      this.statusMessage = 'Uploading translated structure and executing existence check...';

      // 3. Prepare payload files for orchestrator
      const filesToUpload: { filename: string; content: string }[] = [
        { filename: `${name}.sdf`, content: translatedSdf }
      ];

      // If NASA CHEMKIN data provided, prepare .thm file
      if (this.isMolecule && this.thermoMethod === 'NASA' && this.nasaTextBlock.trim()) {
        filesToUpload.push({
          filename: `${name}.thm`,
          content: this.nasaTextBlock.trim()
        });
      }

      // 4. Run Existence Check using ExistenceCheckService
      const dataTypeKey = this.structureType === 'Substructure' ? 'substructure' : 'molecule';
      const result = await this.existenceCheckService.checkDatabaseExistence(
        dataTypeKey,
        'sdf',
        name,
        `${name}_out`,
        filesToUpload
      );

      this.executionLogText = result.rawOutput || result.executionLogText;

      // 5. Parse Output with TaskOutputParserService & ExecutionOutputParserService for Panel 6
      const parsedSections = this.taskOutputParser.parseSectionsFromOutput(result.rawOutput, dataTypeKey);
      this.electronicSection = parsedSections.find(s => s.title.toLowerCase().includes('electronic')) || null;
      this.atomicRadiiSection = parsedSections.find(s => s.title.toLowerCase().includes('radii') || s.title.toLowerCase().includes('charge')) || null;

      // Fallback: If not detected by chunk parser, parse from ExecutionOutputParserService subSections
      const outputSections = this.outputParserService.parseExecutionOutput(result.rawOutput, dataTypeKey);
      let subSections: MoleculeSubSection[] = [];
      if (outputSections.parsedDataStructures.length > 0) {
        subSections = outputSections.parsedDataStructures[0].subSections || [];
      }

      if (!this.electronicSection && subSections.length > 0) {
        const sub = subSections.find(s => s.title.toLowerCase().includes('electronic'));
        if (sub) {
          const lines = sub.content.split(/\r?\n/);
          this.electronicSection = {
            id: 1,
            title: 'Electronic Properties & Shells',
            icon: 'bolt',
            content: sub.content,
            isExpanded: true,
            electronicTableData: ElectronicPropertiesCardComponent.parseElectronicTable(lines)
          };
        }
      }

      if (!this.atomicRadiiSection && subSections.length > 0) {
        const sub = subSections.find(s => s.title.toLowerCase().includes('radii') || s.title.toLowerCase().includes('charge'));
        if (sub) {
          const lines = sub.content.split(/\r?\n/);
          this.atomicRadiiSection = {
            id: 2,
            title: 'Atomic Radii, Electronegativity & Charge Factors',
            icon: 'scatter_plot',
            content: sub.content,
            isExpanded: true,
            chargeTableData: AtomicRadiiCardComponent.parseChargeTable(lines)
          };
        }
      }

      if (this.electronicSection) {
        this.electronicSection.isExpanded = true;
      }
      if (this.atomicRadiiSection) {
        this.atomicRadiiSection.isExpanded = true;
      }

      // 6. Evaluate existence status
      let foundExact = false;
      if (result.items && result.items.length > 0) {
        for (const item of result.items) {
          if (item.inDatabase || (item.exactMatch && item.exactMatch !== 'NONE' && item.exactMatch !== 'NOT_FOUND')) {
            foundExact = true;
            this.matchedDbId = item.exactMatch || item.dbId || 'Found in DB';
            break;
          }
        }
      }

      this.checkCompleted = true;
      this.inDatabase = foundExact;

      if (this.inDatabase) {
        this.statusMessage = `Structure already exists in REACT database (${this.matchedDbId}).`;
        this.snackBar.open(`Structure already exists in DB (${this.matchedDbId})`, 'Dismiss', { duration: 4000 });
      } else {
        this.statusMessage = 'Structure is NEW. Ready to store in database!';
        this.snackBar.open('Structure is NEW. You can now store it in the database.', 'OK', { duration: 3500 });
      }

    } catch (err: any) {
      console.error('[GraphicalMoleculeInput] Check error:', err);
      this.errorMessage = err?.message || 'Error occurred during database existence check.';
    } finally {
      this.isChecking = false;
    }
  }

  // --- Step 2: Store in Database ---
  public async storeInDatabase(): Promise<void> {
    if (!this.checkCompleted || this.inDatabase) {
      this.errorMessage = 'Please perform existence check first and ensure structure is not already present.';
      return;
    }

    const name = (this.structureName || '').trim();
    if (!name) return;

    this.isStoring = true;
    this.statusMessage = 'Storing structure in REACT database...';
    this.errorMessage = '';

    try {
      let storeCommands: string[] = [];
      const isSub = this.structureType === 'Substructure';

      if (isSub) {
        storeCommands = CommandTemplatesRegistry.storeSubstructuresInDatabase(name);
      } else if (this.thermoMethod === 'NASA' && this.nasaTextBlock.trim()) {
        // Molecule with CHEMKIN NASA thermodynamic polynomials
        storeCommands = CommandTemplatesRegistry.readAndStoreChemkin(name);
      } else {
        // Standard Molecule Store
        storeCommands = CommandTemplatesRegistry.storeMoleculesInDatabase(name, `${name}_out`);
      }

      const res = await firstValueFrom(this.reactCloudApi.runCommands(storeCommands, name));
      const storeOutput = res?.output || res?.error || '';
      
      this.executionLogText += '\n\n--- Database Store Output ---\n' + storeOutput;

      if ((res?.exitCode ?? 0) === 0) {
        this.storeCompleted = true;
        this.statusMessage = `Successfully stored ${name} in the REACT database!`;
        this.snackBar.open(`Structure '${name}' saved to database!`, 'Success', { duration: 4000 });
      } else {
        throw new Error(res?.error || 'Database store command exited with an error code.');
      }
    } catch (err: any) {
      console.error('[GraphicalMoleculeInput] Store error:', err);
      this.errorMessage = err?.message || 'Error occurred while saving to database.';
    } finally {
      this.isStoring = false;
    }
  }

  public onCopySection(section: MoleculeSection): void {
    if (section?.content) {
      navigator.clipboard.writeText(section.content);
      this.snackBar.open(`Copied ${section.title} to clipboard!`, 'OK', { duration: 2500 });
    }
  }

  public resetAll(): void {
    this.structureName = '';
    this.structureType = 'Molecule';
    this.alternativeNames = [
      { type: 'CHEMKIN', name: '' },
      { type: 'Short', name: '' },
      { type: 'Formula', name: '' }
    ];
    this.resetThermodynamicDefaults();
    this.checkCompleted = false;
    this.inDatabase = false;
    this.matchedDbId = '';
    this.storeCompleted = false;
    this.errorMessage = '';
    this.statusMessage = '';
    this.executionLogText = '';
    this.electronicSection = null;
    this.atomicRadiiSection = null;
    if (this.ketcherCanvas) {
      this.ketcherCanvas.reloadKetcherStructure();
    }
  }
}
