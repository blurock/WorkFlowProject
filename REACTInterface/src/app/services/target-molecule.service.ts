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
  isTemporary?: boolean;
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
  ) { }

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
          const candidate = (item.exactMatch || item.dbId || '').trim();
          if (candidate && !/^(_?temp(_.*)?|temporary|target_molecule)$/i.test(candidate) && !/^\d+$/.test(candidate)) {
            isExisting = true;
            matchedDbName = candidate;
            break;
          }
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
      rawLog: result.rawOutput || result.executionLogText || '',
      isTemporary: !isExisting
    };
  }

  /**
   * Registers/stores the target molecule into the REACT database under the given name.
   */
  public async storeTargetMolecule(
    moleculeName: string,
    sdfContent: string
  ): Promise<{ success: boolean; output: string; effectiveName: string; error?: string }> {
    const rawName = (moleculeName || '').trim();
    const isTemp = !rawName || rawName.toLowerCase() === 'temporary' || rawName.toLowerCase() === 'target_molecule';
    const cleanName = isTemp ? `Temp_${Date.now()}` : rawName;
    const sdfFilename = `${cleanName}.sdf`;

    // Ensure the title line (line 1) of the SDF matches cleanName so chemdb registers it under cleanName
    let adjustedSdf = sdfContent;
    if (adjustedSdf && adjustedSdf.trim()) {
      const firstNewline = adjustedSdf.indexOf('\n');
      if (firstNewline > 0) {
        adjustedSdf = cleanName + adjustedSdf.substring(firstNewline);
      }
    }

    // Ensure .sdf is available via Cloud Storage
    let fileUrl: string | undefined = undefined;
    try {
      const uploadRes = await firstValueFrom(
        this.reactCloudApi.uploadFileToStorage({ filename: sdfFilename, content: adjustedSdf }, '')
      );
      if (uploadRes?.gcsPath) fileUrl = uploadRes.gcsPath;
    } catch (e) {
      await firstValueFrom(
        this.reactCloudApi.uploadUserDataFiles('', [
          { filename: sdfFilename, content: adjustedSdf }
        ])
      );
    }

    const storeCommands = CommandTemplatesRegistry.storeMoleculesInDatabase(cleanName, `${cleanName}_out`);
    const res = await firstValueFrom(this.reactCloudApi.runCommands(storeCommands, cleanName, undefined, undefined, fileUrl, sdfFilename));

    const isSuccess = (res?.exitCode ?? 0) === 0;
    return {
      success: isSuccess,
      output: res?.output || '',
      effectiveName: cleanName,
      error: isSuccess ? undefined : (res?.error || 'Database store command exited with non-zero exit code')
    };
  }

  /**
   * Deletes a molecule from the database and prunes its classification key.
   */
  public async deleteTargetMolecule(moleculeName: string): Promise<boolean> {
    if (!moleculeName || !moleculeName.trim()) return false;
    try {
      const res = await firstValueFrom(this.reactCloudApi.deleteDatabaseRecord('Molecules', moleculeName.trim()));
      return res?.success ?? true;
    } catch (err) {
      console.warn(`[TargetMoleculeService] Error deleting target molecule '${moleculeName}':`, err);
      return false;
    }
  }

  /**
   * Promotes an ephemeral/scratch target molecule to a permanent named catalog molecule.
   * Stores the structure under newCleanName, and removes the old ephemeral record if different.
   */
  public async promoteTargetMolecule(
    ephemeralName: string,
    newCleanName: string,
    sdfContent: string
  ): Promise<{ success: boolean; error?: string }> {
    const targetName = (newCleanName || '').trim();
    if (!targetName) {
      return { success: false, error: 'Target catalog molecule name cannot be empty.' };
    }

    const storeRes = await this.storeTargetMolecule(targetName, sdfContent);
    if (!storeRes.success) {
      return { success: false, error: storeRes.error || 'Failed to store molecule under new name.' };
    }

    // Clean up old ephemeral record if different
    if (ephemeralName && ephemeralName !== targetName) {
      await this.deleteTargetMolecule(ephemeralName);
    }

    return { success: true };
  }
}
