import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonSidenavComponent } from '../common.component';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';


import { CommonModule } from '@angular/common';

import { interval, Subscription } from 'rxjs';
import { DBInstance } from '@aws-sdk/client-rds';

import { CredentialService } from '../../services/credential.service';
import { RdsService } from '../../services/rds.service';
import { awsomeConfig } from '../../config/configuration';

@Component({
  selector: 'app-rds',
  imports: [ CommonModule, MatExpansionModule, MatTableModule, MatCheckboxModule, 
    MatIconModule, MatButtonModule, MatTooltipModule, MatProgressSpinnerModule ],
  templateUrl: './rds.component.html',
  styleUrl: './rds.component.scss',
})
export class RdsComponent extends CommonSidenavComponent implements OnInit, OnDestroy {
  private credentialsSubscription?: Subscription;
  private pollingSub?: Subscription; 
 
  dbInstances: DBInstance[] = [];
  displayedColumns: string[] = ['select', 'name', 'class', 'engine', 'storage', 'status'];
  selectedInstances = new Set<string>();

  constructor(private rds: RdsService, private credentialService: CredentialService) {
    super();
  }

  ngOnInit(): void {
    this.credentialsSubscription = this.credentialService.credentials$.subscribe(async (credentials) => {
      await this.listRdsInstances();
    });
  }

  ngOnDestroy(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = undefined;
    this.credentialsSubscription?.unsubscribe();
  }

  listRdsInstances() {
    this.rds.listDBInstances().then((instances) => {
      this.dbInstances = instances? instances : [];

      if (this.hasPendingInstances()) {
        // Start polling if there are pending instances
        if (!this.pollingSub) {
          this.startPolling();
        }
      } else {
        // Stop polling if there are no pending instances. This implies, that user needs to
        // refresh the page to see the changes after polling is stopped.
        this.stopPolling()
      }      
    }).catch((error) => {
      this.showErrorOnSnackBar(error);
    });
  }

  startPolling() {
    this.pollingSub = interval(awsomeConfig.refreshPeriod).subscribe(() => this.listRdsInstances());
  }
  stopPolling() {
    this.pollingSub?.unsubscribe();
    this.pollingSub = undefined;
  } 

  // -----  Spinner related methods ----------------------
  hasPendingInstances(): boolean {
    return this.dbInstances.some(db =>
      db.DBInstanceStatus !== 'available' && db.DBInstanceStatus !== 'stopped'
    );
  }


  // -----  Instance control methods  ---------------------------
  hasSelection(): boolean {
    return this.selectedInstances.size > 0;
  }
  
  startSelectedInstances() {
    const startPromises = Array.from(this.selectedInstances).map(instanceId =>
      this.rds.startDBInstance(instanceId)
        .catch(error => {
          this.showErrorOnSnackBar(error);
        })
    );
  
    Promise.all(startPromises).then(() => {
      this.listRdsInstances();  // Käynnistää pollingin tarvittaessa
    });
  }
  
  stopSelectedInstances() {
    const stopPromises = Array.from(this.selectedInstances).map(instanceId =>
      this.rds.stopDBInstance(instanceId)
        .catch(error => {
          this.showErrorOnSnackBar(error);
        })
    );
  
    Promise.all(stopPromises).then(() => {
      this.listRdsInstances(); 
    });
  }


  // -----  Instance selection methods -----------------------------

  getInstanceId(db: DBInstance): string {

    return db.DBInstanceIdentifier!;
  }

  isSelected(db: DBInstance): boolean {
    return this.selectedInstances.has(this.getInstanceId(db));
  }

  toggle(db: DBInstance): void {
    const id = this.getInstanceId(db);
    if (this.selectedInstances.has(id)) {
      this.selectedInstances.delete(id);
    } else {
      this.selectedInstances.add(id);
    }
  }

  isAllSelected(): boolean {
    return this.selectedInstances.size === this.dbInstances.length;
  }

  isIndeterminate(): boolean {
    return this.selectedInstances.size > 0 && !this.isAllSelected();
  }

  toggleAll(checked: boolean): void {
    this.selectedInstances.clear();
    if (checked) {
      this.dbInstances.forEach(db => this.selectedInstances.add(this.getInstanceId(db)));
    }
  }
  // ---------------------------------------------------------------

}
