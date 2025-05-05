import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { CloudWatchService } from '../../../services/cloudwatch.service';
import { MetricChartComponent } from "../../metric-chart/metric-chart.component";

@Component({
  selector: 'app-monitoring',
  imports: [MetricChartComponent, CommonModule, MatTabsModule],
  templateUrl: './monitoring.component.html',
  styleUrl: './monitoring.component.scss'
})
export class MonitoringComponent {
  constructor(
    public dialogRef: MatDialogRef<MonitoringComponent>,
    private cloudWatch: CloudWatchService,
    @Inject(MAT_DIALOG_DATA) public data: { elbName: string }
  ) {
    console.log('MonitoringComponent::constructor() - data:', data);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  arnToName(arn: string | undefined): string {
    if (!arn) return '';
    return arn.split('loadbalancer/').pop() || '';
  }  
}
