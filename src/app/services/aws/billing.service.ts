import { Injectable } from '@angular/core';
import {
  CostExplorerClient,
  Dimension,
  Expression,
  GetCostAndUsageCommand,
  ResultByTime
} from '@aws-sdk/client-cost-explorer';
import { filter, firstValueFrom } from 'rxjs';

import { CredentialModel, CredentialService } from './credential.service';

export interface BillingRow {
  name: string;
  cost: number;
}

export interface BillingSummary {
  rows: BillingRow[];
  total: number;
}

export interface UsageTypeRow {
  type: string;
  cost: number;
}

export interface UsageTypeSummary {
  serviceName: string;
  rows: UsageTypeRow[];
  total: number;
}

export interface BillingPoint {
  name: string;
  value: number;
}

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  constructor(private credentialService: CredentialService) {}

  async getMonthlyCostByService(startDate: string, endDate: string): Promise<BillingSummary> {
    const response = await this.sendCostRequest({
      TimePeriod: { Start: startDate, End: endDate },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost'],
      GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }]
    });

    const rows: BillingRow[] = [];
    let total = 0;

    for (const group of response.ResultsByTime?.[0]?.Groups ?? []) {
      const cost = this.amount(group.Metrics?.['UnblendedCost']?.Amount);
      if (cost > 0.005) {
        rows.push({ name: group.Keys?.[0] ?? 'Unknown service', cost });
        total += cost;
      }
    }

    rows.sort((left, right) => right.cost - left.cost);
    return { rows, total };
  }

  async getAccountTotalTrend(months: string[]): Promise<BillingPoint[]> {
    const response = await this.getTrend(months);
    return this.toTrend(response);
  }

  async getServiceTrend(months: string[], serviceName: string): Promise<BillingPoint[]> {
    const response = await this.getTrend(months, serviceName);
    return this.toTrend(response);
  }

  async getUsageTypeBreakdown(
    startDate: string,
    endDate: string,
    serviceName: string
  ): Promise<UsageTypeSummary> {
    const filterExpression: Expression = {
      Dimensions: {
        Key: Dimension.SERVICE,
        Values: [serviceName]
      }
    };

    const response = await this.sendCostRequest({
      TimePeriod: { Start: startDate, End: endDate },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost'],
      Filter: filterExpression,
      GroupBy: [{ Type: 'DIMENSION', Key: 'USAGE_TYPE' }]
    });

    const rows: UsageTypeRow[] = [];
    let total = 0;

    for (const group of response.ResultsByTime?.[0]?.Groups ?? []) {
      const cost = this.amount(group.Metrics?.['UnblendedCost']?.Amount);
      if (cost > 0.005) {
        rows.push({ type: group.Keys?.[0] ?? 'Unknown usage type', cost });
        total += cost;
      }
    }

    rows.sort((left, right) => right.cost - left.cost);
    return { serviceName, rows, total };
  }

  private async getTrend(months: string[], serviceName?: string): Promise<ResultByTime[]> {
    const sortedMonths = [...months].sort();
    const startDate = `${sortedMonths[0]}-01`;
    const [year, month] = sortedMonths[sortedMonths.length - 1].split('-').map(Number);
    const endDate = this.formatDate(new Date(Date.UTC(year, month, 1)));

    const request: ConstructorParameters<typeof GetCostAndUsageCommand>[0] = {
      TimePeriod: { Start: startDate, End: endDate },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost']
    };

    if (serviceName) {
      request.Filter = {
        Dimensions: {
          Key: Dimension.SERVICE,
          Values: [serviceName]
        }
      };
    }

    const response = await this.sendCostRequest(request);
    return response.ResultsByTime ?? [];
  }

  private toTrend(results: ResultByTime[]): BillingPoint[] {
    return results.map((period: ResultByTime) => ({
      name: period.TimePeriod?.Start?.substring(0, 7) ?? '',
      value: Number(this.amount(period.Total?.['UnblendedCost']?.Amount).toFixed(2))
    }));
  }

  private async sendCostRequest(
    input: ConstructorParameters<typeof GetCostAndUsageCommand>[0]
  ) {
    const client = await this.getClient();
    return client.send(new GetCostAndUsageCommand(input));
  }

  private async getClient(): Promise<CostExplorerClient> {
    const credentials = await firstValueFrom(
      this.credentialService.credentials$.pipe(
        filter((value): value is CredentialModel => value !== null)
      )
    );

    if (!credentials.AccessKeyId || !credentials.SecretAccessKey || !credentials.SessionToken) {
      throw new Error('AWS Credentials are missing or invalid');
    }

    return new CostExplorerClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: credentials.AccessKeyId,
        secretAccessKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken
      }
    });
  }

  private amount(value?: string): number {
    return Number.parseFloat(value ?? '0') || 0;
  }

  private formatDate(date: Date): string {
    return date.toISOString().substring(0, 10);
  }
}
