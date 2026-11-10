import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionTimeoutDialogComponent } from './components/session-timeout-dialog/session-timeout-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SessionTimeoutDialogComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'REACTInterface';
}
