import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
  MechanismPathSetsService,
  MechanismPathSet,
  PathSetSummaryItem
} from './mechanism-path-sets.service';

describe('MechanismPathSetsService', () => {
  let service: MechanismPathSetsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MechanismPathSetsService]
    });
    service = TestBed.inject(MechanismPathSetsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list path sets from /api/db/listSummary', () => {
    const mockResponse = {
      found: true,
      records: [
        { Name: 'StandardLowTemperature', Title: 'Standard Low Temp', Paths: ['BetaHPeroxyToOlefin', 'AlkoxyFromPeroxy'], scope: 'system' as const }
      ]
    };

    service.listPathSets().subscribe(sets => {
      expect(sets.length).toBe(1);
      expect(sets[0].Name).toBe('StandardLowTemperature');
      expect(sets[0].Count).toBe(2);
      expect(sets[0].scope).toBe('system');
    });

    const req = httpMock.expectOne('http://localhost:8085/api/db/listSummary');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.dbName).toBe('MechanismPathSet');
    req.flush(mockResponse);
  });

  it('should fetch a single path set by name from /api/db/fetch', () => {
    const mockResponse = {
      found: true,
      scope: 'system' as const,
      data: {
        Name: 'StandardLowTemperature',
        Title: 'Standard Suite',
        Paths: ['Path1', 'Path2', 'Path3']
      }
    };

    service.fetchPathSet('StandardLowTemperature').subscribe(set => {
      expect(set).toBeTruthy();
      expect(set?.Name).toBe('StandardLowTemperature');
      expect(set?.Paths.length).toBe(3);
      expect(set?.IsSystem).toBe(true);
    });

    const req = httpMock.expectOne('http://localhost:8085/api/db/fetch');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.key).toBe('StandardLowTemperature');
    req.flush(mockResponse);
  });

  it('should store a path set via /api/db/store', () => {
    const set: MechanismPathSet = {
      Name: 'CustomAlkaneSet',
      Title: 'Custom Alkane Set',
      Paths: ['PathA', 'PathB']
    };

    service.storePathSet(set).subscribe(res => {
      expect(res.status).toBe('success');
    });

    const req = httpMock.expectOne('http://localhost:8085/api/db/store');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.dbName).toBe('MechanismPathSet');
    expect(req.request.body.key).toBe('CustomAlkaneSet');
    req.flush({ status: 'success' });
  });

  it('should delete a path set via /api/db/delete', () => {
    service.deletePathSet('CustomAlkaneSet').subscribe(res => {
      expect(res.status).toBe('deleted');
    });

    const req = httpMock.expectOne('http://localhost:8085/api/db/delete');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.key).toBe('CustomAlkaneSet');
    req.flush({ status: 'deleted' });
  });
});

