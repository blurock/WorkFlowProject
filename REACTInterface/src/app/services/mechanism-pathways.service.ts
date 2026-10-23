import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReadInMolecule {
  ID: number;
  Name: string;
}

export interface ReadInMoleculeSet {
  ID?: number;
  Name?: string;
  NumberOfMolecules: number;
  Molecules: ReadInMolecule[];
}

export interface ReadInReaction {
  ID: number;
  Name: string;
}

export interface ReadInReactionSet {
  ID?: number;
  Name?: string;
  NumberOfReactions: number;
  Reactions: ReadInReaction[];
}

export interface ReadChainReactionStep {
  ID?: number;
  Name?: string;
  Reactions: ReadInReactionSet;
  Molecules: ReadInMoleculeSet;
}

export interface ReadChainSet {
  ID?: number;
  Name: string;
  NumberOfSteps: number;
  ExtraMolecules?: ReadInMoleculeSet;
  Steps: ReadChainReactionStep[];
  Molecules?: ReadInMoleculeSet;
  Reactions?: ReadInReactionSet;
}

export interface PathwaySummaryItem {
  ID: number;
  Name: string;
}

@Injectable({
  providedIn: 'root'
})
export class MechanismPathwaysService {
  private readonly baseUrl = environment.apiBaseUrl || 'http://127.0.0.1:8085';

  constructor(private http: HttpClient) {}

  /**
   * Lists all MechanismPathway records stored in Firestore
   */
  public listPathways(): Observable<PathwaySummaryItem[]> {
    const url = `${this.baseUrl}/api/db/listSummary`;
    return this.http.post<{ found: boolean; records: PathwaySummaryItem[] }>(url, {
      dbName: 'MechanismPathway',
      fields: ['ID', 'Name']
    }).pipe(
      map(res => (res && res.records) ? res.records : []),
      catchError(err => {
        console.error('[MechanismPathwaysService] listPathways error:', err);
        return of([]);
      })
    );
  }

  /**
   * Fetches a single MechanismPathway by Name from Firestore
   */
  public fetchPathway(name: string): Observable<ReadChainSet | null> {
    const url = `${this.baseUrl}/api/db/fetch`;
    return this.http.post<{ found: boolean; data: any }>(url, {
      dbName: 'MechanismPathway',
      type: 'string',
      key: name
    }).pipe(
      map(res => {
        if (res && res.found && res.data) {
          const raw = res.data;
          return {
            ID: raw.ID || 0,
            Name: raw.Name || name,
            NumberOfSteps: raw.NumberOfSteps || (raw.Steps ? raw.Steps.length : 0),
            ExtraMolecules: raw.ExtraMolecules || { NumberOfMolecules: 0, Molecules: [] },
            Steps: raw.Steps || [],
            Molecules: raw.Molecules,
            Reactions: raw.Reactions
          } as ReadChainSet;
        }
        return null;
      }),
      catchError(err => {
        console.error(`[MechanismPathwaysService] fetchPathway(${name}) error:`, err);
        return of(null);
      })
    );
  }

  /**
   * Stores a MechanismPathway in Firestore
   */
  public storePathway(pathway: ReadChainSet): Observable<{ status: string; path?: string }> {
    const url = `${this.baseUrl}/api/db/store`;
    // Ensure compiled totals
    const prepared = this.compileTotals(pathway);
    return this.http.post<{ status: string; path?: string }>(url, {
      dbName: 'MechanismPathway',
      key: prepared.Name,
      keyId: prepared.ID || 0,
      jsonStr: JSON.stringify(prepared)
    });
  }

  /**
   * Deletes a MechanismPathway from Firestore
   */
  public deletePathway(name: string): Observable<{ status: string }> {
    const url = `${this.baseUrl}/api/db/delete`;
    return this.http.post<{ status: string }>(url, {
      dbName: 'MechanismPathway',
      key: name
    });
  }

  /**
   * Compiles total Molecules and Reactions across ExtraMolecules and Steps
   */
  public compileTotals(pathway: ReadChainSet): ReadChainSet {
    const molMap = new Map<string, number>();
    const rxnMap = new Map<string, number>();

    // Overall extra molecules
    if (pathway.ExtraMolecules && pathway.ExtraMolecules.Molecules) {
      pathway.ExtraMolecules.Molecules.forEach((m, idx) => {
        if (m.Name && !molMap.has(m.Name)) {
          molMap.set(m.Name, m.ID !== undefined ? m.ID : idx);
        }
      });
    }

    // Per-step molecules and reactions
    (pathway.Steps || []).forEach((step, sIdx) => {
      if (step.Molecules && step.Molecules.Molecules) {
        step.Molecules.Molecules.forEach(m => {
          if (m.Name && !molMap.has(m.Name)) {
            molMap.set(m.Name, m.ID !== undefined ? m.ID : molMap.size);
          }
        });
      }
      if (step.Reactions && step.Reactions.Reactions) {
        step.Reactions.Reactions.forEach(r => {
          if (r.Name && !rxnMap.has(r.Name)) {
            rxnMap.set(r.Name, r.ID !== undefined ? r.ID : rxnMap.size);
          }
        });
      }
    });

    const totalMols: ReadInMolecule[] = Array.from(molMap.entries()).map(([Name, ID]) => ({ ID, Name }));
    const totalRxns: ReadInReaction[] = Array.from(rxnMap.entries()).map(([Name, ID]) => ({ ID, Name }));

    return {
      ...pathway,
      NumberOfSteps: pathway.Steps ? pathway.Steps.length : 0,
      Molecules: {
        NumberOfMolecules: totalMols.length,
        Molecules: totalMols
      },
      Reactions: {
        NumberOfReactions: totalRxns.length,
        Reactions: totalRxns
      }
    };
  }

