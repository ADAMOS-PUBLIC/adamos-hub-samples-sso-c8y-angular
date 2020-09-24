import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, from } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { catchError, finalize, switchMap, filter, take } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private refreshTokenInProgress = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(public authService: AuthService) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    request = this.addAuthenticationToken(request);

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (this.isUnauthorizedResponse(error) && this.isLoggedInWithOAuth()) {
          if (request.url.startsWith('/service')) {
            // 401 errors are most likely going to be because we have an expired token that we need to refresh.
            if (this.refreshTokenInProgress) {
              // If refreshTokenInProgress is true, we will wait until refreshTokenSubject has a non-null value
              // which means the new token is ready and we can retry the request again
              return this.refreshTokenSubject.pipe(
                filter(result => result !== null),
                take(1),
                switchMap(() => next.handle(this.addAuthenticationToken(request)))
              );
            } else {
              this.refreshTokenInProgress = true;

              // Set the refreshTokenSubject to null so that subsequent API calls will wait until the new token has been retrieved
              this.refreshTokenSubject.next(null);

              return this.refreshAccessToken().pipe(
                switchMap((success: boolean) => {
                  this.refreshTokenSubject.next(success);
                  return next.handle(this.addAuthenticationToken(request));
                }),
                finalize(() => this.refreshTokenInProgress = false)
              );
            }
          } else {
            this.authService.handleSessionExpired(request, error);
            return throwError(error);
          }
        } else {
          return throwError(error);
        }
      }));
  }

  private isUnauthorizedResponse(error: HttpErrorResponse): boolean {
    return error && error.status === 401;
  }

  private isLoggedInWithOAuth(): boolean {
    return this.authService.isLoggedIn && this.authService.authenticationType === 'OAUTH2';
  }

  private refreshAccessToken(): Observable<any> {
    return from(this.authService.client.user.current());
  }

  private addAuthenticationToken(request: HttpRequest<any>): HttpRequest<any> {
    const authType = this.authService.authenticationType;
    if (authType === 'OAUTH2') {
      const oauthToken = this.authService.getXSRFToken();
      if (oauthToken != null) {
        request = request.clone({
          setHeaders: {
            'X-XSRF-TOKEN': oauthToken,
            UseXBasic: 'true'
          }
        });
      }
    } else if (authType === 'BASIC') {
      const base64Data = this.authService.basic;
      if (base64Data !== null) {
        request = request.clone({
          setHeaders: {
            Authorization: base64Data,
            UseXBasic: 'true'
          }
        });
      }
    }
    return request;
  }
}