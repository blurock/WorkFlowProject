import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-session-timeout-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './session-timeout-dialog.component.html',
  styleUrls: ['./session-timeout-dialog.component.scss']
})
export class SessionTimeoutDialogComponent {
  public authService = inject(AuthService);

  public onExtend(): void {
    this.authService.extendSession();
  }

  public onDismiss(): void {
    this.authService.dismissTimeoutDialog();
  }

  public onReauth(): void {
    this.authService.promptReauth();
  }

  public onBackdropClick(event: MouseEvent): void {
    if (this.authService.timeoutDialogType() === 'warning') {
      this.onDismiss();
    }
  }
}

