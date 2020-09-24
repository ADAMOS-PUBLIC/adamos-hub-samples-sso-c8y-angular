import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Client, CookieAuth, FetchClient, IAuthentication, ICredentials, ICurrentTenant, ICurrentUser, BasicAuth } from '@c8y/client';
import { CookieService } from 'ngx-cookie-service';

export type AuthType = 'OAUTH2' | 'BASIC';

export interface LoginOption {
  type: AuthType;
  initRequest: string | null;
}

export interface OAuthOptions {
  issuer: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  basic: string | null = null;
  CREDENTIALS_STORAGE_KEY = 'App_Creds';

  client: Client | null = null;
  private authentication: IAuthentication | null = null;

  private loginOptions: LoginOption[] = [];
  private oauthOptions: OAuthOptions;

  isLoggedIn = false;
  shouldShowLoginPage = false;

  user: ICurrentUser;
  tenant: ICurrentTenant;

  authenticationType: AuthType | null = null;

  private tenantId: string;

  constructor(
    private cookieService: CookieService,
    public router: Router,
    private route: ActivatedRoute) { }

  /*
      This method should be called when initializing the app.
      It checks if there is already an active session.
      If not shows the login page or redirects to the SSO login page.
  */
  public async getUser(): Promise<ICurrentUser> {
    if (this.isLoggedIn) {
      return this.user;
    }

    let auth = this.getAuth();

    if (!auth) {
      this.loginOptions = await this.fetchLoginOptions();

      if (this.hasSSOParam() && this.supportsOAuth()) {
        this.redirectToOAuthURL(this.getOAuthInfo())
      } else {
        this.shouldShowLoginPage = true;
      }

      return null;
    }

    return await this.tryLogin(auth);
  }

  public getXSRFToken(): string {
    return this.cookieService.get('XSRF-TOKEN');
  }

  private getAuth(): IAuthentication {
    let token = this.getXSRFToken();
    if (token && token.length > 0) {
      return new CookieAuth();
    }
    else {
      let app_creds = sessionStorage.getItem(this.CREDENTIALS_STORAGE_KEY);
      if (app_creds != null) {
        return new BasicAuth(JSON.parse(app_creds) as ICredentials);
      }
    }

    return null;
  }

  private hasSSOParam(): boolean {
    const queryMap = this.route.snapshot.queryParamMap;
    const hasSSOParam = queryMap.get('sso');
    return hasSSOParam && hasSSOParam.toLowerCase() === 'true';
  }

  /*
      Throws an error if the provided IAuthentication is not valid
  */
  private async tryLogin(auth: IAuthentication): Promise<ICurrentUser> {
    const client = new Client(auth);
    const { data } = await client.user.current(); // --> this line could throw an error

    this.client = client;
    this.user = data;
    this.authentication = auth;

    await this.fetchTenantInfo();

    if (auth instanceof CookieAuth) {
      auth.user = data.id; // needs to be set for logout, value seems to be not important
      this.authenticationType = 'OAUTH2';

      this.oauthOptions = await this.fetchOAuthOptions();
    }
    else {
      this.authenticationType = 'BASIC';
    }

    this.isLoggedIn = true;

    return this.user;
  }

  public performOAuthLogin() {
    const oauth = this.getOAuthInfo();
    if (oauth !== null) {
      this.redirectToOAuthURL(oauth);
    }
  }

  /*
      Throws an error if the credentials are not valid.
  */
  public async performBasicAuthLogin(user: string, password: string): Promise<ICurrentUser> {
    const credentials: ICredentials = { user, password };

    let currentUser = await this.tryLogin(new BasicAuth(credentials));

    this.saveBasicAuthSecret(credentials.user, credentials.password, this.tenantId);
    sessionStorage.setItem(this.CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials));

    return currentUser;
  }

  public performLogout() {
    if (this.authentication != null) {
      if (this.authenticationType === 'OAUTH2') {
        this.performSSOLogout();
      } else {
        sessionStorage.removeItem(this.CREDENTIALS_STORAGE_KEY);
        this.authentication.logout();
        window.location.reload();
      }
    }
  }

  private performSSOLogout() {
    const redirectURL = this.oauthOptions.issuer + '/protocol/openid-connect/logout?redirect_uri=' + window.location.href;
    this.authentication.logout().then(() => {
      window.location.href = redirectURL;
      // window.location.reload() --> comment out the upper line & uncomment this line to avoid SSO logout
    });
  }

  public supportsOAuth(): boolean {
    return this.getOAuthInfo() != null;
  }

  public handleSessionExpired(request: HttpRequest<any>, error: HttpErrorResponse) {
    const details = 'Request:\n' + JSON.stringify(request) + '\n' + 'Response:\n' + JSON.stringify(error);
    console.log('Your session has expired! Details: ' + details)
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  private async fetchTenantInfo() {
    const { data } = await this.client.tenant.current();
    this.tenantId = data.name;
  }

  private saveBasicAuthSecret(username: string, password: string, tenant: string) {
    const basicCredentials = tenant + '/' + username + ':' + password;
    this.basic = 'Basic ' + btoa(basicCredentials);
  }

  private async fetchLoginOptions() {
    const client = new FetchClient();
    return client.fetch('/tenant/loginOptions')
      .then(response => {
        if (response.status !== 200) {
          throw new Error();
        }

        return response.json();
      })
      .then(json => {
        const loginOptions: LoginOption[] = json.loginOptions;
        return loginOptions;
      });
  }

  private async fetchOAuthOptions() {
    const client = new FetchClient();
    client.setAuth(this.authentication)
    return client.fetch('/tenant/loginOptions/oauth2')
      .then(response => {
        if (response.status !== 200) {
          throw new Error();
        }

        return response.json();
      })
      .then(json => {
        return json as OAuthOptions;
      });
  }

  private getOAuthInfo() {
    const oauthMatches = this.loginOptions.filter(loginOption => loginOption.type === 'OAUTH2');
    if (oauthMatches.length > 0) {
      const [oauth] = oauthMatches;
      return oauth;
    }

    return null;
  }

  private redirectToOAuthURL(oauth: LoginOption) {
    const url = oauth.initRequest;
    window.location.href = url + '&originUri=' + window.location.href;
  }
}