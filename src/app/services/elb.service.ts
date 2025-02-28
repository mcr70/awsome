/**
 * 
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/elastic-load-balancing-v2/
 * 
 */
import { Injectable } from '@angular/core';
import { ElasticLoadBalancingV2, ElasticLoadBalancingV2Client, LoadBalancer } from '@aws-sdk/client-elastic-load-balancing-v2';

import { filter, firstValueFrom } from 'rxjs';

import { CredentialModel, CredentialService } from './credential.service';


@Injectable({
  providedIn: 'root'
})
export class ElbService {

  constructor(private credentialService: CredentialService) {}

  async describeLoadbalancers(): Promise<LoadBalancer[]> {
    console.log('ElbService::describeLoadbalancers()');

    const elb = await this.getClient();

    let result = await elb.describeLoadBalancers({
      PageSize: 20
    });

    return result.LoadBalancers ?? [];
  }

  /**
   * Gets a ElasticLoadBalancingV2Client and throws an Error is credentials are missing.
   * @returns 
   */
  private async getClient(): Promise<ElasticLoadBalancingV2> {
    const credentials = await firstValueFrom(
      this.credentialService.credentials$.pipe(
        filter((cred): cred is CredentialModel => cred !== null)
      )
    );
    
    if (!credentials?.AccessKeyId || !credentials?.SecretAccessKey || !credentials?.SessionToken) {
      throw new Error('AWS Credentials are missing or invalid');
    }

    const client = new ElasticLoadBalancingV2({
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
