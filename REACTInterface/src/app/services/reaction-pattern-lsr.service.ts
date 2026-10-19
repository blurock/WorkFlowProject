import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReactionPatternLsrService {

  /**
   * Generates formatted .lsr file contents according to REACT submechanism standards.
   *
   * Line 1: Title
   * Line 2: Auxiliary (small) molecules as names from the database (or NONE if none)
   * Line 3+: Reaction patterns separated by ',\'
   * Line End: If auxiliary molecules present, trailing ': aux1,aux2'
   *
   * @param title Title line (e.g. 'ReactionPatternTest')
   * @param auxMolecules List of auxiliary molecule database names
   * @param reactionPatterns List of selected reaction pattern names
   * @param targetMolecule Optional target molecule name
   */
  public generateLsrContent(
    title: string,
    auxMolecules: string[],
    reactionPatterns: string[],
    targetMolecule?: string
  ): string {
    const lines: string[] = [];

    // Line 1: Title
    lines.push((title || 'ReactionPatternTest').trim());

    // Line 2: Auxiliary molecules or NONE
    const cleanAux = (auxMolecules || []).map(m => m.trim()).filter(m => !!m);
    if (cleanAux.length > 0) {
      lines.push(cleanAux.join(','));
    } else {
      lines.push('NONE');
    }

    lines.push('%%% ----------------------------------------------------');

    // Reaction patterns
    const cleanPatterns = (reactionPatterns || []).map(p => p.trim()).filter(p => !!p);
    if (cleanPatterns.length === 0) {
      lines.push('%%% No reaction patterns specified');
      return lines.join('\n') + '\n';
    }

    if (cleanAux.length > 0) {
      // Patterns with trailing ,\ and colon with auxiliary molecules
      for (let i = 0; i < cleanPatterns.length; i++) {
        lines.push(`${cleanPatterns[i]},\\`);
      }
      lines.push(`:${cleanAux.join(',')}`);
    } else {
      // Patterns without auxiliary molecules (like Decomposition.lsr)
      for (let i = 0; i < cleanPatterns.length; i++) {
        const isLast = (i === cleanPatterns.length - 1);
        lines.push(isLast ? cleanPatterns[i] : `${cleanPatterns[i]},\\`);
      }
    }

    return lines.join('\n') + '\n';
  }
}
