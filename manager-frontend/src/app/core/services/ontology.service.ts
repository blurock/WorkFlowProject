import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OntologyStructure } from '../../features/catalog/primitives/base-primitive';

export interface ServiceResponse {
  "dataset:servicesuccessful": string;
  "dataset:serviceresponsemessage": string;
  "dataset:simpcatobj": any;
}

@Injectable({
  providedIn: 'root'
})
export class OntologyService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  getUITemplate(classname: string): Observable<any> {
    return this.http.post<ServiceResponse>(`${this.baseUrl}/api/datastore/ui-template`, { classname }).pipe(
      map(response => {
        if (response['dataset:servicesuccessful'] === 'true') {
          const struct = response['dataset:simpcatobj'];
          if (struct && struct.dataobject) {
            struct.dataobject = {
              identifier: classname,
              classname: classname,
              isObject: true,
              isArray: false,
              isClassification: false,
              isParagraph: false,
              isOneLine: false,
              isEmail: false,
              isURL: false,
              isBoolean: false,
              isKeywordSet: false,
              isFileSource: false,
              label: classname.split(':').pop() || classname,
              properties: struct.dataobject
            } as OntologyStructure;
          }

          return struct;
        } else {
          throw new Error(response['dataset:serviceresponsemessage'] || 'Failed to fetch template');
        }
      })
    );
  }
}

