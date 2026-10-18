import { RxnPatternTreeService } from './rxn-pattern-tree.service';
import { CatalogItem } from './react-cloud-api.service';

describe('RxnPatternTreeService', () => {
  let service: RxnPatternTreeService;

  beforeEach(() => {
    service = new RxnPatternTreeService();
  });

  describe('patNameToClass', () => {
    it('should map parenthesized substitution groups (h, r) to (X)', () => {
      expect(service.patNameToClass('HO2Elimination(rhh)(hr)')).toBe('HO2Elimination(XXX)(XX)');
      expect(service.patNameToClass('AddHydroxylToPropene-(hh)(h)(hhh)')).toBe('AddHydroxylToPropene-(XX)(X)(XXX)');
      expect(service.patNameToClass('CyclicEther-3Ring-(hh)')).toBe('CyclicEther-3Ring-(XX)');
      expect(service.patNameToClass('CyclicEther-4Ring-(h)')).toBe('CyclicEther-4Ring-(X)');
    });

    it('should map parenthesized substitution groups with q to (Q)', () => {
      expect(service.patNameToClass('BetaOlefinDecomp(qq)(q)(hh)(hhh)')).toBe('BetaOlefinDecomp(QQ)(Q)(XX)(XXX)');
      expect(service.patNameToClass('BetaAldRadButeneDecomp(qq)(q)(hh)')).toBe('BetaAldRadButeneDecomp(QQ)(Q)(XX)');
    });

    it('should map trailing dash suffixes to -XXX / -XXXX', () => {
      expect(service.patNameToClass('AlkoxyFromPeroxy-HHH')).toBe('AlkoxyFromPeroxy-XXX');
      expect(service.patNameToClass('AlkoxyFromPeroxy-RHH')).toBe('AlkoxyFromPeroxy-XXX');
      expect(service.patNameToClass('BetaHPeroxyToOlefin-RRRH')).toBe('BetaHPeroxyToOlefin-XXXX');
      expect(service.patNameToClass('cyclohexane-13-cyclicetherformation-HH')).toBe('cyclohexane-13-cyclicetherformation-XX');
    });

    it('should leave non-matching names unchanged', () => {
      expect(service.patNameToClass('AlkoxyDecomp')).toBe('AlkoxyDecomp');
      expect(service.patNameToClass('Activated-Primary-Carbon-Radical-(R.+O2-->RO2.)')).toBe('Activated-Primary-Carbon-Radical-(R.+O2-->RO2.)');
      expect(service.patNameToClass('CyclicEtherFromQOOH-3Ring')).toBe('CyclicEtherFromQOOH-3Ring');
    });
  });

  describe('extractTerms', () => {
    it('should extract terms starting with capital letters followed by lowercase', () => {
      const terms1 = service.extractTerms('AldehydeHAbstractionCH3-(XX)');
      expect(terms1).toEqual(['Aldehyde', 'H', 'Abstraction', 'C', 'H']);

      const terms2 = service.extractTerms('CyclicEther-3Ring-(XX)');
      expect(terms2).toEqual(['Cyclic', 'Ether', 'Ring']);

      const terms3 = service.extractTerms('AlkylIsomerization4Ring-(XX)(XX)');
      expect(terms3).toEqual(['Alkyl', 'Isomerization', 'Ring']);
    });

    it('should handle lowercase initial letters by capitalizing them', () => {
      const terms = service.extractTerms('cyclohexane-13-cyclicetherformation-XX');
      expect(terms[0]).toBe('Cyclohexane');
    });

    it('should return empty array for empty or falsy input', () => {
      expect(service.extractTerms('')).toEqual([]);
      expect(service.extractTerms(null as unknown as string)).toEqual([]);
    });
  });

  describe('getCommonPrefix', () => {
    it('should return shared prefix terms between two term arrays', () => {
      const t1 = ['Aldehyde', 'H', 'Abstraction', 'C', 'H'];
      const t2 = ['Aldehyde', 'H', 'Abstraction', 'O', 'H'];
      expect(service.getCommonPrefix(t1, t2)).toEqual(['Aldehyde', 'H', 'Abstraction']);
    });

    it('should return empty array when initial terms differ', () => {
      const t1 = ['Aldehyde', 'H', 'Abstraction'];
      const t2 = ['Alkoxy', 'Decomp'];
      expect(service.getCommonPrefix(t1, t2)).toEqual([]);
    });
  });

  describe('buildClassNodes', () => {
    it('should group items into Level 2 class nodes', () => {
      const items: CatalogItem[] = [
        { id: '1', name: 'HO2Elimination(rhh)(hr)', rawLine: 'line1' },
        { id: '2', name: 'HO2Elimination(hhh)(hh)', rawLine: 'line2' },
        { id: '3', name: 'AlkoxyFromPeroxy-HHH', rawLine: 'line3' },
        { id: '4', name: 'AlkoxyFromPeroxy-RHH', rawLine: 'line4' },
        { id: '5', name: 'BetaOlefinDecomp(qq)(q)(hh)(hhh)', rawLine: 'line5' }
      ];

      const classes = service.buildClassNodes(items);
      expect(classes.length).toBe(3);

      const ho2Class = classes.find(c => c.className === 'HO2Elimination(XXX)(XX)');
      expect(ho2Class).toBeDefined();
      expect(ho2Class!.patterns.length).toBe(2);
      expect(ho2Class!.count).toBe(2);
    });
  });

  describe('buildTree (Three-level tree)', () => {
    it('should group consecutive classes sharing a prefix into Level 1 prefix groups', () => {
      const items: CatalogItem[] = [
        { id: '1', name: 'AldehydeHAbstractionCH3-(hh)', rawLine: 'line1' },
        { id: '2', name: 'AldehydeHAbstractionCH3-(rh)', rawLine: 'line2' },
        { id: '3', name: 'AldehydeHAbstractionOH-(hh)', rawLine: 'line3' },
        { id: '4', name: 'CyclicEther-3Ring-(hh)', rawLine: 'line4' },
        { id: '5', name: 'CyclicEther-4Ring-(h)', rawLine: 'line5' },
        { id: '6', name: 'BetaOlefinDecomp(qq)(q)(hh)(hhh)', rawLine: 'line6' }
      ];

      const tree = service.buildTree(items);

      // Classes will be:
      // - AldehydeHAbstractionCH3-(XX) (2 patterns)
      // - AldehydeHAbstractionOH-(XX)  (1 pattern)
      // -> Group 1: AldehydeHAbstraction (2 classes, 3 patterns)
      // - BetaOlefinDecomp(QQ)(Q)(XX)(XXX) (1 pattern)
      // -> Group 2: BetaOlefinDecomp (1 class, 1 pattern, QGroup)
      // - CyclicEther-3Ring-(XX) (1 pattern)
      // - CyclicEther-4Ring-(X) (1 pattern)
      // -> Group 3: CyclicEther (2 classes, 2 patterns)

      expect(tree.length).toBe(3);

      const aldehydeGroup = tree.find(g => g.prefix.startsWith('AldehydeHAbstraction'));
      expect(aldehydeGroup).toBeDefined();
      expect(aldehydeGroup!.classes.length).toBe(2);
      expect(aldehydeGroup!.patternCount).toBe(3);

      const cyclicGroup = tree.find(g => g.prefix.startsWith('CyclicEther'));
      expect(cyclicGroup).toBeDefined();
      expect(cyclicGroup!.classes.length).toBe(2);
      expect(cyclicGroup!.patternCount).toBe(2);

      const betaGroup = tree.find(g => g.prefix.startsWith('BetaOlefinDecomp'));
      expect(betaGroup).toBeDefined();
      expect(betaGroup!.isQGroup).toBeTrue();
      expect(betaGroup!.classes.length).toBe(1);
    });
  });

  describe('filterTree', () => {
    it('should filter tree by prefix group, class name, or pattern name', () => {
      const items: CatalogItem[] = [
        { id: '1', name: 'HO2Elimination(rhh)(hr)', rawLine: 'line1' },
        { id: '2', name: 'HO2Elimination(hhh)(hh)', rawLine: 'line2' },
        { id: '3', name: 'AlkoxyFromPeroxy-HHH', rawLine: 'line3' },
        { id: '4', name: 'BetaOlefinDecomp(qq)(q)(hh)(hhh)', rawLine: 'line4' }
      ];

      const tree = service.buildTree(items);

      // Filter by group prefix
      const filteredByGroup = service.filterTree(tree, 'Alkoxy');
      expect(filteredByGroup.length).toBe(1);
      expect(filteredByGroup[0].prefix).toContain('Alkoxy');

      // Filter by specific pattern substring
      const filteredByPattern = service.filterTree(tree, 'rhh');
      expect(filteredByPattern.length).toBe(1);
      expect(filteredByPattern[0].classes[0].patterns[0].name).toBe('HO2Elimination(rhh)(hr)');
    });
  });

  describe('flattenTree & expandAll', () => {
    it('should flatten a 3-level tree back to all leaf patterns', () => {
      const items: CatalogItem[] = [
        { id: '1', name: 'AldehydeHAbstractionCH3-(hh)', rawLine: 'line1' },
        { id: '2', name: 'AldehydeHAbstractionOH-(hh)', rawLine: 'line2' }
      ];

      const tree = service.buildTree(items);
      const flat = service.flattenTree(tree);
      expect(flat.length).toBe(2);
      expect(flat.map(p => p.name)).toEqual(['AldehydeHAbstractionCH3-(hh)', 'AldehydeHAbstractionOH-(hh)']);
    });

    it('should expand and collapse all levels in the tree', () => {
      const items: CatalogItem[] = [
        { id: '1', name: 'AldehydeHAbstractionCH3-(hh)', rawLine: 'line1' }
      ];

      const tree = service.buildTree(items, false);
      expect(tree[0].isExpanded).toBeFalse();
      expect(tree[0].classes[0].isExpanded).toBeFalse();

      service.expandAll(tree, true);
      expect(tree[0].isExpanded).toBeTrue();
      expect(tree[0].classes[0].isExpanded).toBeTrue();

      service.expandAll(tree, false);
      expect(tree[0].isExpanded).toBeFalse();
      expect(tree[0].classes[0].isExpanded).toBeFalse();
    });
  });
});
