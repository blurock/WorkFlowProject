import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdministrationPanelComponent } from './administration-panel.component';
import { AdminManagementService, AuditResult, CatalogListsPayload } from '../../services/admin-management.service';
import { AuthService } from '../../services/auth.service';
import { ReactCloudApiService } from '../../services/react-cloud-api.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('AdministrationPanelComponent', () => {
  let component: AdministrationPanelComponent;
  let fixture: ComponentFixture<AdministrationPanelComponent>;
  let adminServiceMock: any;
  let authServiceMock: any;
  let apiServiceMock: any;

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
          ids: ['10002', '10003'],
          name: 'betaolefinradical',
          message: 'Duplicate name in records',
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
      })),
      fetchRecord: jasmine.createSpy('fetchRecord').and.callFake((db: string, id: any) => of({
        found: true,
        data: {
          ID: Number(id),
          Name: 'betaolefinradical',
          Molfile: {
            NAtoms: 2,
            NBonds: 1,
            Atoms: [
              { AtomicNumber: 6, X: 0, Y: 0, Z: 0, Radical: 0 },
              { AtomicNumber: 6, X: 1.5, Y: 0, Z: 0, Radical: 2 }
            ],
            Bonds: [
              { I: 0, J: 1, Order: 2 }
            ]
          }
        }
      })),
      migrateSubstructure: jasmine.createSpy('migrateSubstructure').and.returnValue(of({
        success: true,
        oldId: 10002,
        newId: 10003,
        countUpdated: 1,
        updatedPatterns: [{ id: 501, name: 'BetaScission' }],
        deletedOld: true
      }))
    };

    apiServiceMock = {
      checkDatabaseDependencies: jasmine.createSpy('checkDatabaseDependencies').and.returnValue(of({
        hasDependencies: true,
        count: 1,
        dependencies: [
          { id: 501, name: 'BetaScission', type: 'ReactionPattern', role: 'Reactant Substructure' }
        ]
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
        { provide: ReactCloudApiService, useValue: apiServiceMock },
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

  it('should call addOrphanToIndex and trigger remediate with sync_to_classification', () => {
    const orphanIssue = mockAuditResult['Substructures'].issues[1]; // ORPHAN_RECORD
    component.addOrphanToIndex(orphanIssue);
    expect(adminServiceMock.remediate).toHaveBeenCalledWith(
      'sync_to_classification',
      'Substructures',
      jasmine.objectContaining({ id: '10001', name: 'orphan-rec' })
    );
    expect(component.statusMessage()?.type).toBe('success');
  });

  it('should call syncName and trigger remediate with sync_name_to_classification', () => {
    const mismatchIssue: any = {
      type: 'NAME_MISMATCH',
      database: 'Substructures',
      id: '11009604',
      recordName: 'cyclohexane-14-CyclicEther-HR',
      indexName: 'cyclohexane-14-CyclicEther-RH'
    };
    component.syncName(mismatchIssue);
    expect(adminServiceMock.remediate).toHaveBeenCalledWith(
      'sync_name_to_classification',
      'Substructures',
      jasmine.objectContaining({ id: '11009604', name: 'cyclohexane-14-CyclicEther-HR' })
    );
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

  it('should correctly identify duplicate substructures with isDuplicateSubstructure', () => {
    const dupSub1: any = { database: 'Substructures', type: 'DUPLICATE_RECORD_NAME' };
    const dupSub2: any = { database: 'Substructures', type: 'DUPLICATE_NAME_IN_RECORDS' };
    const dupSub3: any = { database: 'Substructures', type: 'DUPLICATE_INDEX_NAME' };
    const nonSubDup: any = { database: 'Molecules', type: 'DUPLICATE_RECORD_NAME' };
    const nonDupSub: any = { database: 'Substructures', type: 'GHOST_INDEX_KEY' };

    expect(component.isDuplicateSubstructure(dupSub1)).toBeTrue();
    expect(component.isDuplicateSubstructure(dupSub2)).toBeTrue();
    expect(component.isDuplicateSubstructure(dupSub3)).toBeTrue();
    expect(component.isDuplicateSubstructure(nonSubDup)).toBeFalse();
    expect(component.isDuplicateSubstructure(nonDupSub)).toBeFalse();
  });

  describe('Deduplication & Adjustment Workflow', () => {
    beforeEach(() => {
      spyOn(window, 'confirm').and.returnValue(true);
    });

    it('should open a deduplicate dynamic tab and load duplicate substructures', async () => {
      const issue = mockAuditResult['Substructures'].issues[2]; // DUPLICATE_NAME_IN_RECORDS
      component.openDeduplicateTab(issue);

      expect(component.dynamicTabs().length).toBe(1);
      const tab = component.dynamicTabs()[0];
      expect(tab.type).toBe('deduplicate');
      expect(tab.substructureName).toBe('betaolefinradical');
      expect(component.activeSection()).toBe(tab.id);

      // Wait for async loadDeduplicateSubstructures
      await fixture.whenStable();

      expect(adminServiceMock.fetchRecord).toHaveBeenCalledWith('Substructures', '10002');
      expect(adminServiceMock.fetchRecord).toHaveBeenCalledWith('Substructures', '10003');
      expect(apiServiceMock.checkDatabaseDependencies).toHaveBeenCalled();
      expect(tab.duplicateItems?.length).toBe(2);
      expect(tab.correspondencesMatch).toBeTrue();
    });

    it('should delete an unused duplicate substructure when confirmed', () => {
      const issue = mockAuditResult['Substructures'].issues[2];
      component.openDeduplicateTab(issue);
      const tab = component.dynamicTabs()[0];

      const itemToDelete = {
        id: '10002',
        name: 'betaolefinradical',
        data: {},
        molfile: '',
        dependencies: [],
        isLoadingDependencies: false
      };
      const remainingItem = {
        id: '10003',
        name: 'betaolefinradical',
        data: {},
        molfile: '',
        dependencies: [{ id: 501, name: 'BetaScission' }],
        isLoadingDependencies: false
      };
      tab.duplicateItems = [itemToDelete, remainingItem];

      component.deleteUnusedSubstructure(tab, itemToDelete);

      expect(adminServiceMock.remediate).toHaveBeenCalledWith(
        'delete_record',
        'Substructures',
        jasmine.objectContaining({ id: '10002' })
      );
      // Since only 1 remains, the deduplicate tab should auto-close
      expect(component.dynamicTabs().some(t => t.id === tab.id)).toBeFalse();
    });

    it('should execute safe move between identical substructures and close the tab', () => {
      const issue = mockAuditResult['Substructures'].issues[2];
      component.openDeduplicateTab(issue);
      const tab = component.dynamicTabs()[0];

      const sourceSub = { id: '10002', name: 'betaolefinradical', data: {}, molfile: '', dependencies: [{ id: 501, name: 'BetaScission' }], isLoadingDependencies: false };
      const targetSub = { id: '10003', name: 'betaolefinradical', data: {}, molfile: '', dependencies: [], isLoadingDependencies: false };
      tab.duplicateItems = [sourceSub, targetSub];
      tab.correspondencesMatch = true;

      component.executeSafeMove(tab, sourceSub, targetSub);

      expect(adminServiceMock.migrateSubstructure).toHaveBeenCalledWith('10002', '10003', true);
      expect(component.dynamicTabs().some(t => t.id === tab.id)).toBeFalse();
      expect(component.statusMessage()?.type).toBe('success');
    });

    it('should execute move and adjust and open adjust-pattern dynamic tabs', () => {
      const issue = mockAuditResult['Substructures'].issues[2];
      component.openDeduplicateTab(issue);
      const tab = component.dynamicTabs()[0];

      const sourceSub = { id: '10002', name: 'betaolefinradical', data: {}, molfile: '', dependencies: [{ id: 501, name: 'BetaScission' }], isLoadingDependencies: false };
      const targetSub = { id: '10003', name: 'betaolefinradical', data: {}, molfile: '', dependencies: [], isLoadingDependencies: false };
      tab.duplicateItems = [sourceSub, targetSub];
      tab.correspondencesMatch = false;

      component.executeMoveAndAdjust(tab, sourceSub, targetSub);

      expect(adminServiceMock.migrateSubstructure).toHaveBeenCalledWith('10002', '10003', true);
      // Deduplicate tab closed
      expect(component.dynamicTabs().some(t => t.id === tab.id)).toBeFalse();
      // Adjust pattern tab created
      const adjustTabs = component.dynamicTabs().filter(t => t.type === 'adjust-pattern');
      expect(adjustTabs.length).toBe(1);
      expect(adjustTabs[0].patternId).toBe(501);
      expect(adjustTabs[0].patternName).toBe('BetaScission');
      expect(component.activeSection()).toBe(adjustTabs[0].id);
    });

    it('should close dynamic tab and fallback to verify section when no tabs remain', () => {
      const issue = mockAuditResult['Substructures'].issues[2];
      component.openDeduplicateTab(issue);
      const tab = component.dynamicTabs()[0];

      component.closeDynamicTab(tab.id);
      expect(component.dynamicTabs().length).toBe(0);
      expect(component.activeSection()).toBe('verify');
    });

    it('should call remediate with purge_all_temporary_records and update status', () => {
      adminServiceMock.remediate.and.returnValue(of({
        success: true,
        targetUid: 'u1',
        result: { database: 'Molecules', purgedCount: 3, prunedKeysTotal: 2 }
      }));

      component.selectedDatabase.set('Molecules');
      component.purgeAllTemporaryRecords();

      expect(adminServiceMock.remediate).toHaveBeenCalledWith('purge_all_temporary_records', 'Molecules', {});
      expect(component.statusMessage()?.text).toContain('Removed 3 temporary record(s)');
    });
  });
});

