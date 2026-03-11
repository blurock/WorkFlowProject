import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { SalonDataService } from '../../services/salon-data.service';
import { inject, signal, OnInit } from '@angular/core';

interface Booking {
  id: string;
  service: string;
  date: any;
  time: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
}

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.scss'
})
export class MyBookingsComponent implements OnInit {
  private salonService = inject(SalonDataService);
  displayedColumns: string[] = ['service', 'date', 'time', 'status', 'actions'];

  bookings = signal<Booking[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.salonService.getCustomerBookings('default_user').subscribe({
      next: (data) => {
        // Sort by date descending
        const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.bookings.set(sorted);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching bookings:', err);
        this.isLoading.set(false);
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed': return 'primary';
      case 'pending': return 'accent';
      case 'completed': return 'success';
      case 'cancelled': return 'warn';
      default: return '';
    }
  }

  formatDate(date: any): string {
    if (!date) return 'TBA';
    const d = new Date(date);
    return d.toLocaleDateString();
  }
}
