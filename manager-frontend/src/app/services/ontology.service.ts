import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { OntologyStructure } from '../components/primitives/base-primitive';

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

  getUITemplate(classname: string): Observable<OntologyStructure> {
    return this.http.post<ServiceResponse>(`${this.baseUrl}/api/datastore/ui-template`, { classname }).pipe(
      map(response => {
        if (response['dataset:servicesuccessful'] === 'true') {
          const struct = response['dataset:simpcatobj'].dataobject;
          
          // If the backend returns the properties map directly without root metadata,
          // wrap it in a proper root OntologyStructure so the DynamicPrimitive can render it.
          if (struct && !struct.isObject && !struct.isArray && !struct.identifier) {
            console.log(`[OntologyService] Wrapping raw properties map for ${classname}`);
            return {
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
              properties: struct
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

