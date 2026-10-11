import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ReactCloudApiService } from './react-cloud-api.service';
import { CommandTemplatesRegistry } from '../templates/command-templates.registry';

export interface ExistenceCheckItem {
  id: string;
  name: string;
  substructureMatch?: string;
  exactMatch?: string;
  dbId?: string;
  inDatabase: boolean;
  status: 'Present' | 'New' | 'Unknown' | string;
  suggestedAction: string;
}

export interface ExistenceCheckResult {
  items: ExistenceCheckItem[];
  hasConflicts: boolean;
  rawOutput: string;
  executionLogText: string;
  logLines: { text: string; isError: boolean }[];
  exitCode: number;
  success: boolean;
  dbIdMap: Map<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class ExistenceCheckService {
  constructor(private reactCloudApi: ReactCloudApiService) {}

  /**
   * Run database existence check for a given data structure type.
   * @param dataType 'molecule' | 'substructure' | 'rxn-pattern' | 'mechanism'
   * @param format 'sdf' | 'ascii' | 'molfile'
   * @param rootName Root dataset name
   * @param outName Output file prefix
   * @param filesToUpload Optional files to upload to '.' before running the check
   */
  public async checkDatabaseExistence(
    dataType: string,
    format: string,
    rootName: string,
    outName?: string,
    filesToUpload?: { filename: string; content: string }[]
  ): Promise<ExistenceCheckResult> {
    const trimmedRoot = rootName.trim();
    const effectiveOutName = outName ? outName.trim() : `${trimmedRoot}_out`;

    // 1. Upload any data files required for check (e.g. .sdf or .lst)
    if (filesToUpload && filesToUpload.length > 0) {
      await firstValueFrom(this.reactCloudApi.uploadUserDataFiles('.', filesToUpload));
    }

    // 2. Build command sequence from CommandTemplatesRegistry
    const commands = CommandTemplatesRegistry.getReadCheckStoreCommands(
      dataType,
      'check',
      format,
      trimmedRoot,
      effectiveOutName
    );

    // 3. Execute backend commands
    const res = await firstValueFrom(this.reactCloudApi.runCommands(commands, trimmedRoot));

    const rawOutput = res?.output || res?.error || '';
    const exitCode = res?.exitCode ?? 0;
    const logLines = this.parseLogToLines(rawOutput);

    // 4. Parse raw output table into structured items, dbId map, and execution log text
    const { items, hasConflicts, dbIdMap, executionLogText } = this.parseExistenceCheckOutput(rawOutput);

    return {
      items,
      hasConflicts,
      rawOutput,
      executionLogText,
      logLines,
      exitCode,
      success: exitCode === 0,
      dbIdMap
    };
  }

  public parseLogToLines(logText: string): { text: string; isError: boolean }[] {
    if (!logText) return [];
    return logText.split(/\r?\n/).map(lineText => {
      const lower = lineText.toLowerCase();
      const isError = lower.includes('error') || lower.includes('fail') || lower.includes('cannot open');
      return { text: lineText, isError };
    });
  }

  public parseExistenceCheckOutput(output: string): {
    items: ExistenceCheckItem[];
    hasConflicts: boolean;
    dbIdMap: Map<string, string>;
    executionLogText: string;
  } {
    const items: ExistenceCheckItem[] = [];
    const dbIdMap = new Map<string, string>();
    let hasConflicts = false;

    if (!output) {
      return { items, hasConflicts, dbIdMap, executionLogText: '' };
    }

    // 1. Extract execution log starting with '--- Execution Log ---'
    let executionLogText = '';
    const execLogIdx = output.indexOf('--- Execution Log ---');
    if (execLogIdx !== -1) {
      executionLogText = output.substring(execLogIdx).trim();
    } else {
      const cmdIdx = output.indexOf('Command:');
      if (cmdIdx !== -1) {
        executionLogText = '--- Execution Log ---\n' + output.substring(cmdIdx).trim();
      } else {
        executionLogText = '--- Execution Log ---\n' + output.trim();
      }
    }

    // 2. Parse report table
    const lines = output.split(/\r?\n/);
    let inRxnPatternTable = false;
    let inGeneralTable = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.includes('--- Execution Log ---')) {
        break;
      }

      // Check header for Reaction Patterns table:
      // "Reaction_Pattern_Name               Substructure_Matches_In_DB          Exact_Match_Name"
      if (trimmed.includes('Reaction_Pattern_Name') && trimmed.includes('Substructure_Matches_In_DB')) {
        inRxnPatternTable = true;
        inGeneralTable = false;
        continue;
      }

      // General fallback header
      if (!inRxnPatternTable && trimmed.includes('Index') && trimmed.includes('Name') && (trimmed.includes('Status') || trimmed.includes('Database') || trimmed.includes('DB'))) {
        inGeneralTable = true;
        continue;
      }

      if (inRxnPatternTable) {
        if (
          trimmed.includes('Molecule Structures') ||
          trimmed.includes('--- Execution Log ---') ||
          (trimmed.startsWith('--') && !/^[\-\s]+$/.test(trimmed)) ||
          trimmed.startsWith('Command:') ||
          trimmed.startsWith('Summary:') ||
          trimmed.startsWith(':')
        ) {
          inRxnPatternTable = false;
          continue;
        }

        if (/^[\-\=\s]+$/.test(trimmed)) continue;

        const tokens = trimmed.split(/\s+/);
        if (tokens.length >= 2) {
          const rxnName = tokens[0];
          if (rxnName.startsWith('-') || rxnName.startsWith('=')) {
            inRxnPatternTable = false;
            continue;
          }

          const subMatch = tokens[1] || 'NONE';
          const exactMatch = tokens[2] || subMatch;

          const isPresent = exactMatch !== 'NONE' &&
                            exactMatch !== 'NOT_FOUND' &&
                            exactMatch !== '---' &&
                            exactMatch !== '' &&
                            !exactMatch.toUpperCase().includes('NOT_FOUND');

          if (isPresent) {
            hasConflicts = true;
          }

          items.push({
            id: `PAT-${items.length + 1}`,
            name: rxnName,
            substructureMatch: subMatch,
            exactMatch: exactMatch,
            inDatabase: isPresent,
            status: isPresent ? 'Present' : 'New',
            suggestedAction: isPresent ? 'Replace' : 'Add'
          });
        }
      } else if (inGeneralTable) {
        if (
          trimmed.includes('Molecule Structures') ||
          trimmed.includes('--- Execution Log ---') ||
          (trimmed.startsWith('--') && !/^[\-\s]+$/.test(trimmed)) ||
          trimmed.startsWith('Command:') ||
          trimmed.startsWith('Summary:') ||
          trimmed.startsWith(':')
        ) {
          inGeneralTable = false;
          continue;
        }

        if (/^[\-\=\s]+$/.test(trimmed)) continue;

        const tokens = trimmed.split(/\s+/);
        if (tokens.length >= 2) {
          let name = tokens[0];
          if (name.startsWith('-') || name.startsWith('=')) {
            inGeneralTable = false;
            continue;
          }

          let dbId = '';
          let statusStr = '';

          if (/^\d+$/.test(tokens[0]) && tokens.length >= 3) {
            name = tokens[1];
            dbId = tokens[2];
            statusStr = tokens.slice(3).join(' ') || tokens[2];
          } else if (tokens.length >= 3) {
            name = tokens[0];
            dbId = tokens[1];
            statusStr = tokens.slice(2).join(' ');
          } else {
            name = tokens[0];
            statusStr = tokens[1];
          }

          const upperStatus = statusStr.toUpperCase();
          const upperDbId = dbId.toUpperCase();
          const isNotFound = upperStatus.includes('NOT FOUND') ||
                            upperStatus.includes('NOT_FOUND') ||
                            upperStatus.includes('NOT') ||
                            upperDbId === '---' ||
                            upperDbId === 'NOT_FOUND';

          const isPresent = !isNotFound && (
            upperStatus.includes('EXISTS') ||
            upperStatus.includes('PRESENT') ||
            (upperStatus.includes('FOUND') && !upperStatus.includes('NOT')) ||
            (dbId !== '' && dbId !== '---' && dbId !== 'NOT_FOUND' && /^\d+$/.test(dbId))
          );

          if (isPresent) {
            hasConflicts = true;
            if (dbId && /^\d+$/.test(dbId)) {
              dbIdMap.set(name, dbId);
            }
          }

          items.push({
            id: `ITEM-${items.length + 1}`,
            name: name,
            dbId: dbId,
            inDatabase: isPresent,
            status: isPresent ? 'Present' : 'New',
            suggestedAction: isPresent ? 'Replace' : 'Add'
          });
        }
      }
    }

    return { items, hasConflicts, dbIdMap, executionLogText };
  }
}
