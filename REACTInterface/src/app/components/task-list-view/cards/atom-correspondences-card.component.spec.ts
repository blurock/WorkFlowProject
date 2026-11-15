import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { AtomCorrespondencesCardComponent } from './atom-correspondences-card.component';
import { ReactCloudApiService } from '../../../services/react-cloud-api.service';
import { ReactionPatternAlignmentService } from '../../../services/reaction-pattern-alignment.service';
import { AtomCorrespondenceService } from '../../../services/atom-correspondence.service';

describe('AtomCorrespondencesCardComponent', () => {
  let component: AtomCorrespondencesCardComponent;
  let fixture: ComponentFixture<AtomCorrespondencesCardComponent>;
  let apiServiceSpy: jasmine.SpyObj<ReactCloudApiService>;
  let alignmentServiceSpy: jasmine.SpyObj<ReactionPatternAlignmentService>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ReactCloudApiService', ['storeDatabaseRecord']);
    apiServiceSpy.storeDatabaseRecord.and.returnValue(of({ status: 'OK' }));

    alignmentServiceSpy = jasmine.createSpyObj('ReactionPatternAlignmentService', [
      'fetchDbReactionPattern',
      'fetchSubstructureFromFirestore',
      'clearCache'
    ]);
    alignmentServiceSpy.fetchDbReactionPattern.and.resolveTo(null);

    await TestBed.configureTestingModule({
      imports: [
        AtomCorrespondencesCardComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: ReactCloudApiService, useValue: apiServiceSpy },
        { provide: ReactionPatternAlignmentService, useValue: alignmentServiceSpy },
        AtomCorrespondenceService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AtomCorrespondencesCardComponent);
    component = fixture.componentInstance;
    component.section = {
      id: 5,
      title: 'Section 5: Atom Correspondences & Bond Changes',
      icon: 'compare_arrows',
      content: 'Matched Atoms (MatTable):\n1 1 1 1\n1 2 1 2\nReaction Bond Changes:\n1 2 1 2',
      isExpanded: true,
      matchedAtomsData: [
        { reactantMolecule: 1, reactantIndex: 1, productMolecule: 1, productIndex: 1 },
        { reactantMolecule: 1, reactantIndex: 2, productMolecule: 1, productIndex: 2 }
      ],
      bondChangesData: [
        { reactantAtom1: '1', reactantAtom2: '2', productAtom1: '1', productAtom2: '2' }
      ]
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize correspondence rows from section data', async () => {
    await component.initializeCorrespondences();
    expect(component.correspondenceRows.length).toBe(2);
    expect(component.correspondenceRows[0].reactantAtomNumber).toBe(1);
    expect(component.correspondenceRows[0].productAtomNumber).toBe(1);
  });

  it('should store changes to Firestore when onStoreChange is called', async () => {
    component.patternName = 'Test-Pattern-1';
    await component.initializeCorrespondences();

    await component.onStoreChange({
      correspondences: component.correspondenceRows,
      bondChanges: component.bondChangeRows
    });

    expect(apiServiceSpy.storeDatabaseRecord).toHaveBeenCalled();
    expect(alignmentServiceSpy.clearCache).toHaveBeenCalledWith('Test-Pattern-1');
  });

  it('should recompute bond changes when onCorrespondenceChanged is called', () => {
    component.reactantAtoms = [
      { atomNumber: 1, molAtomIndex: 1, symbol: 'C', isGeneric: false, moleculeIndex: 1, isReactant: true },
      { atomNumber: 2, molAtomIndex: 2, symbol: 'H', isGeneric: false, moleculeIndex: 1, isReactant: true }
    ];
    component.productAtoms = [
      { atomNumber: 1, molAtomIndex: 1, symbol: 'C', isGeneric: false, moleculeIndex: 1, isReactant: false },
      { atomNumber: 2, molAtomIndex: 2, symbol: 'H', isGeneric: false, moleculeIndex: 1, isReactant: false }
    ];
    component.reactantBonds = [
      { moleculeIndex: 1, isReactant: true, atom1MolIndex: 1, atom2MolIndex: 2, atom1Number: 1, atom2Number: 2, bondType: 1 }
    ];
    component.productBonds = [];

    component.correspondenceRows = [
      { reactantAtomNumber: 1, reactantSymbol: 'C', productAtomNumber: 1, candidateProductAtoms: [] },
      { reactantAtomNumber: 2, reactantSymbol: 'H', productAtomNumber: 2, candidateProductAtoms: [] }
    ];

    component.onCorrespondenceChanged(component.correspondenceRows);
    expect(component.bondChangeRows.length).toBe(1);
    expect(component.bondChangeRows[0].type).toBe(4); // Broken bond
  });
});

