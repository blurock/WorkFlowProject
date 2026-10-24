import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ChemStructureParserService } from './chem-structure-parser.service';
import { ExistenceCheckService } from './existence-check.service';
import { ReactCloudApiService } from './react-cloud-api.service';
import { CommandTemplatesRegistry } from '../templates/command-templates.registry';

export interface TargetMoleculeCheckResult {
  effectiveName: string;
  requestedName: string;
  isExisting: boolean;
  matchedDbName?: string;
  sdfContent: string;
  rawLog: string;
}

@Injectable({
  providedIn: 'root'
})
export class TargetMoleculeService {
  public pendingMolfileForEditor: string | null = null;
  public pendingStructureNameForEditor: string | null = null;
  public pendingStructureTypeForEditor: 'Molecule' | 'Substructure' = 'Molecule';

  constructor(
    private chemParser: ChemStructureParserService,
    private existenceCheckService: ExistenceCheckService,
    private reactCloudApi: ReactCloudApiService
  ) {}

  /**
   * Translates drawn molfile to canonical REACT SDF and checks database existence.
   * If molecule exists, returns existing database name.
   * If molecule does not exist, returns requested name (defaults to 'Temporary').
   */
  public async checkTargetMolecule(
    molfile: string,
    requestedName: string = 'Temporary'
  ): Promise<TargetMoleculeCheckResult> {
    const cleanName = (requestedName || 'Temporary').trim() || 'Temporary';

    if (!molfile || !molfile.trim()) {
      throw new Error('No molecule structure provided in canvas.');
    }

    // 1. Translate Ketcher molfile to canonical REACT SDF format
    const translatedSdf = this.chemParser.translateKetcherToSdf(molfile, cleanName, 'Molecule');
    if (!translatedSdf) {
      throw new Error('Failed to parse and translate Ketcher molfile. Please verify drawing.');
    }

    // 2. Prepare upload payload for existence check
    const filesToUpload = [
      { filename: `${cleanName}.sdf`, content: translatedSdf }
    ];

    // 3. Execute existence check
    const result = await this.existenceCheckService.checkDatabaseExistence(
      'molecule',
      'sdf',
      cleanName,
      `${cleanName}_out`,
      filesToUpload
    );

    let isExisting = false;
    let matchedDbName: string | undefined = undefined;

    if (result.items && result.items.length > 0) {
      for (const item of result.items) {
        if (item.inDatabase || (item.exactMatch && item.exactMatch !== 'NONE' && item.exactMatch !== 'NOT_FOUND')) {
          isExisting = true;
          matchedDbName = item.exactMatch || item.dbId || undefined;
          break;
        }
      }
    }

    const effectiveName = isExisting && matchedDbName ? matchedDbName : cleanName;

    return {
      effectiveName,
      requestedName: cleanName,
      isExisting,
      matchedDbName,
      sdfContent: translatedSdf,
      rawLog: result.rawOutput || result.executionLogText || ''
    };
  }

  /**
   * Registers/stores the target molecule into the REACT database under the given name.
   */
  public async storeTargetMolecule(
    moleculeName: string,
    sdfContent: string
  ): Promise<{ success: boolean; output: string; error?: string }> {
    const cleanName = (moleculeName || 'Temporary').trim();

    // Ensure .sdf is available in user files if needed
    await firstValueFrom(
      this.reactCloudApi.uploadUserDataFiles('', [
        { filename: `${cleanName}.sdf`, content: sdfContent }
      ])
    );

    const storeCommands = CommandTemplatesRegistry.storeMoleculesInDatabase(cleanName, `${cleanName}_out`);
    const res = await firstValueFrom(this.reactCloudApi.runCommands(storeCommands, cleanName));

    const isSuccess = (res?.exitCode ?? 0) === 0;
    return {
      success: isSuccess,
      output: res?.output || '',
      error: isSuccess ? undefined : (res?.error || 'Database store command exited with non-zero exit code')
    };
  }
}
