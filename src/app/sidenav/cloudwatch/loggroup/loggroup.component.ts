import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CloudWatchService } from '../../../services/cloudwatch.service';

import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { OutputLogEvent, ResourceNotFoundException } from '@aws-sdk/client-cloudwatch-logs';
import { CommonSidenavComponent } from '../../common.component';
import { awsomeConfig } from '../../../config/configuration';

@Component({
  selector: 'app-loggroup',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatTableModule, 
    MatExpansionModule,
    FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatButtonModule ],
  templateUrl: './loggroup.component.html',
  styleUrl: './loggroup.component.scss'
})
export class LogGroupComponent extends CommonSidenavComponent implements OnInit, AfterViewInit {
  @ViewChild('logFilter') logFilter!: ElementRef<HTMLInputElement>;

  dataSource = new MatTableDataSource<OutputLogEvent>([]); 
  prevToken: string | undefined = undefined;
  nextToken: string | undefined = undefined;

  logGroupName: string = '';
  logStreamName: string = '';
  logStreams: string[] = [];
  searchQuery: string = '';
  intervalId: any = null;
  isPaused = false;

  displayedColumns: string[] = ['timestamp', 'message'];

  constructor(
    private route: ActivatedRoute, 
    private router: Router,  
    private cloudWatch: CloudWatchService
  ) {
    super();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.logFilter.nativeElement.focus(), 0); // set focus on log filter
  }

  ngOnInit() {
    this.route.paramMap.subscribe(async (params) => {
      this.logGroupName = params.get('name') ?? '';

      if (this.logGroupName) {
        await this.loadLogStreams();
      }
    });

    this.dataSource.filterPredicate = (event: any, filter: string) =>
      event.message.toLowerCase().includes(filter.trim().toLowerCase());

    this.intervalId = setInterval(() => this.fetchLogEvents(), awsomeConfig.refreshPeriod);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  togglePause($event: MouseEvent) {
    $event.stopPropagation();
    this.isPaused = !this.isPaused;
  }

  async loadLogStreams() {
    try {
      this.logStreams = await this.cloudWatch.getLogStreams(this.logGroupName);
      if (this.logStreams.length > 0) {
        this.logStreamName = this.logStreams[0];
        await this.fetchLogEvents();
      }
    } 
    catch (error) {
      this.showErrorOnSnackBar(error);

      if (error instanceof ResourceNotFoundException) {
        console.error("LogGroupComponent::loadLogStreams, log group not found: ", this.logGroupName);

        this.router.navigate(['../'], { relativeTo: this.route });
        return;
      }
    }
  }

  async fetchLogEventsWithToken($event: MouseEvent, isPrevious: boolean) {
    $event.stopPropagation();
    if (!this.isPaused) return;

    const params = {
      logGroupName: this.logGroupName,
      logStreamName: this.logStreamName,
      nextToken: isPrevious ? this.prevToken : this.nextToken,
      startFromHead: isPrevious,
    }

    try {
      const response = await this.cloudWatch.getLogEvents(params);
      this.prevToken = response.nextBackwardToken;
      this.nextToken = response.nextForwardToken;

      this.dataSource.data = response.events || [];
      this.applyFilter(); 
    }
    catch (error) {
      this.showErrorOnSnackBar(error);

      if (error instanceof ResourceNotFoundException) {
        console.error("LogGroupComponent::fetchLogEvents, log group not found: ", this.logGroupName);

        this.router.navigate(['../'], { relativeTo: this.route });
        return;
      }
    }

  }

  async fetchLogEvents() {
    if (this.isPaused) return;
    if (!this.logStreamName) return;

    try {
      const response = await this.cloudWatch.getLogEvents({logGroupName: this.logGroupName, logStreamName: this.logStreamName});
      this.prevToken = response.nextBackwardToken;
      this.nextToken = response.nextForwardToken;

      this.dataSource.data = response.events || [];
      this.applyFilter(); 
    }
    catch (error) {
      this.showErrorOnSnackBar(error);

      if (error instanceof ResourceNotFoundException) {
        console.error("LogGroupComponent::fetchLogEvents, log group not found: ", this.logGroupName);

        this.router.navigate(['../'], { relativeTo: this.route });
        return;
      }
    }
  }

  applyFilter() {
    this.dataSource.filter = this.searchQuery.trim().toLowerCase();
  }
}
