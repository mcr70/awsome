import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';  

import { CodecommitService } from '../../services/codecommit.service';
import { CredentialService } from '../../services/credential.service';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-codecommit',
  templateUrl: './codecommit.component.html',
  styleUrl: './codecommit.component.scss',
  imports: [
    CommonModule, 
    MatTableModule
  ], 
})
export class CodecommitComponent implements OnInit, OnDestroy {
  private credentialsSubscription?: Subscription;
  private _snackBar = inject(MatSnackBar);

  constructor(private cc: CodecommitService, private credentialService: CredentialService) {}
  
  repositories: string[] = [];

  async ngOnInit() {
    this.credentialsSubscription = this.credentialService.credentials$.subscribe(async (credentials) => {
      await this.listCodecommitRepositories();
    });
  }

  ngOnDestroy(): void { // Unsubscribe to prevenet memory leaks
    this.credentialsSubscription?.unsubscribe();
  }

  /**
   * Lists CodeCommit repositories
   */
  async listCodecommitRepositories() {
    try {
      this.repositories = await this.cc.listCodecommitRepositories(); 
    } 
    catch (error: unknown) {
      console.error('Failed to list CodeCommit repositories', error);
      this.showErrorOnSnackBar(error);
    }
  }

  /**
   * Opens a snackbar with given error and duration
   * @param error 
   * @param dur 
   */
  private showErrorOnSnackBar(error: unknown, dur: number = 5000) {
    if (error instanceof Error) {
      this.showSnackBar(error.message);
    } else {
      this.showSnackBar('Unknown error occurred');
    }
  }


  private showSnackBar(message: string, dur: number = 5000) {
    this._snackBar.open(message, 'Close', { duration: dur });
  }
}
