import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonSidenavComponent } from '../common.component';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';


import { CommonModule } from '@angular/common';

import { Subscription } from 'rxjs';
import { DBInstance } from '@aws-sdk/client-rds';

import { CredentialService } from '../../services/credential.service';
import { RdsService } from '../../services/rds.service';

@Component({
  selector: 'app-rds',
  imports: [ CommonModule, MatExpansionModule, MatTableModule, MatCheckboxModule, 
    MatIconModule, MatButtonModule, MatTooltipModule ],
  templateUrl: './rds.component.html',
  styleUrl: './rds.component.scss',
})
export class RdsComponent extends CommonSidenavComponent implements OnInit, OnDestroy {
  private credentialsSubscription?: Subscription;
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
    this.credentialsSubscription?.unsubscribe();
  }

  listRdsInstances() {
    console.log('RdsComponent::listRdsInstances()');
    this.rds.listDBInstances().then((instances) => {
      this.dbInstances = instances? instances : [];
    }).catch((error) => {
      this.showErrorOnSnackBar(error);
    });
  }


  // -----  Instance control methods  ---------------------------
  hasSelection(): boolean {
    return this.selectedInstances.size > 0;
  }
  
  startSelectedInstances() {
    this.selectedInstances.forEach(instanceId => {
      this.rds.startDBInstance(instanceId).then(() => {
        console.log(`Started instance: ${instanceId}`);
      }).catch(error => {
        this.showErrorOnSnackBar(error);
      });
    });
  }
  
  stopSelectedInstances() {
    this.selectedInstances.forEach(instanceId => {
      this.rds.stopDBInstance(instanceId).then(() => {
        console.log(`Stopped instance: ${instanceId}`);
      }).catch(error => {
        this.showErrorOnSnackBar(error);
      });
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
