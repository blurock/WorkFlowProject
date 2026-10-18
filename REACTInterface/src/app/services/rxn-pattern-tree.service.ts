import { Injectable } from '@angular/core';
import { CatalogItem } from './react-cloud-api.service';
import {
  ReactionPatternClassNode,
  ReactionPatternLeafNode,
  ReactionPatternPrefixGroupNode
} from '../models/rxn-pattern-tree.models';

@Injectable({
  providedIn: 'root'
})
export class RxnPatternTreeService {

  /**
   * Maps a specific reaction pattern name to its generalized class name.
   * Reproduces the classification algorithm from REACTCLOUD/programs/generate_reaction_pattern_summary.py:
   * 
   * 1. Substitution patterns inside parentheses:
   *    - (h), (hr), (rhh), etc. -> (X), (XX), (XXX)
   *    - (q), (qq), (hrq), etc. -> (Q), (QQ), (QQQ)
   * 2. Trailing dash suffixes of length 2 to 4:
   *    - -HH, -RHH, -RRRR -> -XX, -XXX, -XXXX
   *    - -QQ, -QQQQ       -> -QQ, -QQQQ
   */
  public patNameToClass(name: string): string {
    if (!name || typeof name !== 'string') return '';

    // Step 1: Replace parenthesized substitution groups (e.g., (rhh) -> (XXX), (qq) -> (QQ))
    const withParens = name.replace(/\(([a-zA-Z]+)\)/g, (match: string, content: string) => {
      const lower = content.toLowerCase();
      if (content.length > 0 && [...lower].every(c => c === 'h' || c === 'r')) {
        return '(' + 'X'.repeat(content.length) + ')';
      } else if (content.length > 0 && [...lower].every(c => c === 'q')) {
        return '(' + 'Q'.repeat(content.length) + ')';
      } else if (content.length > 0 && [...lower].every(c => c === 'h' || c === 'r' || c === 'q')) {
        return '(' + 'Q'.repeat(content.length) + ')';
      }
      return match;
    });

    // Step 2: Replace trailing dash substitution suffix of 2 to 4 chars (e.g., -HHH -> -XXX, -RR -> -XX)
    const withDashes = withParens.replace(/(-)([HRQhrq]{2,4})$/, (match: string, prefix: string, content: string) => {
      const lower = content.toLowerCase();
      if (content.length > 0 && [...lower].every(c => c === 'h' || c === 'r')) {
        return prefix + 'X'.repeat(content.length);
      } else if (content.length > 0 && [...lower].every(c => c === 'q')) {
        return prefix + 'Q'.repeat(content.length);
      } else if (content.length > 0 && [...lower].every(c => c === 'h' || c === 'r' || c === 'q')) {
        return prefix + 'Q'.repeat(content.length);
      }
      return match;
    });

    return withDashes;
  }

  /**
   * Determines if a class name or pattern represents a Q-class
   * (e.g. QOOH, peroxy, hydroperoxide radical pathways).
   */
  public isQClass(className: string): boolean {
    if (!className) return false;
    return className.includes('(Q') || className.includes('-Q') || className.toLowerCase().includes('qooh');
  }

  /**
   * Extracts terms from a pattern or class name.
   * Reaction pattern names are composed of a concatenation of terms,
   * where each term starts with a Capital followed by lowercase letters.
   */
  public extractTerms(name: string): string[] {
    if (!name || typeof name !== 'string') return [];

    // Strip trailing substitution parameters inside parentheses or trailing hyphens
    const clean = name.replace(/\([^)]*\)/g, '').replace(/-+$/, '');
    if (!clean) return [];

    // If string starts with lowercase (e.g. cyclohexane), capitalize first char for uniformity
    const base = clean.charAt(0).toUpperCase() + clean.slice(1);

