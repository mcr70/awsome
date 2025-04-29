import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonSidenavComponent } from '../common.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { CommonModule } from '@angular/common';

import { Subscription } from 'rxjs';
import { DBInstance } from '@aws-sdk/client-rds';

import { CredentialService } from '../../services/credential.service';
import { RdsService } from '../../services/rds.service';

@Component({
  selector: 'app-rds',
  imports: [ CommonModule, MatExpansionModule],
  templateUrl: './rds.component.html',
  styleUrl: './rds.component.scss',
})
export class RdsComponent extends CommonSidenavComponent implements OnInit, OnDestroy {
  private credentialsSubscription?: Subscription;
  dbInstances: DBInstance[] = [];

  constructor(private rds: RdsService, private credentialService: CredentialService) {
    super();
  }

  ngOnInit(): void {
    this.credentialsSubscription = this.credentialService.credentials$.subscribe(async (credentials) => {      
      await this.listRdsInstances();
    });
  }

  ngOnDestroy(): void {
  }
  

  listRdsInstances() {
    console.log('RdsComponent::listRdsInstances()');
    this.rds.listDBInstances().then((instances) => {
      console.log('RDS Instances:', instances);
      this.dbInstances = instances? instances : [];
    }).catch((error) => {
      this.showErrorOnSnackBar(error);
    });
  }

}
