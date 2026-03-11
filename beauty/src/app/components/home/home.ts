import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {
  services = [
    {
      title: 'Facial Treatments',
      description: 'Personalized skin care to bring out your natural glow.',
      icon: 'face'
    },
    {
      title: 'Body Massage',
      description: 'Experience deep relaxation with our calming aromatherapy.',
      icon: 'spa'
    },
    {
      title: 'Therapeutic Baths',
      description: 'Soak away your stress in our premium blue orchid baths.',
      icon: 'hot_tub'
    }
  ];
}