  /**
   * Formats a ReadChainSet into standard .lsr text file syntax
   */
  public generateLsr(pathway: ReadChainSet): string {
    const lines: string[] = [];
    const name = (pathway.Name || 'MechanismPathway').trim();
    lines.push(`${name}:`);

    // Auxiliary molecules for all steps
    const extraMols = (pathway.ExtraMolecules?.Molecules || []).map(m => m.Name.trim()).filter(Boolean);
    if (extraMols.length > 0) {
      lines.push(extraMols.join(','));
    } else {
      lines.push('NONE');
    }

    (pathway.Steps || []).forEach((step, index) => {
      lines.push('%%% ----------------------------------------------------');
      lines.push(`%%% Step ${index + 1}: ${step.Name || 'Reaction Step'}`);
      lines.push('%%% ----------------------------------------------------');

      const rxns = (step.Reactions?.Reactions || []).map(r => r.Name.trim()).filter(Boolean);
      const stepMols = (step.Molecules?.Molecules || []).map(m => m.Name.trim()).filter(Boolean);

      if (rxns.length === 0) {
        lines.push('%%% (No reaction patterns)');
      } else {
        for (let i = 0; i < rxns.length; i++) {
          const isLast = (i === rxns.length - 1);
          if (isLast) {
            if (stepMols.length > 0) {
              lines.push(`${rxns[i]}\\`);
              lines.push(`:${stepMols.join(',')}`);
            } else {
              lines.push(rxns[i]);
            }
          } else {
            lines.push(`${rxns[i]},\\`);
          }
        }
      }
    });

    lines.push('');
    return lines.join('\n');
  }

  /**
   * Parses an .lsr text file content into a ReadChainSet object
   */
  public parseLsr(content: string): ReadChainSet {
    const rawLines = content.split('\n').map(l => l.trim());
    // Filter out comment lines starting with %%%
    const activeLines: string[] = [];
    for (const line of rawLines) {
      if (!line || line.startsWith('%%%')) continue;
      activeLines.push(line);
    }

    if (activeLines.length === 0) {
      return {
        Name: 'NewPathway',
        NumberOfSteps: 0,
        Steps: []
      };
    }

    // Line 1: Pathway Name
    let title = activeLines[0];
    if (title.endsWith(':')) {
      title = title.substring(0, title.length - 1).trim();
    }

    // Line 2: Overall auxiliary molecules
    const extraMols: ReadInMolecule[] = [];
    if (activeLines.length > 1) {
      const line2 = activeLines[1];
      if (line2 !== 'NONE') {
        line2.split(',').map(m => m.trim()).filter(Boolean).forEach((m, idx) => {
          extraMols.push({ ID: idx, Name: m });
        });
      }
    }

    // Remaining lines: Steps separated by entries
    // Each step is: pat1,\npat2,\n...patN [optional :mol1,mol2]
    const steps: ReadChainReactionStep[] = [];
    let currentPatterns: string[] = [];
    let currentStepMols: string[] = [];

    const flushStep = () => {
      if (currentPatterns.length > 0 || currentStepMols.length > 0) {
        steps.push({
          ID: steps.length,
          Name: `Step ${steps.length + 1}`,
          Reactions: {
            NumberOfReactions: currentPatterns.length,
            Reactions: currentPatterns.map((p, idx) => ({ ID: idx, Name: p }))
          },
          Molecules: {
            NumberOfMolecules: currentStepMols.length,
            Molecules: currentStepMols.map((m, idx) => ({ ID: idx, Name: m }))
          }
        });
        currentPatterns = [];
        currentStepMols = [];
      }
    };

    for (let i = 2; i < activeLines.length; i++) {
      let line = activeLines[i];
      if (!line) continue;

      if (line.startsWith(':')) {
        // Auxiliary molecules for current step
        const mols = line.substring(1).split(',').map(m => m.trim()).filter(Boolean);
        currentStepMols.push(...mols);
        flushStep();
        continue;
      }

      // Check if line contains inline colon separator (e.g. pattern : auxmols)
      if (line.includes(':')) {
        const parts = line.split(':');
        const patPart = parts[0].replace(/\\+$/, '').replace(/,+$/, '').trim();
        if (patPart) currentPatterns.push(patPart);
        const molPart = parts[1].split(',').map(m => m.trim()).filter(Boolean);
        currentStepMols.push(...molPart);
        flushStep();
        continue;
      }

      // Check if line ends with '\' (continuation in same step)
      const hasContinuation = line.endsWith('\\');
      let clean = line.replace(/\\+$/, '').replace(/,+$/, '').trim();
      if (clean) {
        currentPatterns.push(clean);
      }

      if (!hasContinuation && i < activeLines.length - 1 && !activeLines[i + 1].startsWith(':')) {
        // If it doesn't continue with \ and next line doesn't start with :, this step ends here
        flushStep();
      }
    }
    flushStep();

    const pathway: ReadChainSet = {
      Name: title,
      NumberOfSteps: steps.length,
      ExtraMolecules: {
        NumberOfMolecules: extraMols.length,
        Molecules: extraMols
      },
      Steps: steps
    };

    return this.compileTotals(pathway);
  }
}
