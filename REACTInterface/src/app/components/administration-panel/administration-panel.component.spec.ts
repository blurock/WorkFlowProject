import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdministrationPanelComponent } from './administration-panel.component';
import { AdminManagementService, AuditResult, CatalogListsPayload } from '../../services/admin-management.service';
import { AuthService } from '../../services/auth.service';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

describe('AdministrationPanelComponent', () => {
  let component: AdministrationPanelComponent;
  let fixture: ComponentFixture<AdministrationPanelComponent>;
  let adminServiceMock: any;
  let authServiceMock: any;

  const mockAuditResult: { [key: string]: AuditResult } = {
    Substructures: {
      database: 'Substructures',
      classIndex: 'DB-Index-SubStructureIDs',
      summary: {
        totalRecords: 10,
        totalKeys: 11,
        uniqueNames: 9,
        orphanCount: 1,
        ghostCount: 1,
        mismatchCount: 1,
        duplicateNameCount: 1,
        duplicateIdCount: 0
      },
      issues: [
        {
          type: 'GHOST_INDEX_KEY',
          database: 'Substructures',
          id: '10000',
          name: 'ghost-key',
          message: 'Ghost index key',
          severity: 'warning',
          safeToAutoSync: true
        },
        {
          type: 'ORPHAN_RECORD',
          database: 'Substructures',
          id: '10001',
          name: 'orphan-rec',
          message: 'Orphan record',
          severity: 'warning',
          safeToAutoSync: true
        },
        {
          type: 'DUPLICATE_NAME_IN_RECORDS',
          database: 'Substructures',
          id: '10002',
          name: 'betaolefinradical',
          message: 'Duplicate name',
          severity: 'error',
          safeToAutoSync: false
        }
      ]
    }
  };

  const mockCatalogLists: CatalogListsPayload = {
    generatedAt: '2026-11-17T12:00:00Z',
    targetUid: 'UOqk0KtFtaXma5TGsi8Seh9RMbx1',
    molecules: [
      { id: '1', name: 'butane' },
      { id: '2', name: 'propane' }
    ],
    substructures: {
      total: 3,
      families: [
        {
          family: 'betaradical(X)',
          count: 2,
          items: [
            { id: '101', name: 'betaradical(h)' },
            { id: '102', name: 'betaradical(r)' }
          ]
        }
      ],
      moleculesInSubstructures: [
        { id: '101', name: 'butane', moleculeId: '1' }
      ],
      substructureMap: {
        '101': 'betaradical(h)',
        '102': 'betaradical(r)'
      }
    },
    reactionPatterns: {
      total: 1,
      bySubstructure: [
        {
          substructure: 'betaradical(h)',
          count: 1,
          patterns: [{ id: '501', name: 'BetaScission', role: 'reactant' }]
        }
      ],
      byPrefix: [
        {
          prefix: 'BetaScission',
          count: 1,
          patterns: [{ id: '501', name: 'BetaScission' }]
        }
      ]
    },
    pathways: {
      total: 1,
      clusters: [
        {
          baseName: 'BasicLowTemperature',
          count: 2,
          pathways: [
            { id: 'p1', name: 'BasicLowTemperature_V1', version: 'V1' },
            { id: 'p2', name: 'BasicLowTemperature_V2', version: 'V2' }
          ]
        }
      ]
    },
    mechanisms: {
      total: 1,
      clusters: [
        {
          targetMolecule: 'butane',
          count: 1,
          mechanisms: [{ id: 'm1', name: 'mech-butane' }]
        }
      ]
    }
  };

  beforeEach(async () => {
    adminServiceMock = {
      runAudit: jasmine.createSpy('runAudit').and.returnValue(of({
        success: true,
        targetUid: 'UOqk0KtFtaXma5TGsi8Seh9RMbx1',
        results: mockAuditResult
      })),
      autoSyncSafe: jasmine.createSpy('autoSyncSafe').and.returnValue(of({
        success: true,
        targetUid: 'UOqk0KtFtaXma5TGsi8Seh9RMbx1',
        result: { database: 'Substructures', prunedGhosts: 1, syncedNames: 0, syncedOrphans: 1 }
      })),
      remediate: jasmine.createSpy('remediate').and.returnValue(of({
        success: true,
        targetUid: 'UOqk0KtFtaXma5TGsi8Seh9RMbx1',
        result: { ok: true }
      })),
      generateCatalogLists: jasmine.createSpy('generateCatalogLists').and.returnValue(of({
        success: true,
        targetUid: 'UOqk0KtFtaXma5TGsi8Seh9RMbx1',
        lists: mockCatalogLists
      })),
      getCatalogLists: jasmine.createSpy('getCatalogLists').and.returnValue(of({
        success: true,
        lists: mockCatalogLists
      }))
    };

    authServiceMock = {
      getToken: jasmine.createSpy('getToken').and.returnValue('test-token'),
      activeDataScope: signal<'personal' | 'system'>('personal'),
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [AdministrationPanelComponent],
      providers: [
        { provide: AdminManagementService, useValue: adminServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdministrationPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load initial audit on init, and fetch catalog lists when a list section is opened', () => {
    expect(component).toBeTruthy();
    expect(adminServiceMock.runAudit).toHaveBeenCalled();
    expect(component.totalIssuesCount()).toBe(3);
    expect(component.safeIssuesCount()).toBe(2);

    // Should load catalog lists when opening a list section
    component.setSection('molecules');
    expect(adminServiceMock.getCatalogLists).toHaveBeenCalled();
  });

  it('should filter issues correctly by type', () => {
    component.auditIssueFilter.set('all');
    expect(component.currentIssues().length).toBe(3);

    component.auditIssueFilter.set('ghosts');
    expect(component.currentIssues().length).toBe(1);
    expect(component.currentIssues()[0].type).toBe('GHOST_INDEX_KEY');

    component.auditIssueFilter.set('orphans');
    expect(component.currentIssues().length).toBe(1);
    expect(component.currentIssues()[0].type).toBe('ORPHAN_RECORD');

    component.auditIssueFilter.set('duplicates');
    expect(component.currentIssues().length).toBe(1);
    expect(component.currentIssues()[0].type).toBe('DUPLICATE_NAME_IN_RECORDS');
  });

  it('should filter molecules by search query', () => {
    component.catalogLists.set(mockCatalogLists);
    component.listSearchQuery.set('but');
    expect(component.filteredMolecules().length).toBe(1);
    expect(component.filteredMolecules()[0].name).toBe('butane');

    component.listSearchQuery.set('xyz');
    expect(component.filteredMolecules().length).toBe(0);
  });

  it('should toggle accordion states for families and pathways', () => {
    expect(component.isFamilyExpanded('betaradical(X)')).toBeFalse();
    component.toggleFamily('betaradical(X)');
    expect(component.isFamilyExpanded('betaradical(X)')).toBeTrue();
    component.toggleFamily('betaradical(X)');
    expect(component.isFamilyExpanded('betaradical(X)')).toBeFalse();

    expect(component.isPathwayExpanded('BasicLowTemperature')).toBeFalse();
    component.togglePathway('BasicLowTemperature');
    expect(component.isPathwayExpanded('BasicLowTemperature')).toBeTrue();
  });

  it('should handle autoSyncSafe action and trigger audit re-run', () => {
    component.autoSyncSafe();
    expect(adminServiceMock.autoSyncSafe).toHaveBeenCalledWith('Substructures');
    expect(component.statusMessage()?.type).toBe('success');
  });

  it('should open and confirm deletion modal', () => {
    const issue = mockAuditResult['Substructures'].issues[2];
    component.openDeleteModal(issue);
    expect(component.deleteConfirmIssue()).toBe(issue);

    component.confirmDelete();
    expect(adminServiceMock.remediate).toHaveBeenCalledWith(
      'delete_record',
      'Substructures',
      jasmine.objectContaining({ id: '10002' })
    );
    expect(component.deleteConfirmIssue()).toBeNull();
  });

  it('should open and confirm rename modal', () => {
    const issue = mockAuditResult['Substructures'].issues[2];
    component.openRenameModal(issue);
    expect(component.renameModalIssue()).toBe(issue);
    expect(component.renameNewName()).toBe('betaolefinradical');

    component.renameNewName.set('betaolefinradical-unique');
    component.confirmRename();
    expect(adminServiceMock.remediate).toHaveBeenCalledWith(
      'rename_record',
      'Substructures',
      jasmine.objectContaining({ id: '10002', newName: 'betaolefinradical-unique' })
    );
    expect(component.renameModalIssue()).toBeNull();
  });
});

