import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';  // Lisää tämä import

import {MatToolbarModule} from '@angular/material/toolbar'
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import { OidcSecurityService } from 'angular-auth-oidc-client';
import { CookieService } from 'ngx-cookie-service';

import { MatDialog } from '@angular/material/dialog';
import { AssumeRoleComponent } from './assume-role/assume-role.component';
import { CredentialService } from '../services/credential.service';

import { awsomeConfig, cognitoConfig } from '../config/configuration'

@Component({
  selector: 'app-toolbar',
  imports: [
    MatToolbarModule,
    MatMenuModule, MatButtonModule,
    CommonModule, MatDividerModule,
    MatIconModule
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  providers: [CookieService]
})

export class ToolbarComponent {
  @Input() oidcService!: OidcSecurityService;

  switchRoleEnabled = awsomeConfig.allowSwitchRole;

  constructor(private credentialService: CredentialService, 
    private dialog: MatDialog, private router: Router, private cookieService: CookieService) {} 
  
  userData: any;
  isAuthenticated = false;
  email: string | null = cognitoConfig.name;  // Name of the user shown in right side of toolbar
  selectedAccount: string | null = null;      // Shown in left side of toolbar

  savedAccounts: any[] = [];  // Accounts, that are on user brwoser storage

  ngOnInit() {
    console.log('ToolbarComponent::ngOnInit()');
    this.loadSavedAccounts();

    this.oidcService.isAuthenticated$.subscribe(({ isAuthenticated }) => {
      this.isAuthenticated = isAuthenticated;
      if (isAuthenticated) {
        if (this.selectedAccount == null) {
          this.selectedAccount = cognitoConfig.name;
        }
      }
      else {
        this.selectedAccount = null;
      }
    });

    this.oidcService.userData$.subscribe((userData) => {
      this.userData = userData;
      this.email = userData?.userData?.email || null;
    });    
  }


  // Method to navigate to the home route
  navigateHome() {
    this.router.navigate(['/']);
  }  

  login() {
    console.log('ToolbarComponent::login()');
    this.oidcService.authorize();
  }

  logout() {
    console.log('ToolbarComponent::logout()');

    if (window.sessionStorage) {
      window.sessionStorage.clear();
    }

    let currentUrl = window.location.origin;
    window.location.href = `${cognitoConfig.domain}/logout?client_id=${cognitoConfig.userPoolClientId}&logout_uri=${currentUrl}`; 
  }

  switchBack() {
    console.log('ToolbarComponent::switchBack()');
    this.credentialService.reset();
    this.selectedAccount = cognitoConfig.name;
  }
    

  /**
   * Called from HTML with predefined accounts
   * 
   * @param displayName
   * @param accountId 
   * @param roleName 
   * @param region 
   */
  assumeRole(displayName: string, accountId: number, roleName: string, region: string = cognitoConfig.region): void {
    this.selectedAccount = displayName;

    try {
      this.credentialService.assumeRole(`arn:aws:iam::${accountId}:role/${roleName}`, `${roleName}@${accountId}`, region);
      this.addSavedAccount(displayName, accountId, roleName, region);
    }
    catch (error) {
      console.error(error);
    }
  }

  /**
   * Opens an Assume role dialog
   */
  openAssumeRoleDialog(): void {
    this.dialog.open(AssumeRoleComponent, {
      width: '400px',
      data: { },
    });
  }  


  addSavedAccount(displayName: string, accountId: number, roleName: string, region: string) {
    console.log(`ToolbarComponent::addSavedAccount(${displayName}, ${accountId}, ${roleName}, ${region})`);

    if (this.savedAccounts.some(acc => acc.accountId === accountId && acc.role === roleName)) {
        return;
    }

    this.savedAccounts = [...this.savedAccounts, { name: displayName, accountId, role: roleName, region }];
    this.cookieService.set('accounts', JSON.stringify(this.savedAccounts), 365, '/'); // 365 päivää
  }


  /**
   * Gets accounts that can be shown directly on switch account menu
   * @returns 
   */
  loadSavedAccounts() {
    let cookieData = this.cookieService.get('accounts');
    let accounts = cookieData ? JSON.parse(cookieData) : [];    

    if (accounts.length != 0) {
      this.savedAccounts = accounts;
    }
  }

  /**
   * Remove a previously saved account
   * @param accountId 
   */
  removeSavedAccount(accountId: number) {
    const updatedAccounts = this.savedAccounts.filter((account: any) => account.accountId !== accountId);
    this.savedAccounts = updatedAccounts;

    this.cookieService.set('accounts', JSON.stringify(updatedAccounts), 365, '/'); // 365 days
  }

}

