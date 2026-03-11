import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { BookingComponent } from './components/booking/booking';
import { MyBookingsComponent } from './components/my-bookings/my-bookings';
import { UserProfileComponent } from './components/user-profile/user-profile';
import { ProfileEditorComponent } from './components/profile-editor/profile-editor';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'booking', component: BookingComponent },
    { path: 'my-bookings', component: MyBookingsComponent },
    { path: 'profile', component: UserProfileComponent },
    { path: 'edit-profile', component: ProfileEditorComponent },
    { path: '**', redirectTo: '' }
];