    // Each term starts with a Capital followed by lowercase letters
    const terms = base.match(/[A-Z][a-z]*/g);
    return terms || [clean];
  }

  /**
   * Computes the common prefix of terms shared between two term lists.
   */
  public getCommonPrefix(termsA: string[], termsB: string[]): string[] {
    const common: string[] = [];
    const minLen = Math.min(termsA.length, termsB.length);
    for (let i = 0; i < minLen; i++) {
      if (termsA[i] === termsB[i]) {
        common.push(termsA[i]);
      } else {
        break;
      }
    }
    return common;
  }

  /**
   * Groups a list of reaction pattern classes into prefix groups (Level 1 of the tree).
   * Classes are ordered alphabetically. If a series of consecutive classes have the same prefix
   * (the same set of terms), they are grouped together.
   * 
   * @param classes Sorted or unsorted reaction pattern classes
   * @param defaultExpanded Whether groups should be initially expanded
   * @returns Array of ReactionPatternPrefixGroupNode representing Level 1 of the tree
   */
  public groupClassesByPrefix(
    classes: ReactionPatternClassNode[],
    defaultExpanded: boolean = false
  ): ReactionPatternPrefixGroupNode[] {
    if (!classes || classes.length === 0) return [];

    // Sort classes alphabetically by className
    const sorted = [...classes].sort((a, b) =>
      a.className.localeCompare(b.className, undefined, { sensitivity: 'base' })
    );

    const groups: ReactionPatternPrefixGroupNode[] = [];
    let currentRun: ReactionPatternClassNode[] = [sorted[0]];
    let currentPrefix = this.extractTerms(sorted[0].className);

    for (let i = 1; i < sorted.length; i++) {
      const nextNode = sorted[i];
      const nextTerms = this.extractTerms(nextNode.className);
      const common = this.getCommonPrefix(currentPrefix, nextTerms);

      if (common.length >= 1) {
        // Consecutive classes share the same prefix terms
        currentRun.push(nextNode);
        currentPrefix = common;
      } else {
        // Close current group and start a new one
        const prefixStr = currentPrefix.length > 0
          ? currentPrefix.join('')
          : this.extractTerms(currentRun[0].className).join('') || currentRun[0].className;

        groups.push(this.createGroupNode(prefixStr, currentRun, defaultExpanded));

        currentRun = [nextNode];
        currentPrefix = nextTerms;
      }
    }

    if (currentRun.length > 0) {
      const prefixStr = currentPrefix.length > 0
        ? currentPrefix.join('')
        : this.extractTerms(currentRun[0].className).join('') || currentRun[0].className;
      groups.push(this.createGroupNode(prefixStr, currentRun, defaultExpanded));
    }

    return groups;
  }

  private createGroupNode(
    prefix: string,
    classes: ReactionPatternClassNode[],
    defaultExpanded: boolean
  ): ReactionPatternPrefixGroupNode {
    const patternCount = classes.reduce((sum, c) => sum + (c.patterns?.length || c.count || 0), 0);
    const isQGroup = classes.some(c => c.isQClass);

    return {
      prefix,
      classes,
      classCount: classes.length,
      patternCount,
      isQGroup,
      isExpanded: defaultExpanded
    };
  }

  /**
   * Transforms a linear list of CatalogItem objects into Level 2 class nodes:
   * Level 2: ReactionPatternClassNode (generalized class)
   * Level 3: ReactionPatternLeafNode[] (specific reaction patterns belonging to that class)
   * 
   * @param items Linear array of CatalogItem reaction patterns
   * @param defaultExpanded Whether class nodes should be expanded initially (default false)
   * @returns Array of reaction pattern class nodes sorted alphabetically
   */
  public buildClassNodes(items: CatalogItem[], defaultExpanded: boolean = false): ReactionPatternClassNode[] {
    if (!items || items.length === 0) {
      return [];
    }

    const classMap = new Map<string, ReactionPatternLeafNode[]>();

    for (const item of items) {
      const className = this.patNameToClass(item.name);
      const leafNode: ReactionPatternLeafNode = {
        ...item,
        className,
        isQPattern: this.isQClass(className)
      };

      if (!classMap.has(className)) {
        classMap.set(className, []);
      }
      classMap.get(className)!.push(leafNode);
    }

    const classNodes: ReactionPatternClassNode[] = [];

    classMap.forEach((patterns, className) => {
      // Sort patterns alphabetically within the class
      patterns.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

      classNodes.push({
        className,
        isQClass: this.isQClass(className),
        patterns,
        count: patterns.length,
        isExpanded: defaultExpanded
      });
    });

    // Sort classes alphabetically by className
    classNodes.sort((a, b) => a.className.localeCompare(b.className, undefined, { sensitivity: 'base' }));

    return classNodes;
  }

  /**
   * Transforms a linear list of CatalogItem objects into a three-level tree:
   * Level 1: ReactionPatternPrefixGroupNode (common prefix of consecutive classes)
   * Level 2: ReactionPatternClassNode (generalized class)
   * Level 3: ReactionPatternLeafNode[] (specific reaction patterns belonging to that class)
   * 
   * @param items Linear array of CatalogItem reaction patterns
   * @param defaultExpanded Whether nodes should be expanded initially (default false)
   * @returns Three-level sorted tree of reaction pattern prefix groups
   */
  public buildTree(items: CatalogItem[], defaultExpanded: boolean = false): ReactionPatternPrefixGroupNode[] {
    const classNodes = this.buildClassNodes(items, defaultExpanded);
    return this.groupClassesByPrefix(classNodes, defaultExpanded);
  }

  /**
   * Convenience helper to build a three-level tree from a list of raw string pattern names.
   */
  public buildTreeFromNames(names: string[], defaultExpanded: boolean = false): ReactionPatternPrefixGroupNode[] {
    if (!names || names.length === 0) return [];
    const items: CatalogItem[] = names.map((name, idx) => ({
      id: (idx + 1).toString(),
      name,
      rawLine: `: --> ${idx + 1} ${name}`
    }));
    return this.buildTree(items, defaultExpanded);
  }

  /**
   * Filters a three-level tree by a search query matching prefix groups, class names, or pattern names.
   * If a prefix group matches, all its classes and patterns are preserved.
   * If a class matches, all its patterns are preserved under that class.
   * If only specific patterns match, the prefix and class nodes are kept with only the matching patterns.
   */
  public filterTree(tree: ReactionPatternPrefixGroupNode[], query: string): ReactionPatternPrefixGroupNode[] {
    if (!query || !query.trim()) {
      return tree;
    }

    const q = query.trim().toLowerCase();
    const result: ReactionPatternPrefixGroupNode[] = [];

    for (const group of tree) {
      const groupMatches = group.prefix.toLowerCase().includes(q);

      if (groupMatches) {
        // If the top-level prefix group matches, include all its classes and patterns, expanded
        result.push({
          ...group,
          isExpanded: true,
          classes: group.classes.map(c => ({
            ...c,
            isExpanded: true
          }))
        });
      } else {
        // Check individual classes in the group
        const matchingClasses: ReactionPatternClassNode[] = [];

        for (const classNode of group.classes) {
          const classMatches = classNode.className.toLowerCase().includes(q);
          const matchingPatterns = classNode.patterns.filter(p =>
            p.name.toLowerCase().includes(q)
          );

          if (classMatches) {
            matchingClasses.push({
              ...classNode,
              isExpanded: true
            });
          } else if (matchingPatterns.length > 0) {
            matchingClasses.push({
              ...classNode,
              patterns: matchingPatterns,
              count: matchingPatterns.length,
              isExpanded: true
            });
          }
        }

        if (matchingClasses.length > 0) {
          result.push({
            ...group,
            classes: matchingClasses,
            classCount: matchingClasses.length,
            patternCount: matchingClasses.reduce((sum, c) => sum + c.patterns.length, 0),
            isExpanded: true
          });
        }
      }
    }

    return result;
  }

  /**
   * Recursively expands or collapses all prefix groups and class nodes in the tree.
   */
  public expandAll(tree: ReactionPatternPrefixGroupNode[], expanded: boolean = true): void {
    if (!tree) return;
    for (const group of tree) {
      group.isExpanded = expanded;
      for (const classNode of group.classes) {
        classNode.isExpanded = expanded;
      }
    }
  }

  /**
   * Flattens a three-level tree back into an array of reaction pattern leaf items.
   */
  public flattenTree(tree: ReactionPatternPrefixGroupNode[]): ReactionPatternLeafNode[] {
    if (!tree) return [];
    const flat: ReactionPatternLeafNode[] = [];
    for (const group of tree) {
      for (const classNode of group.classes) {
        flat.push(...classNode.patterns);
      }
    }
    return flat;
  }
}

