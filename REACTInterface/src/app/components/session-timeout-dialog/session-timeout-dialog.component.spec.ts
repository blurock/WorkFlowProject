import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionTimeoutDialogComponent } from './session-timeout-dialog.component';
import { AuthService } from '../../services/auth.service';

describe('SessionTimeoutDialogComponent', () => {
  let component: SessionTimeoutDialogComponent;
  let fixture: ComponentFixture<SessionTimeoutDialogComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SessionTimeoutDialogComponent],
      providers: [
        AuthService,
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SessionTimeoutDialogComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the dialog component', () => {
    expect(component).toBeTruthy();
  });

  it('should not render dialog overlay when showTimeoutDialog is false', () => {
    authService.showTimeoutDialog.set(false);
    fixture.detectChanges();
    const overlay = fixture.nativeElement.querySelector('.timeout-backdrop');
    expect(overlay).toBeNull();
  });

  it('should render dialog overlay and warning content when showTimeoutDialog is true and type is warning', () => {
    authService.timeoutDialogType.set('warning');
    authService.timeoutDialogMessage.set('Session expiring in 3 minutes');
    authService.showTimeoutDialog.set(true);
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.timeout-backdrop');
    expect(overlay).toBeTruthy();
    expect(overlay.querySelector('.dialog-warning')).toBeTruthy();
    expect(overlay.querySelector('h3').textContent).toContain('Session Expiring Soon');
    expect(overlay.querySelector('.dialog-message').textContent).toContain('Session expiring in 3 minutes');
  });

  it('should render expired content and Sign In Again button when type is expired', () => {
    authService.timeoutDialogType.set('expired');
    authService.timeoutDialogMessage.set('Session has expired');
    authService.showTimeoutDialog.set(true);
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.timeout-backdrop');
    expect(overlay.querySelector('.dialog-expired')).toBeTruthy();
    expect(overlay.querySelector('h3').textContent).toContain('Session Expired');
    expect(overlay.querySelector('.reauth-btn')).toBeTruthy();
  });

  it('should invoke dismiss on Remind Later button click in warning mode', () => {
    spyOn(authService, 'dismissTimeoutDialog');
    authService.timeoutDialogType.set('warning');
    authService.showTimeoutDialog.set(true);
    fixture.detectChanges();

    const dismissBtn = fixture.nativeElement.querySelector('.dismiss-btn') as HTMLButtonElement;
    dismissBtn.click();

    expect(authService.dismissTimeoutDialog).toHaveBeenCalled();
  });

  it('should invoke extendSession on Extend Session button click', () => {
    spyOn(authService, 'extendSession');
    authService.timeoutDialogType.set('warning');
    authService.showTimeoutDialog.set(true);
    fixture.detectChanges();

    const extendBtn = fixture.nativeElement.querySelector('.extend-btn') as HTMLButtonElement;
    extendBtn.click();

    expect(authService.extendSession).toHaveBeenCalled();
  });
});

