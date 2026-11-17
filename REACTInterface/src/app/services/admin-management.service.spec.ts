import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminManagementService } from './admin-management.service';
import { AuthService } from './auth.service';
import { signal } from '@angular/core';

describe('AdminManagementService', () => {
  let service: AdminManagementService;
  let httpMock: HttpTestingController;
  let authServiceMock: any;

  beforeEach(() => {
    authServiceMock = {
      getToken: jasmine.createSpy('getToken').and.returnValue('mock-token'),
      activeDataScope: signal<'personal' | 'system'>('personal'),
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(true)
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AdminManagementService,
        { provide: AuthService, useValue: authServiceMock }
      ]
    });

    service = TestBed.inject(AdminManagementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should execute runAudit with scope headers and return audit results', () => {
    service.runAudit('Substructures').subscribe((res) => {
      expect(res.success).toBeTrue();
      expect(res.results['Substructures']).toBeDefined();
      expect(res.results['Substructures'].issues.length).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost:8085/api/admin/integrity/audit');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
    expect(req.request.headers.get('X-React-Data-Scope')).toBe('personal');
    expect(req.request.body).toEqual({ database: 'Substructures', scope: 'personal' });

    req.flush({
      success: true,
      targetUid: 'UOqk0KtFtaXma5TGsi8Seh9RMbx1',
      results: {
        Substructures: {
          database: 'Substructures',
          classIndex: 'DB-Index-SubStructureIDs',
          summary: {
            totalRecords: 10,
            totalKeys: 11,
            uniqueNames: 10,
            orphanCount: 0,
            ghostCount: 1,
            mismatchCount: 0,
            duplicateNameCount: 0,
            duplicateIdCount: 0
          },
          issues: [
            {
              type: 'GHOST_INDEX_KEY',
              database: 'Substructures',
              id: '10000',
              name: 'ghost',
              message: 'Index key exists without record doc',
              severity: 'warning',
              safeToAutoSync: true
            }
          ]
        }
      }
    });
  });

  it('should execute autoSyncSafe and return sync summary', () => {
    service.autoSyncSafe('Substructures').subscribe((res) => {
      expect(res.success).toBeTrue();
      expect(res.result.prunedGhosts).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost:8085/api/admin/integrity/remediate');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.action).toBe('auto_sync_safe');
    expect(req.request.body.database).toBe('Substructures');

    req.flush({
      success: true,
      targetUid: 'UOqk0KtFtaXma5TGsi8Seh9RMbx1',
      result: {
        database: 'Substructures',
        prunedGhosts: 1,
        syncedNames: 0,
        syncedOrphans: 0
      }
    });
  });

  it('should call remediate with custom action and parameters', () => {
    service.remediate('rename_record', 'Substructures', { id: '101', newName: 'alcohol-v2' }).subscribe((res) => {
      expect(res.success).toBeTrue();
    });

    const req = httpMock.expectOne('http://localhost:8085/api/admin/integrity/remediate');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.action).toBe('rename_record');
    expect(req.request.body.id).toBe('101');
    expect(req.request.body.newName).toBe('alcohol-v2');

    req.flush({ success: true, targetUid: 'UOqk0KtFtaXma5TGsi8Seh9RMbx1', result: { id: '101' } });
  });

  it('should call generateCatalogLists', () => {
    service.generateCatalogLists().subscribe((res) => {
      expect(res.success).toBeTrue();
      expect(res.lists).toBeDefined();
    });

    const req = httpMock.expectOne('http://localhost:8085/api/admin/lists/generate');
    expect(req.request.method).toBe('POST');

    req.flush({
      success: true,
      targetUid: 'UOqk0KtFtaXma5TGsi8Seh9RMbx1',
      lists: {
        generatedAt: new Date().toISOString(),
        targetUid: 'UOqk0KtFtaXma5TGsi8Seh9RMbx1',
        molecules: [],
        substructures: { total: 0, families: [], moleculesInSubstructures: [], substructureMap: {} },
        reactionPatterns: { total: 0, bySubstructure: [], byPrefix: [] },
        pathways: { total: 0, clusters: [] },
        mechanisms: { total: 0, clusters: [] }
      }
    });
  });

  it('should call getCatalogLists for specific list type', () => {
    service.getCatalogLists('molecules').subscribe((res) => {
      expect(res.success).toBeTrue();
    });

    const req = httpMock.expectOne('http://localhost:8085/api/admin/lists/molecules');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, listType: 'molecules', data: [] });
  });
});

