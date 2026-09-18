import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import {
  BillingPoint,
  BillingRow,
  BillingService,
  UsageTypeRow
} from '../../services/aws/billing.service';
import { CredentialService } from '../../services/aws/credential.service';
import { CommonSidenavComponent } from '../common.component';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    FormsModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    NgxChartsModule
  ],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss'
})
export class BillingComponent extends CommonSidenavComponent implements OnInit, OnDestroy {
  readonly displayedColumns = ['name', 'cost'];
  readonly detailColumns = ['type', 'cost'];
  readonly months = this.createMonthOptions();

  selectedMonth = this.months[1] ?? this.months[0];
  billingRows: BillingRow[] = [];
  usageRows: UsageTypeRow[] = [];
  accountTrend: BillingPoint[] = [];
  serviceTrend: BillingPoint[] = [];
  selectedService = '';
  totalCost = 0;
  usageTotal = 0;
  loading = false;
  loadingDetails = false;
  loadingTrend = false;
  errorMessage = '';

  private credentialsSubscription?: Subscription;

  constructor(
    private billingService: BillingService,
    private credentialService: CredentialService
  ) {
    super();
  }

  ngOnInit(): void {
    this.credentialsSubscription = this.credentialService.credentials$.subscribe(async (credentials) => {
      if (credentials) {
        await this.loadBilling();
      }
    });
  }

  ngOnDestroy(): void {
    this.credentialsSubscription?.unsubscribe();
  }

  async onMonthChange(): Promise<void> {
    this.clearSelection();
    await this.loadBilling();
  }

  async selectService(row: BillingRow): Promise<void> {
    this.selectedService = row.name;
    this.loadingDetails = true;
    this.loadingTrend = true;
    this.usageRows = [];
    this.serviceTrend = [];

    const period = this.getPeriod(this.selectedMonth);
    try {
      const [usage, trend] = await Promise.all([
        this.billingService.getUsageTypeBreakdown(period.start, period.end, row.name),
        this.billingService.getServiceTrend(this.getTrendMonths(this.selectedMonth), row.name)
      ]);
      this.usageRows = usage.rows;
      this.usageTotal = usage.total;
      this.serviceTrend = trend;
    } catch (error: unknown) {
      this.showErrorOnSnackBar(error);
    } finally {
      this.loadingDetails = false;
      this.loadingTrend = false;
    }
  }

  clearSelection(): void {
    this.selectedService = '';
    this.usageRows = [];
    this.usageTotal = 0;
    this.serviceTrend = [];
  }

  private async loadBilling(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    const period = this.getPeriod(this.selectedMonth);

    try {
      const [summary, trend] = await Promise.all([
        this.billingService.getMonthlyCostByService(period.start, period.end),
        this.billingService.getAccountTotalTrend(this.getTrendMonths(this.selectedMonth))
      ]);
      this.billingRows = summary.rows;
      this.totalCost = summary.total;
      this.accountTrend = trend;
    } catch (error: unknown) {
      this.billingRows = [];
      this.accountTrend = [];
      this.totalCost = 0;
      this.errorMessage = 'Billing data could not be loaded.';
      this.showErrorOnSnackBar(error);
    } finally {
      this.loading = false;
    }
  }

  private getPeriod(month: string): { start: string; end: string } {
    const [year, monthNumber] = month.split('-').map(Number);
    return {
      start: `${month}-01`,
      end: this.formatDate(new Date(Date.UTC(year, monthNumber, 1)))
    };
  }

  private getTrendMonths(selectedMonth: string): string[] {
    const [year, month] = selectedMonth.split('-').map(Number);
    return Array.from({ length: 5 }, (_, index) => {
      const date = new Date(Date.UTC(year, month - 1 - index, 1));
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    });
  }

  private createMonthOptions(): string[] {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().substring(0, 10);
  }
}
