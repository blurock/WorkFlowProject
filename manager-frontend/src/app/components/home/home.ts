import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

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

  goToDatastoreTerms() {
    this.router.navigate(['/datastore-terms']);
  }
}
