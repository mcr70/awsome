import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';  
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Subscription } from 'rxjs';

import { LogGroup } from '@aws-sdk/client-cloudwatch-logs';

import { CloudWatchService } from '../../services/cloudwatch.service';
import { CredentialService } from '../../services/credential.service';
import { CommonSidenavComponent } from '../common.component';

@Component({
  selector: 'app-cloud-watch',
  standalone: true,
  templateUrl: './cloudwatch.component.html',
  styleUrls: ['./cloudwatch.component.scss'],
  imports: [CommonModule, MatTableModule, RouterModule, MatFormFieldModule, MatInputModule, FormsModule],
  providers: [DatePipe],
})
export class CloudWatchComponent extends CommonSidenavComponent implements OnInit, OnDestroy {
  private credentialsSubscription?: Subscription;

  displayedColumns: string[] = ['logGroupName', 'retentionInDays', 'storedBytes'];
  logGroups: LogGroup[] = [];
  dataSource = new MatTableDataSource(this.logGroups);

  constructor(private cWatch: CloudWatchService, private credentialService: CredentialService) {
    super();
  }
  
  async ngOnInit() {
    this.dataSource.filterPredicate = (data: LogGroup, filter: string): boolean => {
      return (data.logGroupName ?? '').toLowerCase().includes(filter);
    };

    this.credentialsSubscription = this.credentialService.credentials$.subscribe(async (credentials) => {
      await this.listLogGroups();
    });
  }

  ngOnDestroy(): void { // Unsubscribe to prevenet memory leaks
    this.credentialsSubscription?.unsubscribe();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  async listLogGroups() {
    try {
      this.logGroups = await this.cWatch.listLogGroups();
      this.dataSource.data = this.logGroups; 
  
      this.dataSource.filterPredicate = (data: LogGroup, filter: string): boolean => {
        return (data.logGroupName ?? '').toLowerCase().includes(filter);
      };
    } catch (error: unknown) {
      this.showErrorOnSnackBar(error);
    }
  }
}
