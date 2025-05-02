/**
 * 
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/cloudwatch-logs/
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/cloudwatch/
 * 
 */
import { Injectable } from '@angular/core';
import { CloudWatch, StandardUnit } from "@aws-sdk/client-cloudwatch";
import { CloudWatchLogs, DescribeLogStreamsCommand, GetLogEventsResponse, LogGroup, OrderBy } from '@aws-sdk/client-cloudwatch-logs';

import { CredentialModel, CredentialService } from './credential.service';
import { filter, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CloudWatchService {

  constructor(private credentialService: CredentialService) {}

  /**
   * List all the Log groups
   * @returns 
   */
  async listLogGroups(namePattern: string | undefined = undefined): Promise<LogGroup[]> {
    console.log("CloudWatchService::listLogGroups");
    
    const client = await this.getClient();
    let logGroups: LogGroup[] = [];
    let nextToken: string | undefined;

    do {
      const response = await client.describeLogGroups({ nextToken });
      logGroups = logGroups.concat(response.logGroups || []);
      nextToken = response.nextToken;
    } while (nextToken);

    return logGroups;
  }


  async getLogStreams(logGroupName: string): Promise<string[]> {
    console.log(`CloudWatchService::getLogStreams(${logGroupName})`);

    const client = await this.getClient();
    
    const params = { 
      logGroupName, 
      orderBy: OrderBy.LastEventTime, 
      descending: true,
      limit: 10 };  
    const command = new DescribeLogStreamsCommand(params);

    const response = await client.send(command);
    return response.logStreams?.map(stream => stream.logStreamName ?? '') ?? [];
  }

  
  async getLogEvents(params: { 
    logGroupName: string; logStreamName: string; // These are mandatory
    limit?: number; startFromHead?: boolean; nextToken?: string; // Optional
  }): Promise<GetLogEventsResponse> {
    console.log(`CloudWatchService::getLogEvents(${JSON.stringify(params)})`);

    const client = await this.getClient();
    
    const queryParams = {
      ...params,
      limit: params.limit ?? 100,
      startFromHead: params.startFromHead ?? false,
    };

    let response = await client.getLogEvents(queryParams);

    // For some reason, on some older streams, first query results in no events
    if (!response.events?.length && response.nextBackwardToken) {
      response = await client.getLogEvents({
        ...params,
        nextToken: response.nextBackwardToken, // Fetch next page
      });
    }

    return response;
  }


  /**
   * Gets the metric statistics for a given namespace and metric name.
   * 
   * @param params 
   * @returns 
   */
  async getMetricStatistics(params: {
    namespace: string;
    metricName: string;
    dimensions?: { Name: string; Value: string }[];
    startTime?: Date;
    endTime?: Date;
    period?: number;
    statistics?: ('Average' | 'Sum' | 'Minimum' | 'Maximum' | 'SampleCount')[];
    unit?: StandardUnit | undefined;
  }) {
    console.log(`CloudWatchService::getMetricStatistics(${JSON.stringify(params)})`);

    const client = await this.getCloudWatchClient();

    let response = await client.getMetricStatistics({
      Namespace: params.namespace,
      MetricName: params.metricName,
      Dimensions: params.dimensions,
      StartTime: params.startTime || new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      EndTime: params.endTime || new Date(),
      Period: params.period || 60,
      Statistics: params.statistics || ['Average'],
      Unit: params.unit,
    })
    
    console.log("CloudWatchService::getMetricStatistics - response: ", response);

    return response;
  }


  /**
   * Gets a CloudWatchLogs and throws an Error is credentials are missing.
   * @returns 
   */
  private async getClient(): Promise<CloudWatchLogs> {
    const credentials = await firstValueFrom(
      this.credentialService.credentials$.pipe(
        filter((cred): cred is CredentialModel => cred !== null)
      )
    );
    
    if (!credentials?.AccessKeyId || !credentials?.SecretAccessKey || !credentials?.SessionToken) {
      throw new Error('AWS Credentials are missing or invalid');
    }

    const client = new CloudWatchLogs({
      region: credentials.Region,
      credentials: {
        accessKeyId: credentials.AccessKeyId as string,
        secretAccessKey: credentials.SecretAccessKey as string,
        sessionToken: credentials.SessionToken as string
      }
    });

    return client;
  }  


  /**
   * Gets a CloudWatch and throws an Error is credentials are missing.
   * NOTE: That this is not the same as CloudWatchLogs
   * @returns 
   */
  private async getCloudWatchClient(): Promise<CloudWatch> {
    const credentials = await firstValueFrom(
      this.credentialService.credentials$.pipe(
        filter((cred): cred is CredentialModel => cred !== null)
      )
    );
    
    if (!credentials?.AccessKeyId || !credentials?.SecretAccessKey || !credentials?.SessionToken) {
      throw new Error('AWS Credentials are missing or invalid');
    }

    const client = new CloudWatch({
      region: credentials.Region,
      credentials: {
        accessKeyId: credentials.AccessKeyId as string,
        secretAccessKey: credentials.SecretAccessKey as string,
        sessionToken: credentials.SessionToken as string
      }
    });

    return client;
  }   

}
