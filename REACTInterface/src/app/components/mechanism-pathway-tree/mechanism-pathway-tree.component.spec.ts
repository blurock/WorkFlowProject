import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  MechanismPathwayTreeComponent,
  MechanismPathwayTreeDialogData
} from './mechanism-pathway-tree.component';

describe('MechanismPathwayTreeComponent', () => {
  let component: MechanismPathwayTreeComponent;
  let fixture: ComponentFixture<MechanismPathwayTreeComponent>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const samplePathways = [
    'BasicLowTemperature',
    'BasicLowTemperatureV2.0',
    'BasicLowTemperatureV2.1',
    'AldehydeDecomposition',
    'AldehydeDecomposition_V2'
  ];

  beforeEach(async () => {
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        MechanismPathwayTreeComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialogRef, useValue: null },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MechanismPathwayTreeComponent);
    component = fixture.componentInstance;
    component.pathways = samplePathways;
    fixture.detectChanges();
  });

  it('should create and group pathways into Level 1 base names and Level 2 versions', () => {
    expect(component).toBeTruthy();
    expect(component.treeNodes.length).toBe(2);
    // Should be collapsed by default
    expect(component.treeNodes.every(n => !n.isExpanded)).toBeTrue();

    // Group 1: AldehydeDecomposition
    const aldehyde = component.treeNodes.find(n => n.baseName === 'AldehydeDecomposition');
    expect(aldehyde).toBeDefined();
    expect(aldehyde?.count).toBe(2);
    expect(aldehyde?.versions.map(v => v.name)).toEqual([
      'AldehydeDecomposition',
      'AldehydeDecomposition_V2'
    ]);
    expect(aldehyde?.versions.map(v => v.versionLabel)).toEqual([
      'Base',
      'V2'
    ]);

    // Group 2: BasicLowTemperature
    const basic = component.treeNodes.find(n => n.baseName === 'BasicLowTemperature');
    expect(basic).toBeDefined();
    expect(basic?.count).toBe(3);
    expect(basic?.versions.map(v => v.name)).toEqual([
      'BasicLowTemperature',
      'BasicLowTemperatureV2.0',
      'BasicLowTemperatureV2.1'
    ]);
  });

  it('should filter tree nodes by search query matching base name or version', () => {
    component.onSearchChange('Aldehyde');
    expect(component.filteredTreeNodes.length).toBe(1);
    expect(component.filteredTreeNodes[0].baseName).toBe('AldehydeDecomposition');

    component.onSearchChange('V2.1');
    expect(component.filteredTreeNodes.length).toBe(1);
    expect(component.filteredTreeNodes[0].baseName).toBe('BasicLowTemperature');
    expect(component.filteredTreeNodes[0].versions.length).toBe(1);
    expect(component.filteredTreeNodes[0].versions[0].name).toBe('BasicLowTemperatureV2.1');

    component.clearSearch();
    expect(component.filteredTreeNodes.length).toBe(2);
  });

  it('should have groups collapsed by default and open when needed or toggled', () => {
    expect(component.treeNodes.every(n => !n.isExpanded)).toBeTrue();
    expect(component.filteredTreeNodes.every(n => !n.isExpanded)).toBeTrue();

    // Toggle a group
    component.toggleGroup(component.filteredTreeNodes[0]);
    expect(component.filteredTreeNodes[0].isExpanded).toBeTrue();
    component.toggleGroup(component.filteredTreeNodes[0]);
    expect(component.filteredTreeNodes[0].isExpanded).toBeFalse();
  });

  it('should expand and collapse all nodes', () => {
    component.collapseAll();
    expect(component.filteredTreeNodes.every(n => !n.isExpanded)).toBeTrue();

    component.expandAll();
    expect(component.filteredTreeNodes.every(n => n.isExpanded)).toBeTrue();
  });

  it('should emit pathwaySelected when a version is selected in single-select mode', () => {
    spyOn(component.pathwaySelected, 'emit');
    const versionItem = component.treeNodes[0].versions[0];

    component.selectSingle(versionItem);
    expect(component.pathwaySelected.emit).toHaveBeenCalledWith(versionItem.name);
  });

  it('should handle multi-selection and emit selectionChange', () => {
    component.multiSelect = true;
    spyOn(component.selectionChange, 'emit');

    const aldehydeGroup = component.treeNodes.find(n => n.baseName === 'AldehydeDecomposition')!;
    component.toggleGroupSelection(aldehydeGroup);

    expect(component.isGroupChecked(aldehydeGroup)).toBeTrue();
    expect(component.selectedNames.has('AldehydeDecomposition')).toBeTrue();
    expect(component.selectedNames.has('AldehydeDecomposition_V2')).toBeTrue();
    expect(component.selectionChange.emit).toHaveBeenCalled();
  });
});

