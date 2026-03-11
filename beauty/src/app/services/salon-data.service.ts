import { Injectable, inject } from '@angular/core';
import {
    Firestore,
    collection,
    doc,
    setDoc,
    getDoc,
    query,
    where,
    getDocs,
    updateDoc
} from '@angular/fire/firestore';
import { from, Observable, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SalonDataService {
    private firestore = inject(Firestore);
    private collectionName = 'beauty_salon_data';

    /**
     * Saves or updates a user profile in the single collection.
     * Document ID will be 'cust_' + userId
     */
    async updateCustomerProfile(userId: string, data: any) {
        const docRef = doc(this.firestore, this.collectionName, `cust_${userId}`);
        return setDoc(docRef, {
            ...data,
            type: 'customer',
            updatedAt: new Date().toISOString()
        }, { merge: true });
    }

    /**
     * Fetches a customer profile by ID.
     */
    getCustomerProfile(userId: string): Observable<any> {
        const docRef = doc(this.firestore, this.collectionName, `cust_${userId}`);
        return from(getDoc(docRef)).pipe(
            map(snapshot => snapshot.exists() ? snapshot.data() : null)
        );
    }

    /**
     * Creates a new booking in the single collection.
     */
    async createBooking(bookingId: string, bookingData: any) {
        console.log('Attempting to create booking:', bookingId);
        const docRef = doc(this.firestore, this.collectionName, `book_${bookingId}`);
        try {
            const res = await setDoc(docRef, {
                ...bookingData,
                type: 'booking',
                createdAt: new Date().toISOString()
            });
            console.log('Booking created successfully!');
            return res;
        } catch (err) {
            console.error('Error in createBooking:', err);
            throw err;
        }
    }

    /**
     * Fetches all bookings for a specific customer.
     */
    getCustomerBookings(customerId: string): Observable<any[]> {
        console.log('Fetching bookings for customer:', customerId);
        const colRef = collection(this.firestore, this.collectionName);
        const q = query(
            colRef,
            where('type', '==', 'booking'),
            where('customerId', '==', customerId)
        );
        return from(getDocs(q)).pipe(
            map(snapshot => {
                console.log('Found bookings:', snapshot.docs.length);
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            })
        );
    }

    /**
     * Triggers email notifications by writing to the 'mail' collection.
     * This follows the standard Firebase 'Trigger Email' extension pattern.
     */
    async sendBookingEmails(bookingData: any) {
        console.log('Triggering emails for booking:', bookingData.id);
        const mailCol = collection(this.firestore, 'mail');

        try {
            // 1. Email to the Customer
            const customerMailDoc = doc(mailCol);
            await setDoc(customerMailDoc, {
                to: bookingData.email,
                message: {
                    subject: 'Your Serenity Session is Confirmed! - Blue Orchid Spa',
                    html: `
                        <h1>Welcome to Tranquility, ${bookingData.name}</h1>
                        <p>We are delighted to confirm your booking for <b>${bookingData.service}</b>.</p>
                        <p><b>Date:</b> ${new Date(bookingData.date).toLocaleDateString()}</p>
                        <p><b>Time:</b> ${bookingData.time}</p>
                        <p>Our expert therapists are looking forward to providing you with a personalized experience.</p>
                        <hr>
                        <small>Blue Orchid Spa - <i>Calming. Personalized. Refined.</i></small>
                    `
                }
            });
            console.log('Customer email doc created.');

            // 2. Notification to Alexandra
            const adminMailDoc = doc(mailCol);
            await setDoc(adminMailDoc, {
                to: 'alexandra.blurock@gmail.com',
                message: {
                    subject: `New Spa Booking! - ${bookingData.service}`,
                    html: `
                        <h2>New Appointment Request</h2>
                        <ul>
                            <li><b>Customer:</b> ${bookingData.name}</li>
                            <li><b>Email:</b> ${bookingData.email}</li>
                            <li><b>Phone:</b> ${bookingData.phone}</li>
                            <li><b>Service:</b> ${bookingData.service}</li>
                            <li><b>Date:</b> ${new Date(bookingData.date).toLocaleDateString()}</li>
                            <li><b>Time:</b> ${bookingData.time}</li>
                            <li><b>Notes:</b> ${bookingData.notes || 'None'}</li>
                        </ul>
                    `
                }
            });
            console.log('Admin notification email doc created.');
        } catch (err) {
            console.error('Error in sendBookingEmails:', err);
            throw err;
        }
    }
}
