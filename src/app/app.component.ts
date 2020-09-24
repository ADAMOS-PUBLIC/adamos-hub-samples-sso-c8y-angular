import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'adamos-hub-iam-c8y-angular-app';

  name: string;

  user: any;

  constructor(
    public router: Router,
    public authService: AuthService
  ) { }

  ngOnInit() {
    this.init()
  }

  private async init() {
    try {
      this.user = await this.authService.getUser();
      this.name = this.getName();
    } catch (error) {
      console.error('Could not get user. Error: ' + error);
    }
  }

  private getName(): string {
    if (this.user && this.user.firstName && this.user.lastName) {
      return this.user.firstName + ' ' + this.user.lastName;
    } else {
      return '';
    }
  }

  logout() {
    this.authService.performLogout()
  }
}