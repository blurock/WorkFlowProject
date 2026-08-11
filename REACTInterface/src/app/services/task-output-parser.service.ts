import { Injectable } from '@angular/core';
import { MoleculeSection } from '../models/task-list.models';
import { BaseTaskOutputParser } from './parsers/base-task-output-parser';
import { MechanismOutputParser } from './parsers/mechanism-output-parser';
import { RxnPatternOutputParser } from './parsers/rxn-pattern-output-parser';
import { BensonGroupOutputParser } from './parsers/benson-group-output-parser';
import { MoleculeOutputParser } from './parsers/molecule-output-parser';

@Injectable({
  providedIn: 'root'
})
export class TaskOutputParserService {
  private parsers: Map<string, BaseTaskOutputParser>;

  constructor(
    private mechanismParser: MechanismOutputParser,
    private rxnPatternParser: RxnPatternOutputParser,
    private bensonGroupParser: BensonGroupOutputParser,
    private moleculeParser: MoleculeOutputParser
  ) {
    this.parsers = new Map<string, BaseTaskOutputParser>([
      ['mechanisms', this.mechanismParser],
      ['rxn-patterns', this.rxnPatternParser],
      ['benson-groups', this.bensonGroupParser],
      ['molecules', this.moleculeParser],
      ['substructures', this.moleculeParser]
    ]);
  }

  /**
   * Delegates parsing of raw task output to the appropriate task-specific output parser strategy.
   */
  public parseSectionsFromOutput(rawOutput: string, taskId: string, currentSdfContent?: string | null): MoleculeSection[] {
    const parser = this.parsers.get(taskId) || this.moleculeParser;
    return parser.parse(rawOutput, currentSdfContent);
  }
}
