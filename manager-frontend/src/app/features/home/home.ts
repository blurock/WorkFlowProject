import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  private router = inject(Router);
  private auth = inject(Auth);

  goToDatastoreTerms() {
    this.router.navigate(['/datastore-terms']);
  }

  goToTermExtraction() {
    this.router.navigate(['/term-extraction']);
  }

  goToFillInOntology() {
    this.router.navigate(['/fill-in-ontology']);
  }

  goToExtractDescription() {
    this.router.navigate(['/extract-description']);
  }

  goToPrimitives() {
    this.router.navigate(['/primitives']);
  }

  goToMoleculeEditor() {
    this.router.navigate(['/molecule-editor']);
  }

  goToRunTransaction() {
    this.router.navigate(['/run-transaction']);
  }

  async goToWorkflowTask() {
    // Determine real UID if logged in
    const currentUser = await firstValueFrom(authState(this.auth));
    const uid = currentUser ? currentUser.uid : 'TEST_UID';
    const testSessionId = 'TEST_SESSION_ID';
    this.router.navigate([`/workflow-task/${uid}/${testSessionId}`]);
  }
}
