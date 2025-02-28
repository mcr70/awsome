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
import { ResourceNotFoundException } from '@aws-sdk/client-cloudwatch-logs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-loggroup',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatTableModule, 
    MatExpansionModule,
    FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatButtonModule ],
  templateUrl: './loggroup.component.html',
  styleUrl: './loggroup.component.scss'
})
export class LogGroupComponent implements OnInit, AfterViewInit {
  @ViewChild('logFilter') logFilter!: ElementRef<HTMLInputElement>;

  private _snackBar = inject(MatSnackBar);

  dataSource = new MatTableDataSource<any>([]); // MatTableDataSource käyttöön

  logGroupName: string = '';
  logStreamName: string = '';
  logStreams: string[] = [];
  searchQuery: string = '';
  intervalId: any = null;
  isPaused = false;

  displayedColumns: string[] = ['timestamp', 'message']; // Taulukon sarakkeet

  constructor(
    private route: ActivatedRoute, 
    private router: Router,  
    private cloudWatch: CloudWatchService
  ) {}

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

    this.intervalId = setInterval(() => this.fetchLogEvents(), 10_000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
  }

  async loadLogStreams() {
    try {
      this.logStreams = await this.cloudWatch.getLogStreams(this.logGroupName);
      if (this.logStreams.length > 0) {
        this.logStreamName = this.logStreams[0]; // Valitse ensimmäinen log stream
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

  async fetchLogEvents() {
    if (this.isPaused) return;
    if (!this.logStreamName) return;

    try {
      const events = await this.cloudWatch.getLogEvents(this.logGroupName, this.logStreamName);
      console.log("LogGroupComponent::fetchLogEvents, got " + events.length + " events");

      this.dataSource.data = events; // Päivitä datasource
      this.applyFilter(); // Suodata heti jos hakukentässä on arvo
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
