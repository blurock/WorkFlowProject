import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, switchMap, tap, catchError, from } from 'rxjs';
import { CommandTemplatesRegistry } from '../templates/command-templates.registry';

export interface CatalogItem {
  id: string;
  name: string;
  rawLine: string;
}

export interface CatalogTask {
  id: string;
  title: string;
  inpFile: string;
  description: string;
  icon: string;
}

export interface ApiRunInputResponse {
  inputFile: string;
  root: string;
  exitCode: number;
  output: string;
  error?: string;
  elapsedMs?: number;
}

export interface ApiRunCommandsResponse {
  root: string;
  exitCode: number;
  output: string;
  jobId?: string;
  status?: string;
  error?: string;
  elapsedMs?: number;
}

export interface MechanismStorageFile {
  filename: string;
  label: string;
  fileType: 'mech' | 'sdf' | 'thm' | 'corrs' | 'log' | 'lsr' | 'zip' | string;
  sizeBytes: number;
  downloadUrl: string;
  gcsPath?: string;
  content?: string;
  isLoading?: boolean;
}

export interface ApiRunSubmechanismResponse {
  molecule: string;
  rootName: string;
  mechName: string;
  exitCode: number;
  signal?: string | null;
  output: string;
  combinedOutput?: string;
  executionLog?: string;
  error?: string;
  storageDirectory?: string;
  gcsPrefix?: string;
  files?: MechanismStorageFile[];
}

export interface ApiRunCombineSubmechanismResponse {
  rootName: string;
  mechName: string;
  count: number;
  exitCode: number;
  signal?: string | null;
  output: string;
  combinedOutput?: string;
  executionLog?: string;
  error?: string;
  storageDirectory?: string;
  gcsPrefix?: string;
  files?: MechanismStorageFile[];
}

@Injectable({
  providedIn: 'root'
})
export class ReactCloudApiService {
  private readonly baseUrl = 'http://localhost:8085';

