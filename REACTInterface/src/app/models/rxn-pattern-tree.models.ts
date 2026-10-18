import { CatalogItem } from '../services/react-cloud-api.service';

/**
 * Node representing a specific reaction pattern (Level 2 of the tree).
 * Extends CatalogItem so it can be passed directly to any catalog viewer or execution routine.
 */
export interface ReactionPatternLeafNode extends CatalogItem {
  className: string;
  isQPattern?: boolean;
}

/**
 * Node representing a reaction pattern class (Level 2 of the tree).
 * Groups specific reaction patterns under a generalized class pattern.
 */
export interface ReactionPatternClassNode {
  className: string;
  isQClass: boolean;
  patterns: ReactionPatternLeafNode[];
  count: number;
  isExpanded: boolean;
}

/**
 * Node representing a group of consecutive reaction pattern classes sharing a common prefix of terms (Level 1 of the tree).
 */
export interface ReactionPatternPrefixGroupNode {
  prefix: string;
  classes: ReactionPatternClassNode[];
  classCount: number;
  patternCount: number;
  isQGroup?: boolean;
  isExpanded: boolean;
}
