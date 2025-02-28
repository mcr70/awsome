import { CognitoIdentityClient, GetCredentialsForIdentityCommand, GetIdCommand } from "@aws-sdk/client-cognito-identity";

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { OidcSecurityService } from 'angular-auth-oidc-client';

import { SidenavComponent } from "./sidenav/sidenav.component";
import { ToolbarComponent } from "./toolbar/toolbar.component";
import { CredentialService } from "./services/credential.service";
import { NotLoggedInComponent } from "./not-logged-in/not-logged-in.component";

import { cognitoConfig } from './config/configuration';


@Component({
  selector: 'app-root',
  imports: [
    ToolbarComponent, 
    CommonModule, HttpClientModule,
    SidenavComponent,
    NotLoggedInComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})

export class AppComponent implements OnInit {
  configDone = cognitoConfig.IdentityPoolId !== '' && cognitoConfig.userPoolId !== '' && cognitoConfig.userPoolClientId !== '';

  readonly oidcSecurityService = inject(OidcSecurityService);
  userData$ = this.oidcSecurityService.userData$;
  isAuthenticated = false;
  access_token = '';

  title = 'Awsome';

  constructor(
    private credentialService: CredentialService,
  ) {}  

  async ngOnInit() {
    console.log('AppComponent::ngOnInit()');
    if (this.configDone) { // If the configuration is missing, don't try to authenticate
      try {
        this.oidcSecurityService.checkAuth().subscribe(({ isAuthenticated }) => {
          this.isAuthenticated = isAuthenticated;
          console.log('authenticated: ', isAuthenticated);
          
          if (isAuthenticated) {
            this.credentialService.reset(); 
          }
        });
      } catch (error) {
        console.error('AppComponent::ngOnInit() failed', error);
        this.isAuthenticated = false;
      }
    }
  }
}
