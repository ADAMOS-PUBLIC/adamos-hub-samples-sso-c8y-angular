import { Component, OnInit } from '@angular/core';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent implements OnInit {

  supportsOAuth = false;

  username = '';
  password = '';

  errorMessage: string;

  constructor(
    private authService: AuthService) { }

  ngOnInit() {
    this.supportsOAuth = this.authService.supportsOAuth();
  }

  onUserDidPressXHubLogin() {
    this.authService.performOAuthLogin();
  }

  onUserDidPressBasicLogin(event) {
    event.preventDefault()
    if (this.username && this.password) {

      this.errorMessage = null;
      this.authService.performBasicAuthLogin(this.username, this.password)
        .then(
          () => { },
          error => {
            this.errorMessage = error && error.data && error.data.message ? error.data.message : 'An error occoured while logging in.';
          }
        );
    }
  }
}
