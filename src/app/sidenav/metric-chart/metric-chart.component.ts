import { Component, Input, OnChanges } from '@angular/core';

import { NgxChartsModule } from '@swimlane/ngx-charts';
import { LegendPosition } from '@swimlane/ngx-charts';

import { CloudWatchService } from '../../services/cloudwatch.service';

@Component({
  selector: 'app-metric-chart',
  imports: [NgxChartsModule],
  templateUrl: './metric-chart.component.html',
  styleUrl: './metric-chart.component.scss'
})
export class MetricChartComponent implements OnChanges {
  @Input() namespace!: string;
  @Input() metricName!: string;
  @Input() dimensions!: { Name: string; Value: string }[];
  @Input() statistic: 'Average' | 'Sum' | 'Minimum' | 'Maximum' = 'Sum';
  @Input() period: number = 60; // seconds
  @Input() durationMinutes: number = 60;

  chartData: any[] = [];
  LegendPosition = LegendPosition;

  constructor(private metricService: CloudWatchService) {}

  ngOnChanges(): void {
    this.loadMetric();
  }

  loadMetric() {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - this.durationMinutes * 60000);

    this.metricService.getMetricStatistics({
      namespace: this.namespace,
      metricName: this.metricName,
      dimensions: this.dimensions,
      period: this.period,
      startTime: startTime,
      endTime: endTime,
      statistics: [this.statistic],
    }).then(result => {

      console.log('MetricChartComponent::loadMetric() - result:', result);
      this.chartData = [{
        name: this.metricName,
        series: (result.Datapoints || []).sort((a, b) => a.Timestamp!.getTime() - b.Timestamp!.getTime())
          .map(dp => ({
            name: dp.Timestamp,
            value: dp[this.statistic]
          }))
      }];
    });
  }
}