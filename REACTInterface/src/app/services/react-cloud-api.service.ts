import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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
    }
  ];

  constructor(private http: HttpClient) {}

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
   * Parses output stdout by isolating lines containing ': -->'
   * Line format: " 24018: -->KetoHydroPeroxideDecompToAldRadical-CRRRH<--"
   * The first line containing ': -->' is the start of the list.
   * The last line containing ': -->' is the end of the list.
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
