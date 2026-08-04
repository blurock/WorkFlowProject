import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReactCloudApiService } from './react-cloud-api.service';

describe('ReactCloudApiService', () => {
  let service: ReactCloudApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ReactCloudApiService
      ]
    });
    service = TestBed.inject(ReactCloudApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should parse catalog stdout correctly from first to last matching line', () => {
    const rawStdout = `
      Initializing database connection...
      Reading meta data...
      24018: -->KetoHydroPeroxideDecompToAldRadical-CRRRH<--
      24019: -->PeroxideDecomposition-CRRRH<--
      24020: -->EtherRadicalAddition-CRRRH<--
      Database session finished.
      Goodbye.
    `;

    const items = service.parseCatalogOutput(rawStdout);
    expect(items.length).toBe(3);

    expect(items[0]).toEqual({
      id: '24018',
      name: 'KetoHydroPeroxideDecompToAldRadical-CRRRH',
      rawLine: '      24018: -->KetoHydroPeroxideDecompToAldRadical-CRRRH<--'
    });

    expect(items[1]).toEqual({
      id: '24019',
      name: 'PeroxideDecomposition-CRRRH',
      rawLine: '      24019: -->PeroxideDecomposition-CRRRH<--'
    });

    expect(items[2]).toEqual({
      id: '24020',
      name: 'EtherRadicalAddition-CRRRH',
      rawLine: '      24020: -->EtherRadicalAddition-CRRRH<--'
    });
  });

  it('should return empty array when no matching lines exist', () => {
    const rawStdout = `
      Initializing database connection...
      No catalog items found.
      Goodbye.
    `;

    const items = service.parseCatalogOutput(rawStdout);
    expect(items.length).toBe(0);
  });
});
