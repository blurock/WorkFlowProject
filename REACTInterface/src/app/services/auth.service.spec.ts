import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService Session Timeout & Expiration', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideRouter([])
      ]
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should parse JWT expiration timestamp correctly', () => {
    const expSeconds = Math.floor(Date.now() / 1000) + 1800; // 30 min from now
    const payload = { exp: expSeconds, uid: 'test-user-123' };
    const base64Payload = btoa(JSON.stringify(payload));
    const mockJwt = `eyJhbGciOiJIUzI1NiJ9.${base64Payload}.signature`;

    const parsedExpiry = service.parseJwtExpiry(mockJwt);
    expect(parsedExpiry).toBe(expSeconds * 1000);
  });

  it('should return null for non-JWT dev tokens or invalid tokens', () => {
    expect(service.parseJwtExpiry('reactcloud-bearer-token-admin')).toBeNull();
    expect(service.parseJwtExpiry('')).toBeNull();
    expect(service.parseJwtExpiry(null)).toBeNull();
    expect(service.parseJwtExpiry('invalid.jwt.token')).toBeNull();
  });

  it('should compute secondsRemaining and formattedTimeRemaining correctly for active session', () => {
    const futureMs = Date.now() + 125000; // ~2m 5s
    service.tokenExpiryMs.set(futureMs);
    service.nowMs.set(Date.now());
    service.isAuthenticated.set(true);

    expect(service.secondsRemaining()).toBeGreaterThanOrEqual(124);
    expect(service.isSessionExpiringSoon()).toBeTrue(); // <= 300 seconds
    expect(service.isSessionExpired()).toBeFalse();
    expect(service.formattedTimeRemaining()).toContain('2m');
  });

  it('should compute expired state when time remaining reaches 0', () => {
    const pastMs = Date.now() - 5000;
    service.tokenExpiryMs.set(pastMs);
    service.nowMs.set(Date.now());
    service.isAuthenticated.set(true);

    expect(service.secondsRemaining()).toBe(0);
    expect(service.isSessionExpired()).toBeTrue();
    expect(service.formattedTimeRemaining()).toBe('Expired');
  });

  it('should handle triggerSessionExpired and dismissTimeoutDialog', () => {
    service.triggerSessionExpired('Custom timeout message');
    expect(service.showTimeoutDialog()).toBeTrue();
    expect(service.timeoutDialogType()).toBe('expired');
    expect(service.timeoutDialogMessage()).toBe('Custom timeout message');

    service.dismissTimeoutDialog();
    expect(service.showTimeoutDialog()).toBeFalse();
  });

  it('should open session dialog manually when active', () => {
    service.tokenExpiryMs.set(Date.now() + 600000);
    service.nowMs.set(Date.now());
    service.openSessionDialog();

    expect(service.showTimeoutDialog()).toBeTrue();
    expect(service.timeoutDialogType()).toBe('warning');
    expect(service.timeoutDialogMessage()).toContain('expires in');
  });
});
