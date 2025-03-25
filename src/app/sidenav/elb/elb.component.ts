import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';

import { Subscription } from 'rxjs';

import { LoadBalancer } from '@aws-sdk/client-elastic-load-balancing-v2';

import { ElbService } from '../../services/elb.service';
import { CredentialService } from '../../services/credential.service';
import { CommonSidenavComponent } from '../common.component';

@Component({
  selector: 'app-elb',
  imports: [ MatTableModule, CommonModule, RouterModule ],
  templateUrl: './elb.component.html',
  styleUrl: './elb.component.scss'
})
export class ElbComponent extends CommonSidenavComponent implements OnInit, OnDestroy {
  private credentialsSubscription?: Subscription;
  loadbalancers: LoadBalancer[] = [];


  constructor(private elb: ElbService, private credentialService: CredentialService) {
    super();
  }

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

}
