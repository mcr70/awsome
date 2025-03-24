import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';

import { Subscription } from 'rxjs';

import { LoadBalancer } from '@aws-sdk/client-elastic-load-balancing-v2';

import { ElbService } from '../../services/elb.service';
import { CredentialService } from '../../services/credential.service';

@Component({
  selector: 'app-elb',
  imports: [ MatTableModule, CommonModule, RouterModule ],
  templateUrl: './elb.component.html',
  styleUrl: './elb.component.scss'
})
export class ElbComponent implements OnInit, OnDestroy {
  private credentialsSubscription?: Subscription;
  private _snackBar = inject(MatSnackBar);
  loadbalancers: LoadBalancer[] = [];


  constructor(private elb: ElbService, private credentialService: CredentialService) {}

  async ngOnInit() {
    this.credentialsSubscription = this.credentialService.credentials$.subscribe(async (credentials) => {
      await this.listLoadbalancers();
    });
  }

  ngOnDestroy(): void { // Unsubscribe to prevenet memory leaks
    this.credentialsSubscription?.unsubscribe();
  }


  async listLoadbalancers() {
    try {
      this.loadbalancers = await this.elb.describeLoadbalancers(); 
    } 
    catch (error: unknown) {
      console.error('Failed to list CodeCommit repositories', error);
      this.showErrorOnSnackBar(error);
    }
  }


  getLoadBalancerShortId(arn: string): string {
    return arn.split('/').pop() ?? '';
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
