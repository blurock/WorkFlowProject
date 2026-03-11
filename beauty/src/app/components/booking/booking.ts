import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SalonDataService } from '../../services/salon-data.service';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './booking.html',
  styleUrl: './booking.scss'
})
export class BookingComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private salonService = inject(SalonDataService);

  services = [
    { value: 'Blue Orchid Massage', viewValue: 'Blue Orchid Massage' },
    { value: 'Rejuvenating Facial', viewValue: 'Rejuvenating Facial' },
    { value: 'Therapeutic Bath', viewValue: 'Therapeutic Bath' },
    { value: 'Manicure & Pedicure', viewValue: 'Manicure & Pedicure' },
    { value: 'Hair Styling', viewValue: 'Hair Styling' }
  ];

  bookingForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    service: ['', Validators.required],
    date: ['', Validators.required],
    time: ['', Validators.required],
    notes: ['']
  });

  minDate = new Date();

  async onSubmit() {
    if (this.bookingForm.valid) {
      const bookingId = 'BK_' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const bookingData = {
        ...this.bookingForm.value,
        id: bookingId,
        status: 'pending',
        customerId: 'default_user' // Link to the current logged-in user
      };

      try {
        // 1. Save to main salon data collection
        await this.salonService.createBooking(bookingId, bookingData);

        // 2. Trigger emails via 'mail' collection
        await this.salonService.sendBookingEmails(bookingData);

        this.snackBar.open('Thank you! Your booking is confirmed and emails have been sent.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
        this.bookingForm.reset();
      } catch (error) {
        console.error('Booking error:', error);
        this.snackBar.open('Oops! Something went wrong. Please try again.', 'Close', { duration: 5000 });
      }
    }
  }
}
