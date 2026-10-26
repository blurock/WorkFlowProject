import { TestBed } from '@angular/core/testing';
import { ReactiveCenterService, ReactionAtom, ReactionBond } from './reactive-center.service';

describe('ReactiveCenterService', () => {
  let service: ReactiveCenterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReactiveCenterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should encode atom with spectator bonds sorted', () => {
    // Carbon non-radical with Single, Single, Single -> C:N:SSS
    const enc1 = service.encodeAtom('C', false, [1, 1, 1]);
    expect(enc1).toBe('C:N:SSS');

    // Carbon radical with Double, Single -> C:R:DS
    const enc2 = service.encodeAtom('C', true, [2, 1]);
    expect(enc2).toBe('C:R:DS');

    // Hydrogen non-radical with no spectator bonds -> H:N:
    const enc3 = service.encodeAtom('H', false, []);
    expect(enc3).toBe('H:N:');
  });

  it('should encode bond canonically in lexicographical order', () => {
    const encA = 'C:N:SSS';
    const encB = 'H:N:';
    // 'C:N:SSS' < 'H:N:'
    expect(service.encodeBond(encA, encB)).toBe('C:N:SSS_H:N:');
    expect(service.encodeBond(encB, encA)).toBe('C:N:SSS_H:N:');
  });

  it('should compute reactive center for a simple C-H breaking reaction', () => {
    // Reactants: C (atom 1, non-radical, spectator bonds 3 Single to other H atoms), H (atom 2, non-radical, bonded to C)
    // Products: C (atom 3, radical, spectator bonds 3 Single), H (atom 4, radical, 0 bonds)
    const reactantAtoms: ReactionAtom[] = [
      { atomNumber: 1, symbol: 'C', moleculeIndex: 1, isReactant: true, isRadical: false, atomMapNumber: 1 },
      { atomNumber: 2, symbol: 'H', moleculeIndex: 1, isReactant: true, isRadical: false, atomMapNumber: 2 }
    ];
    const productAtoms: ReactionAtom[] = [
      { atomNumber: 3, symbol: 'C', moleculeIndex: 2, isReactant: false, isRadical: true, atomMapNumber: 1 },
      { atomNumber: 4, symbol: 'H', moleculeIndex: 3, isReactant: false, isRadical: true, atomMapNumber: 2 }
    ];

    // C-H bond breaking in reactant (atom 1 - atom 2)
    const reactantBonds: ReactionBond[] = [
      { moleculeIndex: 1, isReactant: true, atom1Number: 1, atom2Number: 2, bondType: 1 }
    ];
    const productBonds: ReactionBond[] = [];

    const result = service.computeReactiveCenter(reactantAtoms, productAtoms, reactantBonds, productBonds);

    expect(result.hasChanges).toBeTrue();
    expect(result.reactionBrokenBonds.length).toBe(1);
    expect(result.reactionBrokenBonds[0]).toBe('C:N:_H:N:');
    expect(result.reactionFormedBonds.length).toBe(0);
    expect(result.reactionCenterKey).toBe('B:C:N:_H:N:');
  });
});
