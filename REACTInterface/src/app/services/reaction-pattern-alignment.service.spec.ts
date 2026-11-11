import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
  ReactionPatternAlignmentService,
  MoleculeSubstructureData,
  ParsedLstPattern
} from './reaction-pattern-alignment.service';
import { ExistenceCheckItem } from './existence-check.service';

describe('ReactionPatternAlignmentService', () => {
  let service: ReactionPatternAlignmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReactionPatternAlignmentService]
    });
    service = TestBed.inject(ReactionPatternAlignmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('atomicNumberToSymbol', () => {
    it('should map standard atomic numbers to chemical symbols', () => {
      expect(service.atomicNumberToSymbol(1)).toBe('H');
      expect(service.atomicNumberToSymbol(6)).toBe('C');
      expect(service.atomicNumberToSymbol(7)).toBe('N');
      expect(service.atomicNumberToSymbol(8)).toBe('O');
      expect(service.atomicNumberToSymbol(9)).toBe('F');
      expect(service.atomicNumberToSymbol(16)).toBe('S');
      expect(service.atomicNumberToSymbol(17)).toBe('Cl');
    });

    it('should fallback to R for generic or unknown numbers', () => {
      expect(service.atomicNumberToSymbol(0)).toBe('R');
      expect(service.atomicNumberToSymbol(99)).toBe('R');
    });
  });

  describe('parseLstPatternBlock', () => {
    const sampleBlock = `OlefinToAldehyde\\
       olefin-(hh)(hh) hydroxyl-radical = aldehyde-(hh)(h)
- ID 0
- Correspondences
1 2 3 4   1 1 1 1
5 6       1
1 2 3 4 5 6   1 1 1 1 1
>  <ForwardRxn>
Standard 1.00e+13 0.00 0.0 1.0; Ref
$$$$
`;

    it('should correctly parse pattern name, reactants, products, and correspondence lines', () => {
      const parsed = service.parseLstPatternBlock(sampleBlock);
      expect(parsed).not.toBeNull();
      expect(parsed!.name).toBe('OlefinToAldehyde');
      expect(parsed!.reactants).toEqual(['olefin-(hh)(hh)', 'hydroxyl-radical']);
      expect(parsed!.products).toEqual(['aldehyde-(hh)(h)']);
      expect(parsed!.corrLines.length).toBe(3);
      expect(parsed!.corrLines[0]).toBe('1 2 3 4   1 1 1 1');
      expect(parsed!.id).toBe(0);
    });

    it('should return null for malformed or incomplete block without name', () => {
      expect(service.parseLstPatternBlock('')).toBeNull();
      expect(service.parseLstPatternBlock('%%% Only comment line\n- ID 1')).toBeNull();
    });
  });

  describe('getMoleculeAutomorphisms', () => {
    it('should return 1 automorphism for a single atom molecule', () => {
      const mol: MoleculeSubstructureData = {
        id: 1,
        name: 'H-radical',
        nAtoms: 1,
        nBonds: 0,
        atoms: [{ id: 0, atomicNumber: 1, symbol: 'H', isRadical: true, charge: 0 }],
        bonds: []
      };
      const autos = service.getMoleculeAutomorphisms(mol);
      expect(autos.length).toBe(1);
      expect(autos[0]).toEqual([0]);
    });

    it('should find 2 automorphisms for symmetric H-O-H molecule', () => {
      // H1 (0) - O (1) - H2 (2)
      const mol: MoleculeSubstructureData = {
        id: 2,
        name: 'water',
        nAtoms: 3,
        nBonds: 2,
        atoms: [
          { id: 0, atomicNumber: 1, symbol: 'H', isRadical: false, charge: 0 },
          { id: 1, atomicNumber: 8, symbol: 'O', isRadical: false, charge: 0 },
          { id: 2, atomicNumber: 1, symbol: 'H', isRadical: false, charge: 0 }
        ],
        bonds: [
          { id: 0, i: 0, j: 1, order: 1 },
          { id: 1, i: 1, j: 2, order: 1 }
        ]
      };
      const autos = service.getMoleculeAutomorphisms(mol);
      expect(autos.length).toBe(2);
      expect(autos).toContain([0, 1, 2]);
      expect(autos).toContain([2, 1, 0]);
    });
  });

  describe('rematchEquivalentAtoms', () => {
    it('should detect when atoms are already perfectly aligned without adjustment', () => {
      const molR: MoleculeSubstructureData = {
        id: 1,
        name: 'R',
        nAtoms: 2,
        nBonds: 1,
        atoms: [
          { id: 0, atomicNumber: 6, symbol: 'C', isRadical: false, charge: 0 },
          { id: 1, atomicNumber: 1, symbol: 'H', isRadical: false, charge: 0 }
        ],
        bonds: [{ id: 0, i: 0, j: 1, order: 1 }]
      };
      const molP: MoleculeSubstructureData = {
        id: 2,
        name: 'P',
        nAtoms: 2,
        nBonds: 1,
        atoms: [
          { id: 0, atomicNumber: 6, symbol: 'C', isRadical: false, charge: 0 },
          { id: 1, atomicNumber: 1, symbol: 'H', isRadical: false, charge: 0 }
        ],
        bonds: [{ id: 0, i: 0, j: 1, order: 1 }]
      };
      const pattern: ParsedLstPattern = {
        name: 'TestPat',
        id: 0,
        reactants: ['R'],
        products: ['P'],
        corrLines: [
          '1 2   1', // Reactant line
          '1 2   1'  // Product line
        ],
        rawBlock: ''
      };

      const result = service.rematchEquivalentAtoms([molR], [molP], pattern);
      expect(result.success).toBeTrue();
      expect(result.pairs.length).toBe(2);
      expect(result.pairs[0].isMatched).toBeTrue();
      expect(result.pairs[1].isMatched).toBeTrue();
    });

    it('should rematch symmetric atoms when ordering in DB substructure is flipped', () => {
      // Reactant: C0 - H1 and C0 - O2
      const molR: MoleculeSubstructureData = {
        id: 1,
        name: 'R',
        nAtoms: 3,
        nBonds: 2,
        atoms: [
          { id: 0, atomicNumber: 6, symbol: 'C', isRadical: false, charge: 0 },
          { id: 1, atomicNumber: 1, symbol: 'H', isRadical: false, charge: 0 },
          { id: 2, atomicNumber: 8, symbol: 'O', isRadical: false, charge: 0 }
        ],
        bonds: [
          { id: 0, i: 0, j: 1, order: 1 },
          { id: 1, i: 0, j: 2, order: 1 }
        ]
      };
      // Product where atoms 1 and 2 are inverted in DB: 1 is O, 2 is H
      const molP: MoleculeSubstructureData = {
        id: 2,
        name: 'P',
        nAtoms: 3,
        nBonds: 2,
        atoms: [
          { id: 0, atomicNumber: 6, symbol: 'C', isRadical: false, charge: 0 },
          { id: 1, atomicNumber: 8, symbol: 'O', isRadical: false, charge: 0 },
          { id: 2, atomicNumber: 1, symbol: 'H', isRadical: false, charge: 0 }
        ],
        bonds: [
          { id: 0, i: 0, j: 1, order: 1 },
          { id: 1, i: 0, j: 2, order: 1 }
        ]
      };
      // Initial correspondence assumed product order matched reactant order (1 -> 1, 2 -> 2)
      // which puts H -> O (mismatch)
      const pattern: ParsedLstPattern = {
        name: 'TestPat',
        id: 0,
        reactants: ['R'],
        products: ['P'],
        corrLines: [
          '1 2 3   1 1', // Reactant line
          '1 2 3   1 1'  // Product line (1 maps to 1, 2 maps to 2, 3 maps to 3)
        ],
        rawBlock: ''
      };

      const result = service.rematchEquivalentAtoms([molR], [molP], pattern);
      expect(result.success).toBeTrue();
      // Atom 1 in P (O) should now be mapped to atom 3 of R (O)
      // Atom 2 in P (H) should now be mapped to atom 2 of R (H)
      expect(result.adjustedCorrLines[1]).toContain('1 3 2');
    });

    it('should report failure when atoms cannot be aligned', () => {
      const molR: MoleculeSubstructureData = {
        id: 1,
        name: 'R',
        nAtoms: 1,
        nBonds: 0,
        atoms: [{ id: 0, atomicNumber: 6, symbol: 'C', isRadical: false, charge: 0 }],
        bonds: []
      };
      const molP: MoleculeSubstructureData = {
        id: 2,
        name: 'P',
        nAtoms: 1,
        nBonds: 0,
        atoms: [{ id: 0, atomicNumber: 8, symbol: 'O', isRadical: false, charge: 0 }],
        bonds: []
      };
      const pattern: ParsedLstPattern = {
        name: 'TestPat',
        id: 0,
        reactants: ['R'],
        products: ['P'],
        corrLines: ['1', '1'],
        rawBlock: ''
      };

      const result = service.rematchEquivalentAtoms([molR], [molP], pattern);
      expect(result.success).toBeFalse();
    });
  });

  describe('generateAdjustedLstBlock', () => {
    it('should replace correspondence lines while keeping header lines intact', () => {
      const rawBlock = `TestPat\\
       sub1 = sub2
- ID 0
- Correspondences
1 2   1
1 2   1
>  <ForwardRxn>
Standard 1.0e13 0.0 0.0 1.0; Ref
$$$$
`;
      const pattern: ParsedLstPattern = {
        name: 'TestPat',
        id: 0,
        reactants: ['sub1'],
        products: ['sub2'],
        corrLines: ['1 2   1', '1 2   1'],
        rawBlock
      };
      const newLines = ['1 2   1', '2 1   1'];
      const adjusted = service.generateAdjustedLstBlock(pattern, newLines);

      expect(adjusted).toContain('TestPat');
      expect(adjusted).toContain('sub1 = sub2');
      expect(adjusted).toContain('- Correspondences');
      expect(adjusted).toContain('2 1   1');
      expect(adjusted).toContain('>  <ForwardRxn>');
    });
  });

  describe('checkReactionPatternsFromLst', () => {
    it('should annotate ExistenceCheckItem with alignment and bond change results', async () => {
      const lstContent = `TestReactionPattern\\
       sub1 = sub2
- ID 0
- Correspondences
1 2   4
1 2   104
$$$$
`;
      const items: ExistenceCheckItem[] = [
        {
          id: 'PAT-1',
          name: 'TestReactionPattern',
          inDatabase: false,
          status: 'New',
          suggestedAction: 'Add'
        }
      ];

      // Spy on fetchSubstructureFromFirestore to provide mock molfiles
      spyOn(service, 'fetchSubstructureFromFirestore').and.callFake(async (nameOrId: string | number) => {
        return {
          id: typeof nameOrId === 'number' ? nameOrId : 1,
          name: String(nameOrId),
          nAtoms: 2,
          nBonds: 1,
          atoms: [
            { id: 0, atomicNumber: 6, symbol: 'C', isRadical: false, charge: 0 },
            { id: 1, atomicNumber: 1, symbol: 'H', isRadical: false, charge: 0 }
          ],
          bonds: [{ id: 0, i: 0, j: 1, order: 1 }]
        };
      });

      // Spy on fetchDbReactionPattern to return null (not in DB)
      spyOn(service, 'fetchDbReactionPattern').and.returnValue(Promise.resolve(null));

      await service.checkReactionPatternsFromLst(lstContent, items);

      expect(items[0].alignmentStatus).toBe('matched');
      expect(items[0].brokenBondsCount).toBe(1);
      expect(items[0].madeBondsCount).toBe(1);
      expect(items[0].bondChangesText).toBe('1 broken, 1 made');
      expect(items[0].dbMatchStatus).toBe('not-in-db');
    });
  });
});