  public readonly CATALOG_TASKS: CatalogTask[] = [
    {
      id: 'molecules',
      title: 'Molecules List',
      inpFile: 'PrintMoleculeList.inp',
      description: 'Retrieve catalog of molecules from REACT database',
      icon: 'science'
    },
    {
      id: 'rxn-patterns',
      title: 'Reaction Patterns',
      inpFile: 'PrintRxnPatternsList.inp',
      description: 'Retrieve catalog of reaction patterns and kinetics templates',
      icon: 'schema'
    },
    {
      id: 'substructures',
      title: 'Sub-Structures',
      inpFile: 'PrintSubStructures.inp',
      description: 'Retrieve catalog of chemical sub-structures',
      icon: 'grain'
    },
    {
      id: 'benson-groups',
      title: 'Benson Groups',
      inpFile: 'PrintBensonList.inp',
      description: 'Retrieve catalog of Benson thermodynamic group contributions',
      icon: 'thermostat'
    },
    {
      id: 'mechanisms',
      title: 'Mechanisms List',
      inpFile: 'PrintMechanismList.inp',
      description: 'Retrieve catalog of reaction mechanisms from REACT database',
      icon: 'account_tree'
    }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Request GCS V4 Signed Upload URL for direct frontend client file streaming obeying taxonomy path:
   * gs://<BUCKET>/users/<UID>/data/<category>/<subcategory>/<filename>
   */
  public getSignedUploadUrl(filename: string, targetDir?: string, contentType?: string): Observable<{
    success: boolean;
    uploadUrl: string;
    gcsPath: string;
    relativePath: string;
    category: string;
    subcategory: string;
    categoryPath: string;
    filename: string;
    fallback?: boolean;
    error?: string;
  }> {
    const payload = { filename, targetDir, contentType };
    return this.http.post<any>(`${this.baseUrl}/api/upload/get-signed-url`, payload);
  }

  /**
   * Modern Zero-POST Direct Cloud Storage Upload
   * Streams file or raw text content directly to Google Cloud Storage using pre-signed V4 PUT URL.
   * If direct GCS upload is unavailable (offline / mock / credentials), transparently falls back
   * to /api/upload-data-files.
   */
  public uploadFileToStorage(
    fileOrPayload: File | { filename: string; content: string },
    targetDir: string = '.'
  ): Observable<{
    success: boolean;
    gcsPath: string;
    relativePath: string;
    category?: string;
    subcategory?: string;
    filename: string;
    fallbackUsed?: boolean;
  }> {
    const isFile = fileOrPayload instanceof File;
    const filename = isFile ? fileOrPayload.name : fileOrPayload.filename;
    const contentType = isFile ? (fileOrPayload.type || 'text/plain') : 'text/plain;charset=utf-8';
    const body: any = isFile ? fileOrPayload : new Blob([fileOrPayload.content], { type: contentType });

    return this.getSignedUploadUrl(filename, targetDir, contentType).pipe(
      switchMap(res => {
        if (!res || !res.success || !res.uploadUrl || res.fallback) {
          throw new Error(res?.error || 'Direct GCS upload not supported by backend');
        }
        return this.http.put(res.uploadUrl, body, {
          headers: { 'Content-Type': contentType }
        }).pipe(
          map(() => ({
            success: true,
            gcsPath: res.gcsPath,
            relativePath: res.relativePath,
            category: res.category,
            subcategory: res.subcategory,
            filename: filename,
            fallbackUsed: false
          }))
        );
      }),
      catchError(err => {
        console.warn(`[ReactCloudApi] Direct GCS upload failed or unavailable (${err.message}). Falling back to /api/upload-data-files.`);
        if (isFile) {
          return from(fileOrPayload.text()).pipe(
            switchMap(text => {
              return this.uploadUserDataFiles(targetDir, [{ filename, content: text }]);
            }),
            map(uploadRes => {
              const fileInfo = uploadRes.files?.[0];
              return {
                success: true,
                gcsPath: fileInfo?.gcsPath || '',
                relativePath: fileInfo?.relativePath || filename,
                category: fileInfo?.category,
                subcategory: fileInfo?.subcategory,
                filename: filename,
                fallbackUsed: true
              };
            })
          );
        } else {
          return this.uploadUserDataFiles(targetDir, [fileOrPayload]).pipe(
            map(uploadRes => {
              const fileInfo = uploadRes.files?.[0];
              return {
                success: true,
                gcsPath: fileInfo?.gcsPath || '',
                relativePath: fileInfo?.relativePath || filename,
                category: fileInfo?.category,
                subcategory: fileInfo?.subcategory,
                filename: filename,
                fallbackUsed: true
              };
            })
          );
        }
      })
    );
  }

  /**
   * Direct Client-to-GCS File Upload via Signed Upload URL
   */
  public uploadFileDirectToGcs(file: File, targetDir?: string): Observable<{ gcsPath: string; relativePath: string; category: string; subcategory: string }> {
    return this.uploadFileToStorage(file, targetDir).pipe(
      map(res => ({
        gcsPath: res.gcsPath,
        relativePath: res.relativePath,
        category: res.category || '',
        subcategory: res.subcategory || ''
      }))
    );
  }

  /**
   * Legacy file-based template execution (/api/run-input)
   */
  public runInputTask(inpFile: string, rootName: string = 'job1'): Observable<CatalogItem[]> {
    const payload = {
      inputFile: inpFile,
      root: rootName
    };

    return this.http.post<ApiRunInputResponse>(`${this.baseUrl}/api/run-input`, payload).pipe(
      map(response => {
        if (response.output) {
          return this.parseCatalogOutput(response.output);
        }
        return [];
      })
    );
  }

  /**
   * Upload dataset files to user data directory in Cloud Storage (/api/upload-data-files)
   */
  public uploadUserDataFiles(targetDir: string, files: { filename: string; content: string }[]): Observable<{ success: boolean; targetDir: string; files: any[] }> {
    const payload = { targetDir, files };
    return this.http.post<{ success: boolean; targetDir: string; files: any[] }>(`${this.baseUrl}/api/upload-data-files`, payload);
  }


  /**
   * Run input file task with custom replacements map
   */
  public runInputTaskWithReplacements(inpFile: string, rootName: string, replacements: { [key: string]: string }): Observable<ApiRunInputResponse> {
    const payload = {
      inputFile: inpFile,
      root: rootName,
      replacements: replacements
    };
    return this.http.post<ApiRunInputResponse>(`${this.baseUrl}/api/run-input`, payload);
  }

  /**
   * New Option A Stateless Memory-Piped execution (/api/run-commands)
   */
  public runCommands(commands: string[], rootName: string = 'job1', targetItem?: string, taskId?: string, fileUrl?: string, fileName?: string): Observable<ApiRunCommandsResponse> {
    const payload: any = {
      commands: commands,
      root: rootName
    };
    if (targetItem) {
      payload.targetItem = targetItem;
    }
    if (taskId) {
      payload.taskId = taskId;
    }
    if (fileUrl) {
      payload.fileUrl = fileUrl;
    }
    if (fileName) {
      payload.fileName = fileName;
    }

    console.log(`[ReactCloudApi][runCommands] POST /api/run-commands with payload:`, {
      root: rootName,
      targetItem,
      taskId,
      commandCount: commands.length,
      firstCommands: commands.slice(0, 5)
    });

    return this.http.post<ApiRunCommandsResponse>(`${this.baseUrl}/api/run-commands`, payload).pipe(
      tap(res => {
        console.log(`[ReactCloudApi][runCommands] Response received: status=${res?.status}, jobId=${res?.jobId}, outputLength=${res?.output?.length}`);
      })
    );
  }

  /**
   * Resolve GCS URI (gs://...) or HTTPS URL and cache locally in user session disk
   */
  public resolveFileLink(fileUrl: string, fileName?: string): Observable<{ success: boolean; file: any }> {
    return this.http.post<{ success: boolean; file: any }>(`${this.baseUrl}/api/resolve-file-link`, { fileUrl, fileName });
  }

  /**
   * Run catalog task using Angular CommandTemplatesRegistry (Stateless memory-piped)
   */
  public runCatalogTaskWithRegistry(taskId: string, rootName: string = 'job1'): Observable<CatalogItem[]> {
    const commands = CommandTemplatesRegistry.getCatalogCommands(taskId);
    return this.runCommands(commands, rootName, undefined, taskId).pipe(
      map(response => {
        if (response.output) {
          return this.parseCatalogOutput(response.output);
        }
        return [];
      })
    );
  }

  /**
   * Run generic task using CommandTemplatesRegistry (Stateless memory-piped)
   */
  public runTaskWithRegistry(taskId: string, rootName: string = 'job1', fileUrl?: string, fileName?: string): Observable<ApiRunCommandsResponse> {
    const commands = CommandTemplatesRegistry.getTaskCommands(taskId, rootName);
    return this.runCommands(commands, rootName, undefined, taskId, fileUrl, fileName);
  }



  /**
   * Save LSR submechanism chain definition file (/api/save-lsr)
   */
  public saveLsrFile(rootName: string, content: string, category: string = 'submechanisms'): Observable<{ success: boolean; rootName: string; path: string; bytesWritten?: number }> {
    const payload = {
      rootName: rootName,
      content: content,
      category: category
    };
    return this.http.post<{ success: boolean; rootName: string; path: string; bytesWritten?: number }>(`${this.baseUrl}/api/save-lsr`, payload);
  }

  /**
   * Run submechanism from path task (/api/run-submechanism)
   */
  public runSubmechanismFromPath(
    molecule: string,
    rootName: string,
    supplement: string = '',
    runRoot: string = 'read',
    mechName?: string,
    lsrContent?: string,
    preferDisk?: boolean,
    category?: string
  ): Observable<ApiRunSubmechanismResponse> {
    const payload: any = {
      molecule: molecule,
      supplement: supplement,
      rootName: rootName,
      runRoot: runRoot
    };
    if (mechName) {
      payload.mechName = mechName;
    }
    if (lsrContent) {
      payload.lsrContent = lsrContent;
    }
    if (preferDisk !== undefined) {
      payload.preferDisk = preferDisk;
    }
    if (category) {
      payload.category = category;
    }
    return this.http.post<ApiRunSubmechanismResponse>(`${this.baseUrl}/api/run-submechanism`, payload);
  }

  /**
   * Run combine submechanisms task (/api/run-combine-submechanisms)
   */
  public runCombineSubmechanisms(rootName: string, mechName: string, submechanisms: string[]): Observable<ApiRunCombineSubmechanismResponse> {
    const payload = {
      rootName: rootName,
      mechName: mechName,
      submechanisms: submechanisms
    };
    return this.http.post<ApiRunCombineSubmechanismResponse>(`${this.baseUrl}/api/run-combine-submechanisms`, payload);
  }

  /**
   * Fetch available submechanism path root names (.lsr files in data/mechs/submechanisms)
   */
  public getSubmechanismPaths(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/api/submechanisms`);
  }

  /**
   * Parameterized lookup: fetch item detail output using CommandTemplatesRegistry (Stateless memory-piped)
   */
  public fetchItemDetails(taskId: string, itemName: string, rootName: string = 'job1'): Observable<string> {
    const commands = CommandTemplatesRegistry.getItemDetailCommands(taskId, itemName);
    console.log(`[ReactCloudApi][fetchItemDetails] Commands for taskId='${taskId}', itemName='${itemName}' (${commands.length} commands):`, commands);
    return this.runCommands(commands, rootName, itemName, taskId).pipe(
      map(response => {
        const out = response.output || 'No output returned.';
        console.log(`[ReactCloudApi][fetchItemDetails] Output for '${taskId}/${itemName}' (length=${out.length}, preview=${out.substring(0, 150).replace(/\n/g, ' ')})`);
        return out;
      })
    );
  }

  /**
   * Parses output stdout by isolating lines containing ': -->' or ':-->'
   */
  public parseCatalogOutput(output: string): CatalogItem[] {
    if (!output) return [];

    const lines = output.split(/\r?\n/);
    const matchingIndices: number[] = [];

    lines.forEach((line, index) => {
      if (line.includes(': -->') || line.includes(':-->')) {
        matchingIndices.push(index);
      }
    });

    if (matchingIndices.length === 0) {
      return [];
    }

    const firstIndex = matchingIndices[0];
    const lastIndex = matchingIndices[matchingIndices.length - 1];

    const catalogItems: CatalogItem[] = [];

    for (let i = firstIndex; i <= lastIndex; i++) {
      const line = lines[i];
      if (!line.includes(': -->') && !line.includes(':-->')) {
        continue;
      }

      // Format 1: " 24018: -->KetoHydroPeroxideDecompToAldRadical-CRRRH<--"
      const format1Match = line.match(/^\s*(\d+):\s*-->(.*)<--\s*$/);
      if (format1Match) {
        catalogItems.push({
          id: format1Match[1].trim(),
          name: format1Match[2].trim(),
          rawLine: line
        });
        continue;
      }

      // Format 2: ": -->          0: TableA.1"
      const format2Match = line.match(/: -->\s*(\d+):\s*(.+)$/);
      if (format2Match) {
        catalogItems.push({
          id: format2Match[1].trim(),
          name: format2Match[2].trim(),
          rawLine: line
        });
        continue;
      }

      // General Fallback
      const colonIndex = line.indexOf(':');
      const arrowStartIndex = line.indexOf('-->');
      const arrowEndIndex = line.indexOf('<--');

      if (arrowEndIndex !== -1 && colonIndex !== -1 && arrowStartIndex !== -1) {
        const id = line.substring(0, colonIndex).trim();
        const name = line.substring(arrowStartIndex + 3, arrowEndIndex).trim();
        catalogItems.push({ id, name, rawLine: line });
      } else if (arrowStartIndex !== -1) {
        const rest = line.substring(arrowStartIndex + 3).trim();
        const parts = rest.split(':');
        if (parts.length >= 2) {
          catalogItems.push({ id: parts[0].trim(), name: parts.slice(1).join(':').trim(), rawLine: line });
        } else {
          catalogItems.push({ id: `${i}`, name: rest, rawLine: line });
        }
      }
    }

    return catalogItems;
  }

  /**
   * Searches Reaction Patterns in Firestore matching reactive center encodings.
   */
  public searchRxnPatternsByCenter(params: {
    uid?: string;
    reactionCenterKey?: string;
    reactionBrokenBonds?: string | string[];
    reactionFormedBonds?: string | string[];
  }): Observable<{ success: boolean; count: number; records: any[] }> {
    return this.http.post<{ success: boolean; count: number; records: any[] }>(
      `${this.baseUrl}/api/db/searchRxnPatternsByCenter`,
      params
    );
  }

  /**
   * In-memory cache for downloaded ASCII artifact contents (URL -> text)
   */
  private asciiContentCache: Map<string, string> = new Map();

  /**
   * Fetch ASCII file content from Cloud Storage via download URL with in-memory caching
   */
  public fetchAsciiFileContent(downloadUrl: string): Observable<string> {
    if (!downloadUrl) return of('');
    if (this.asciiContentCache.has(downloadUrl)) {
      return of(this.asciiContentCache.get(downloadUrl)!);
    }
    return this.http.get(downloadUrl, { responseType: 'text' }).pipe(
      tap(content => {
        if (content) {
          this.asciiContentCache.set(downloadUrl, content);
        }
      }),
      catchError(err => {
        console.warn(`[ReactCloudApi] Failed to fetch ASCII content from ${downloadUrl}:`, err);
        return of(`[Error loading artifact content: ${err?.message || 'Download failed'}]`);
      })
    );
  }
}

