import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
  MechanismPathwaysService,
  parsePathwayVersion,
  groupPathwayItems,
  filterGroupedPathways
} from './mechanism-pathways.service';

describe('MechanismPathwaysService & Pathway Grouping', () => {
  let service: MechanismPathwaysService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MechanismPathwaysService]
    });
    service = TestBed.inject(MechanismPathwaysService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('parsePathwayVersion', () => {
    it('should parse base name and version from standard versioned pathway names', () => {
      const p1 = parsePathwayVersion('BasicLowTemperatureV2.1');
      expect(p1.baseName).toBe('BasicLowTemperature');
      expect(p1.versionNum).toBe(2.1);
      expect(p1.versionLabel).toBe('V2.1');

      const p2 = parsePathwayVersion('AldehydeDecompositionV3');
      expect(p2.baseName).toBe('AldehydeDecomposition');
      expect(p2.versionNum).toBe(3);
      expect(p2.versionLabel).toBe('V3');

      const p3 = parsePathwayVersion('CyclicEtherFromQOOH_V4');
      expect(p3.baseName).toBe('CyclicEtherFromQOOH');
      expect(p3.versionNum).toBe(4);
      expect(p3.versionLabel).toBe('V4');
    });

    it('should handle unversioned or base pathway names cleanly', () => {
      const p = parsePathwayVersion('AldehydeDecomposition');
      expect(p.baseName).toBe('AldehydeDecomposition');
      expect(p.versionNum).toBe(1.0);
      expect(p.versionLabel).toBe('Base');
    });

    it('should handle multi-dot versions like V2.5.1', () => {
      const p = parsePathwayVersion('BasicLowTemperatureV2.5.1');
      expect(p.baseName).toBe('BasicLowTemperature');
      expect(p.versionLabel).toBe('V2.5.1');
    });
  });

  describe('groupPathwayItems', () => {
    it('should group pathways by base name and sort versions numerically', () => {
      const input = [
        'BasicLowTemperatureV3',
        'AldehydeDecompositionV4',
        'BasicLowTemperature',
        'AldehydeDecomposition',
        'BasicLowTemperatureV2.0',
        'Decomposition'
      ];

      const grouped = groupPathwayItems(input);
      expect(grouped.length).toBe(3);

      // Alphabetical by baseName
      expect(grouped[0].baseName).toBe('AldehydeDecomposition');
      expect(grouped[0].count).toBe(2);
      expect(grouped[0].versions.map(v => v.name)).toEqual(['AldehydeDecomposition', 'AldehydeDecompositionV4']);

      expect(grouped[1].baseName).toBe('BasicLowTemperature');
      expect(grouped[1].count).toBe(3);
      expect(grouped[1].versions.map(v => v.name)).toEqual([
        'BasicLowTemperature',
        'BasicLowTemperatureV2.0',
        'BasicLowTemperatureV3'
      ]);

      expect(grouped[2].baseName).toBe('Decomposition');
      expect(grouped[2].count).toBe(1);
    });

    it('should support objects with stepsCount', () => {
      const input = [
        { Name: 'AldehydeDecomposition', stepsCount: 5 },
        { Name: 'AldehydeDecompositionV3', stepsCount: 6 }
      ];

      const grouped = groupPathwayItems(input);
      expect(grouped.length).toBe(1);
      expect(grouped[0].versions[0].stepsCount).toBe(5);
      expect(grouped[0].versions[1].stepsCount).toBe(6);
    });
  });

  describe('filterGroupedPathways', () => {
    it('should filter groups matching query in base name or version', () => {
      const input = [
        'BasicLowTemperature',
        'BasicLowTemperatureV2.0',
        'AldehydeDecomposition',
        'AldehydeDecompositionV3'
      ];
      const grouped = groupPathwayItems(input);

      // Search by baseName
      const r1 = filterGroupedPathways(grouped, 'Aldehyde');
      expect(r1.length).toBe(1);
      expect(r1[0].baseName).toBe('AldehydeDecomposition');
      expect(r1[0].versions.length).toBe(2);

      // Search by version label
      const r2 = filterGroupedPathways(grouped, 'V2');
      expect(r2.length).toBe(1);
      expect(r2[0].baseName).toBe('BasicLowTemperature');
      expect(r2[0].versions.length).toBe(1);
      expect(r2[0].versions[0].name).toBe('BasicLowTemperatureV2.0');
    });

    it('should return all groups if query is empty', () => {
      const grouped = groupPathwayItems(['BasicLowTemp', 'AldehydeDecomposition']);
      const res = filterGroupedPathways(grouped, '');
      expect(res.length).toBe(2);
    });
  });
});

