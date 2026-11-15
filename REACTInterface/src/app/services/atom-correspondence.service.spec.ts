import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
  AtomCorrespondenceService,
  AtomInfo,
  BondInfo,
  AtomCorrespondenceRow,
  BondChangeRow,
  isGenericAtomSymbol,
  normalizeAtomSymbol,
  isValidAtomSymbol
} from './atom-correspondence.service';

describe('AtomCorrespondenceService', () => {
  let service: AtomCorrespondenceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AtomCorrespondenceService]
    });
    service = TestBed.inject(AtomCorrespondenceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('atomicNumberToSymbol', () => {
    it('should map atomic numbers to correct symbols', () => {
      expect(service.atomicNumberToSymbol(1)).toBe('H');
      expect(service.atomicNumberToSymbol(6)).toBe('C');
      expect(service.atomicNumberToSymbol(7)).toBe('N');
      expect(service.atomicNumberToSymbol(8)).toBe('O');
      expect(service.atomicNumberToSymbol(0)).toBe('R');
      expect(service.atomicNumberToSymbol(999)).toBe('R');
    });
  });

  describe('parseRxnStructure', () => {
    it('should parse an MDL RXN block into reactant and product atoms and bonds', () => {
      const rxnContent = `$RXN
Mock Reaction
  chemdb

  1  1
$MOL
Molecule 1 (Reactant)
  chemdb

  2  1  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    0.0000    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
M  END
$MOL
Molecule 2 (Product)
  chemdb

  2  1  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    0.0000    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
M  END
$$$$`;

      const result = service.parseRxnStructure(rxnContent);
      expect(result.reactantAtoms.length).toBe(2);
      expect(result.reactantAtoms[0].symbol).toBe('C');
      expect(result.reactantAtoms[1].symbol).toBe('H');
      expect(result.productAtoms.length).toBe(2);
      expect(result.reactantBonds.length).toBe(1);
      expect(result.productBonds.length).toBe(1);
    });

    it('should return empty arrays for empty content', () => {
      const result = service.parseRxnStructure('');
      expect(result.reactantAtoms.length).toBe(0);
      expect(result.productAtoms.length).toBe(0);
    });
  });

  describe('buildCandidateProductAtoms', () => {
    it('should filter product atoms matching reactant atom symbol or generic', () => {
      const rAtom: AtomInfo = {
        atomNumber: 1,
        molAtomIndex: 1,
        symbol: 'C',
        isGeneric: false,
        moleculeIndex: 1,
        isReactant: true
      };

      const productAtoms: AtomInfo[] = [
        { atomNumber: 1, molAtomIndex: 1, symbol: 'C', isGeneric: false, moleculeIndex: 1, isReactant: false },
        { atomNumber: 2, molAtomIndex: 2, symbol: 'H', isGeneric: false, moleculeIndex: 1, isReactant: false },
        { atomNumber: 3, molAtomIndex: 1, symbol: 'C', isGeneric: false, moleculeIndex: 2, isReactant: false }
      ];

      const candidates = service.buildCandidateProductAtoms(rAtom, productAtoms);
      expect(candidates.length).toBe(2);
      expect(candidates[0].atomNumber).toBe(1);
      expect(candidates[1].atomNumber).toBe(3);
    });
  });

  describe('buildBondChanges', () => {
    it('should identify broken reactant bonds (type 4) and formed product bonds (type 104)', () => {
      const reactantBonds: BondInfo[] = [
        { moleculeIndex: 1, isReactant: true, atom1MolIndex: 1, atom2MolIndex: 2, atom1Number: 1, atom2Number: 2, bondType: 1 }
      ];
      const productBonds: BondInfo[] = [
        { moleculeIndex: 1, isReactant: false, atom1MolIndex: 1, atom2MolIndex: 3, atom1Number: 1, atom2Number: 3, bondType: 1 }
      ];

      // Correspondence: Reactant 1 -> Product 1, Reactant 2 -> Product 2 (no bond between 1 and 2 in product)
      const corrRows: AtomCorrespondenceRow[] = [
        { reactantAtomNumber: 1, reactantSymbol: 'C', productAtomNumber: 1, candidateProductAtoms: [] },
        { reactantAtomNumber: 2, reactantSymbol: 'H', productAtomNumber: 2, candidateProductAtoms: [] }
      ];

      const bondChanges = service.buildBondChanges(reactantBonds, productBonds, corrRows);
      const broken = bondChanges.filter(b => b.type === 4);
      const formed = bondChanges.filter(b => b.type === 104);

      expect(broken.length).toBe(1);
      expect(broken[0].atom1Number).toBe(1);
      expect(broken[0].atom2Number).toBe(2);

      expect(formed.length).toBe(1);
      expect(formed[0].atom1Number).toBe(1);
      expect(formed[0].atom2Number).toBe(3);
    });
  });

  describe('updateReactionPatternDocument', () => {
    it('should populate TotalCorr, Corrs, BondChanges and reactionBrokenBonds/reactionFormedBonds', () => {
      const existingDoc = {
        ID: 1001,
        Name: 'Test-Pattern',
        Reactants: ['sub1'],
        Products: ['sub2']
      };

      const corrRows: AtomCorrespondenceRow[] = [
        { reactantAtomNumber: 1, reactantSymbol: 'C', reactantMoleculeIndex: 1, productAtomNumber: 1, candidateProductAtoms: [] },
        { reactantAtomNumber: 2, reactantSymbol: 'H', reactantMoleculeIndex: 1, productAtomNumber: 2, candidateProductAtoms: [] }
      ];

      const bondChanges: BondChangeRow[] = [
        { moleculeIndex: 1, atom1Number: 1, atom2Number: 2, type: 4 }
      ];

      const reactantAtoms: AtomInfo[] = [
        { atomNumber: 1, molAtomIndex: 1, symbol: 'C', isGeneric: false, moleculeIndex: 1, isReactant: true },
        { atomNumber: 2, molAtomIndex: 2, symbol: 'H', isGeneric: false, moleculeIndex: 1, isReactant: true }
      ];

      const productAtoms: AtomInfo[] = [
        { atomNumber: 1, molAtomIndex: 1, symbol: 'C', isGeneric: false, moleculeIndex: 1, isReactant: false },
        { atomNumber: 2, molAtomIndex: 2, symbol: 'H', isGeneric: false, moleculeIndex: 1, isReactant: false }
      ];

      const updated = service.updateReactionPatternDocument(
        existingDoc,
        'Test-Pattern',
        corrRows,
        bondChanges,
        reactantAtoms,
        productAtoms
      );

      expect(updated.TotalCorr).toBeDefined();
      expect(updated.TotalCorr.NumberOfCorrs).toBe(2);
      expect(updated.TotalCorr.Corrs.length).toBe(2);
      expect(updated.TotalCorr.BondChanges.NumberBondChanges).toBe(1);
      expect(updated.TotalCorr.BondChanges.Changes[0].Type).toBe(4);
      expect(updated.TotalCorr.BondChanges.Changes[0].Atom1.Product).toBeDefined();
      expect(updated.TotalCorr.BondChanges.Changes[0].Atom1.Reactant).toBeDefined();
      expect(updated.TotalCorr.BondChanges.Changes[0].Atom2.Product).toBeDefined();
      expect(updated.TotalCorr.BondChanges.Changes[0].Atom2.Reactant).toBeDefined();
      expect(updated.reactionBrokenBonds).toEqual(['C-H']);
      expect(updated.reactionFormedBonds).toEqual([]);
      expect(updated.updatedAt).toBeDefined();
    });
  });

  describe('Preamble and Keyword Rejection', () => {
    it('should ignore molfile preamble lines like -CPSS- Generated and counts line tokens', () => {
      const rxnWithPreamble = `$RXN
Mock Reaction
  chemdb

  1  1
$MOL
11314400
  -CPSS-  Generated
butane
  2  1  0  0  0  0  0  0  0  0999 V2000
   -2.0200    0.8600    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.2800    0.0800    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
M  END
$MOL
11314401
  -CPSS-  Generated
butane-prod
  2  1  0  0  0  0  0  0  0  0999 V2000
   -2.0200    0.8600    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.2800    0.0800    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
M  END
$$$$`;

      const parsed = service.parseRxnStructure(rxnWithPreamble);
      expect(parsed.reactantAtoms.length).toBe(2);
      expect(parsed.reactantAtoms[0].symbol).toBe('C');
      expect(parsed.reactantAtoms[1].symbol).toBe('H');
      expect(parsed.reactantAtoms.some(a => a.symbol === 'Generated')).toBeFalse();
      expect(parsed.reactantAtoms.some(a => a.symbol === 'V2000')).toBeFalse();

      expect(parsed.productAtoms.length).toBe(2);
      expect(parsed.productAtoms[0].symbol).toBe('C');
      expect(parsed.productAtoms[1].symbol).toBe('H');
      expect(parsed.productAtoms.some(a => a.symbol === 'Generated')).toBeFalse();
      expect(parsed.productAtoms.some(a => a.symbol === 'V2000')).toBeFalse();
    });
  });

  describe('Generic Atoms (M, R, R#, M#, Q, X)', () => {
    it('should validate and recognize generic atoms correctly', () => {
      expect(isValidAtomSymbol('M')).toBeTrue();
      expect(isValidAtomSymbol('m')).toBeTrue();
      expect(isValidAtomSymbol('M#')).toBeTrue();
      expect(isValidAtomSymbol('R')).toBeTrue();
      expect(isValidAtomSymbol('R#')).toBeTrue();
      expect(isValidAtomSymbol('R1')).toBeTrue();
      expect(isValidAtomSymbol('Q')).toBeTrue();
      expect(isValidAtomSymbol('X')).toBeTrue();
      expect(isValidAtomSymbol('A')).toBeTrue();
      expect(isValidAtomSymbol('*')).toBeTrue();

      expect(isGenericAtomSymbol('M')).toBeTrue();
      expect(isGenericAtomSymbol('M#')).toBeTrue();
      expect(isGenericAtomSymbol('R')).toBeTrue();
      expect(isGenericAtomSymbol('R#')).toBeTrue();
      expect(isGenericAtomSymbol('C')).toBeFalse();
      expect(isGenericAtomSymbol('H')).toBeFalse();

      expect(normalizeAtomSymbol('R#')).toBe('R');
      expect(normalizeAtomSymbol('M#')).toBe('M');
      expect(normalizeAtomSymbol('Q#')).toBe('Q');
      expect(normalizeAtomSymbol('X#')).toBe('X');
      expect(normalizeAtomSymbol('C')).toBe('C');
      expect(normalizeAtomSymbol('M')).toBe('M');
      expect(normalizeAtomSymbol('R')).toBe('R');
    });

    it('should parse M and R# atoms from mol block and flag them as generic', () => {
      const rxnWithGeneric = `$RXN
OlefinToAldehyde
  chemdb

  1  1
$MOL
olefin-(rh)(hh)
  chemdb

  3  2  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    0.0000    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
    2.5000    1.0000    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  1  3  1  0  0  0  0
M  END
$MOL
product
  chemdb

  3  2  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    0.0000    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
    2.5000    1.0000    0.0000 M   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  1  3  1  0  0  0  0
M  END
$$$$`;

      const parsed = service.parseRxnStructure(rxnWithGeneric);
      expect(parsed.reactantAtoms.length).toBe(3);
      expect(parsed.reactantAtoms[2].symbol).toBe('R');
      expect(parsed.reactantAtoms[2].isGeneric).toBeTrue();

      expect(parsed.productAtoms.length).toBe(3);
      expect(parsed.productAtoms[2].symbol).toBe('M');
      expect(parsed.productAtoms[2].isGeneric).toBeTrue();

      // Generic candidate matching: R reactant atom should match M product atom
      const candidates = service.buildCandidateProductAtoms(parsed.reactantAtoms[2], parsed.productAtoms);
      expect(candidates.length).toBe(1);
      expect(candidates[0].atomNumber).toBe(3);
      expect(candidates[0].symbol).toBe('M');
    });
  });
});

