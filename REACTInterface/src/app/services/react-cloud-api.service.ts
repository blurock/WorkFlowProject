import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CommandTemplatesRegistry } from '../templates/command-templates.registry';

export interface CatalogItem {
  id: string;
  name: string;
  rawLine: string;
}

export interface CatalogTask {
  id: string;
  title: string;
  inpFile: string;
  description: string;
  icon: string;
}

export interface ApiRunInputResponse {
  inputFile: string;
  root: string;
  exitCode: number;
  output: string;
  error?: string;
}

export interface ApiRunCommandsResponse {
  root: string;
  exitCode: number;
  output: string;
  error?: string;
}

export interface ApiRunSubmechanismResponse {
  molecule: string;
  rootName: string;
  mechName: string;
  exitCode: number;
  output: string;
  error?: string;
}

export interface ApiRunCombineSubmechanismResponse {
  rootName: string;
  mechName: string;
  count: number;
  exitCode: number;
  output: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReactCloudApiService {
  private readonly baseUrl = 'http://localhost:8085';

  public readonly CATALOG_TASKS: CatalogTask[] = [
    {
      id: 'molecules',
      title: 'Molecules List',
      inpFile: 'PrintMoleculeList.inp',
      description: 'Retrieve catalog of molecules from REACT database',
      icon: 'science'
    },
    {
      id: 'rxn-patterns',
      title: 'Reaction Patterns',
      inpFile: 'PrintRxnPatternsList.inp',
      description: 'Retrieve catalog of reaction patterns and kinetics templates',
      icon: 'schema'
    },
    {
      id: 'substructures',
      title: 'Sub-Structures',
      inpFile: 'PrintSubStructures.inp',
      description: 'Retrieve catalog of chemical sub-structures',
      icon: 'grain'
    },
    {
      id: 'benson-groups',
      title: 'Benson Groups',
      inpFile: 'PrintBensonList.inp',
      description: 'Retrieve catalog of Benson thermodynamic group contributions',
      icon: 'thermostat'
    },
    {
      id: 'mechanisms',
      title: 'Mechanisms List',
      inpFile: 'PrintMechanismList.inp',
      description: 'Retrieve catalog of reaction mechanisms from REACT database',
      icon: 'account_tree'
    }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Legacy file-based template execution (/api/run-input)
   */
  public runInputTask(inpFile: string, rootName: string = 'job1'): Observable<CatalogItem[]> {
    const payload = {
      inputFile: inpFile,
      root: rootName
    };

    return this.http.post<ApiRunInputResponse>(`${this.baseUrl}/api/run-input`, payload).pipe(
      map(response => {
        if (response.output) {
          return this.parseCatalogOutput(response.output);
        }
        return [];
      })
    );
  }

  /**
   * New Option A Stateless Memory-Piped execution (/api/run-commands)
   */
  public runCommands(commands: string[], rootName: string = 'job1', targetItem?: string, taskId?: string): Observable<ApiRunCommandsResponse> {
    const payload: any = {
      commands: commands,
      root: rootName
    };
    if (targetItem) {
      payload.targetItem = targetItem;
    }
    if (taskId) {
      payload.taskId = taskId;
    }

    return this.http.post<ApiRunCommandsResponse>(`${this.baseUrl}/api/run-commands`, payload);
  }

  /**
   * Run catalog task using Angular CommandTemplatesRegistry (Stateless memory-piped)
   */
  public runCatalogTaskWithRegistry(taskId: string, rootName: string = 'job1'): Observable<CatalogItem[]> {
    const commands = CommandTemplatesRegistry.getCatalogCommands(taskId);
    return this.runCommands(commands, rootName, undefined, taskId).pipe(
      map(response => {
        if (response.output) {
          return this.parseCatalogOutput(response.output);
        }
        return [];
      })
    );
  }

  /**
   * Run submechanism from path task (/api/run-submechanism)
   */
  public runSubmechanismFromPath(molecule: string, rootName: string, supplement: string = '', runRoot: string = 'read'): Observable<ApiRunSubmechanismResponse> {
    const payload = {
      molecule: molecule,
      supplement: supplement,
      rootName: rootName,
      runRoot: runRoot
    };
    return this.http.post<ApiRunSubmechanismResponse>(`${this.baseUrl}/api/run-submechanism`, payload);
  }

  /**
   * Run combine submechanisms task (/api/run-combine-submechanisms)
   */
  public runCombineSubmechanisms(rootName: string, mechName: string, submechanisms: string[]): Observable<ApiRunCombineSubmechanismResponse> {
    const payload = {
      rootName: rootName,
      mechName: mechName,
      submechanisms: submechanisms
    };
    return this.http.post<ApiRunCombineSubmechanismResponse>(`${this.baseUrl}/api/run-combine-submechanisms`, payload);
  }

  /**
   * Fetch available submechanism path root names (.lsr files in data/mechs/submechanisms)
   */
  public getSubmechanismPaths(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/api/submechanisms`);
  }

  /**
   * Parameterized lookup: fetch item detail output using CommandTemplatesRegistry (Stateless memory-piped)
   */
  public fetchItemDetails(taskId: string, itemName: string, rootName: string = 'job1'): Observable<string> {
    const commands = CommandTemplatesRegistry.getItemDetailCommands(taskId, itemName);
    return this.runCommands(commands, rootName, itemName, taskId).pipe(
      map(response => response.output || 'No output returned.')
    );
  }

  /**
   * Parses output stdout by isolating lines containing ': -->' or ':-->'
   */
  public parseCatalogOutput(output: string): CatalogItem[] {
    if (!output) return [];

    const lines = output.split(/\r?\n/);
    const matchingIndices: number[] = [];

    lines.forEach((line, index) => {
      if (line.includes(': -->') || line.includes(':-->')) {
        matchingIndices.push(index);
      }
    });

    if (matchingIndices.length === 0) {
      return [];
    }

    const firstIndex = matchingIndices[0];
    const lastIndex = matchingIndices[matchingIndices.length - 1];

    const catalogItems: CatalogItem[] = [];

    for (let i = firstIndex; i <= lastIndex; i++) {
      const line = lines[i];
      if (!line.includes(': -->') && !line.includes(':-->')) {
        continue;
      }

      // Format 1: " 24018: -->KetoHydroPeroxideDecompToAldRadical-CRRRH<--"
      const format1Match = line.match(/^\s*(\d+):\s*-->(.*)<--\s*$/);
      if (format1Match) {
        catalogItems.push({
          id: format1Match[1].trim(),
          name: format1Match[2].trim(),
          rawLine: line
        });
        continue;
      }

      // Format 2: ": -->          0: TableA.1"
      const format2Match = line.match(/: -->\s*(\d+):\s*(.+)$/);
      if (format2Match) {
        catalogItems.push({
          id: format2Match[1].trim(),
          name: format2Match[2].trim(),
          rawLine: line
        });
        continue;
      }

      // General Fallback
      const colonIndex = line.indexOf(':');
      const arrowStartIndex = line.indexOf('-->');
      const arrowEndIndex = line.indexOf('<--');

      if (arrowEndIndex !== -1 && colonIndex !== -1 && arrowStartIndex !== -1) {
        const id = line.substring(0, colonIndex).trim();
        const name = line.substring(arrowStartIndex + 3, arrowEndIndex).trim();
        catalogItems.push({ id, name, rawLine: line });
      } else if (arrowStartIndex !== -1) {
        const rest = line.substring(arrowStartIndex + 3).trim();
        const parts = rest.split(':');
        if (parts.length >= 2) {
          catalogItems.push({ id: parts[0].trim(), name: parts.slice(1).join(':').trim(), rawLine: line });
        } else {
          catalogItems.push({ id: `${i}`, name: rest, rawLine: line });
        }
      }
    }

    return catalogItems;
  }
}
