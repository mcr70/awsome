/**
 * 
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/elastic-load-balancing-v2/
 * 
 */
import { Injectable } from '@angular/core';
import { Certificate, DescribeListenerCertificatesCommand, DescribeListenerCertificatesCommandOutput, DescribeListenersOutput, DescribeRulesOutput, ElasticLoadBalancingV2, ElasticLoadBalancingV2Client, Listener, LoadBalancer, Rule } from '@aws-sdk/client-elastic-load-balancing-v2';

import { filter, firstValueFrom } from 'rxjs';

import { CredentialModel, CredentialService } from './credential.service';


@Injectable({
  providedIn: 'root'
})
export class ElbService {
  private LoadBalancers: LoadBalancer[] = [];

  constructor(private credentialService: CredentialService) {}

  /**
   * Describes all the load balancers.
   * 
   * @returns Promise<LoadBalancer[]>
   */
  async describeLoadbalancers(): Promise<LoadBalancer[]> {
    console.log('ElbService::describeLoadbalancers()');

    const elb = await this.getClient();

    let result = await elb.describeLoadBalancers({
      PageSize: 20 // TODO: Implement pagination
    });

    this.LoadBalancers = result.LoadBalancers ?? []; // Always store the latest result for other calls

    return result.LoadBalancers ?? [];
  }

  /**
   * Gets listeners for a given LoadBalancer.
   * 
   * @param elbArn ARN of the LoadBalancer
   * @param pageSize 
   * @returns Promise<Listener[]>
   */
  async getListeners(elbArn: string, pageSize: number = 20): Promise<Listener[]> {
    console.log(`ElbService::getListeners(${elbArn})`);

    const elb = await this.getClient();

    let listeners: Listener[] = [];
    let nextMarker: string | undefined = undefined;

    do {
      const result: DescribeListenersOutput = await elb.describeListeners({
        LoadBalancerArn: elbArn,
        Marker: nextMarker,
        PageSize: pageSize
      });
    
      if (result.Listeners) {
        listeners = listeners.concat(result.Listeners);
      }
    
      nextMarker = result.NextMarker;
    } while (nextMarker);    

    return listeners;
  }

  /**
   * Gets all the rules for a given LoadBalancer.
   * 
   * @param arn Arn of the LoadBalancer
   * @returns Promise<Rule[]>
   */
  async getRules(arn: string, pageSize: number = 30): Promise<Rule[]> {
    console.log(`ElbService::getRules(${arn})`);

    const elb = await this.getClient();

    let rules: Rule[] = [];
    let nextMarker: string | undefined = undefined;

    do {
      const result: DescribeRulesOutput = await elb.describeRules({
        ListenerArn: arn,
        Marker: nextMarker,
        PageSize: pageSize
      });
    
      if (result.Rules) {
        rules = rules.concat(result.Rules);
      }
    
      nextMarker = result.NextMarker;
    } while (nextMarker);    

    return rules;
  }


  /**
   * Gets all the certificates for a given listener.
   * 
   * @param listenerArn Arn of the listener
   * @param pageSize 
   * @returns Promise<Certificate[]>
   */
  async getListenerCertificates(listenerArn: string, pageSize: number = 10): Promise<Certificate[]> {
    console.log(`ElbService::getListenerCertificates(${listenerArn})`);

    const elb = await this.getClient();

    let certificates: Certificate[] = [];
    let nextMarker: string | undefined = undefined;

    do {
      const result: DescribeListenerCertificatesCommandOutput = await elb.describeListenerCertificates({
        ListenerArn: listenerArn,
        Marker: nextMarker,
        PageSize: pageSize
      });
    
      if (result.Certificates) {
        certificates = certificates.concat(result.Certificates);
      }
    
      nextMarker = result.NextMarker;
    } while (nextMarker);    

    return certificates;
}


  /**
   * Gets all the load balancers. This method uses a cached value if available.
   * If you want to force a refresh, call describeLoadbalancers() first.
   * 
   * @returns LoadBalancer[]
   */
  getLoadBalancers(): LoadBalancer[] {
    if (this.LoadBalancers.length === 0) {
      this.describeLoadbalancers();
    }
  
    return this.LoadBalancers;
  }



  /**
   * Finds a LoadBalancer by its ARN.
   * 
   * @param arn Arn of the Loadbalancer
   * @returns LoadBalancer | undefined
   */
  findLoadBalancerByArn(arn: string): LoadBalancer | undefined {
    return this.LoadBalancers.find((lb) => lb.LoadBalancerArn === arn);
  }

  /**
   * Finds a LoadBalancer by its Id. Id is the last segment of the ARN.
   * 
   * @param   id Id of the LoadBalancer. This is the last segment of the ARN. 
   *          Technically, comparison is made with endsWith() to arn
   * @returns LoadBalancer | undefined
   */
  findLoadBalancerById(id: string): LoadBalancer | undefined {
    console.log(`ElbService::findLoadBalancerById(${id})`);
    return this.getLoadBalancers().find(lb => lb.LoadBalancerArn?.endsWith(id));
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
