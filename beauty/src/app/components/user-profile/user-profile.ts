import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { SalonDataService } from '../../services/salon-data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss'
})
export class UserProfileComponent implements OnInit {
  private salonService = inject(SalonDataService);
  private router = inject(Router);

  userId = 'default_user';
  user: any = {
    name: 'Guest User',
    email: '',
    phone: '',
    memberSince: 'March 2026',
    loyaltyPoints: 0,
    membershipLevel: 'New Member',
    preferences: [],
    recentActivity: []
  };

  ngOnInit() {
    this.salonService.getCustomerProfile(this.userId).subscribe(profile => {
      if (profile) {
        this.user = {
          ...this.user,
          ...profile,
          membershipLevel: profile.loyaltyPoints > 1000 ? 'Gold Member' : 'Standard Member'
        };
      }
    });
  }

  editProfile() {
    this.router.navigate(['/edit-profile']);
  }
}
