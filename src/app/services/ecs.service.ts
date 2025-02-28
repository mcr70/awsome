/**
 * 
 * Provides methods for https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ecs/
 * 
 */
import { Injectable, OnInit } from '@angular/core';
import { Service, ListServicesCommandOutput, ECS } from '@aws-sdk/client-ecs';

import { filter, firstValueFrom, Subject } from 'rxjs';

import { CredentialModel, CredentialService } from './credential.service';


@Injectable({
  providedIn: 'root'
})
export class ECSService implements OnInit {
  private refreshRequired = new Subject<boolean>();

  constructor(private credentialService: CredentialService) {}

  async ngOnInit() {
    this.credentialService.credentials$.subscribe((credentials) => {
      console.log("Received credentials update:", credentials);
    });


    console.log("ECSService::")
  }


  /**
   * List available ECS clusters with currently selected credentials
   * @returns 
   */
  //@Cache(ecsClusterCache, {ttl: 60})
  async listClusters() {
    console.log('ECSService::listClusters()');

    const ecs = await this.getClient()
    const response = await ecs.listClusters({
      maxResults: 100
    });

    return response.clusterArns;
  }

  /**
   * Describe a cluster
   * @param clusterArn 
   * @returns Cluster details of given cluster
   */
  async describeCluster(clusterArn: string) {
    const ecs = await this.getClient()

    const response = await ecs.describeClusters({
      clusters: [clusterArn],
      include: ["SETTINGS", "STATISTICS", "TAGS", "ATTACHMENTS", "CONFIGURATIONS"] 
    });

    return response.clusters?.[0];
  }

  /**
   * Describe a Taskdefinition
   * @param taskDefinitionArn 
   * @returns TaskDefinition
   */
  async describeTaskDefinition(taskDefinitionArn: string) {
    const ecs = await this.getClient()

    const response = await ecs.describeTaskDefinition({
      taskDefinition: taskDefinitionArn,
      //include: ["TAGS"] 
    });

    return response.taskDefinition
  }


  /**
   * Gets services of given cluster.
   * 
   * @param clusterArn ARN Of the cluster
   * @returns 
   */
  async getServices(clusterArn: string): Promise<Service[]> {
    console.log(`ECSService::getServices(${clusterArn})`);
    console.time('getServices');

    const ecs = await this.getClient();
    let serviceArns: string[] = [];
    let nextToken: string | undefined = undefined;

    do {
      const response: ListServicesCommandOutput = await ecs.listServices({
        cluster: clusterArn,
        nextToken: nextToken,
        maxResults: 50        
      });
      
      if (response.serviceArns) {
        serviceArns = serviceArns.concat(response.serviceArns);
      }

      nextToken = response.nextToken;
    } while (nextToken);     

    // We need to fetch all of the services (unless we start paging)
    // so that we can display proper data in UI.
    //
    // We could cache Service objects based on their ARN when
    // they are fetched. This would optimize the UI significantly
    // if we need to click them one by one in short period of time.

    // Split serviceArns into chunks of 10 then fetch each chunk in parallel
    const chunkSize = 10;
    const promises = [];
  
    for (let i = 0; i < serviceArns.length; i += chunkSize) {
      const chunk = serviceArns.slice(i, i + chunkSize);
  
      // Create new promise and send a chunk for retrieval
      promises.push(
        ecs.describeServices({
          cluster: clusterArn,
          services: chunk  
        })
      );
    }
  
    // Wait until all the promises have finished
    const chunkedServices = await Promise.all(promises);
  
    // Combine all the results
    const services = chunkedServices.flatMap((output) => output.services || []);
    console.timeEnd('getServices');

    return services;
  }
  
  /**
   * Gets ECSClient, that can used with ECS related commands
   * @returns 
   */
  private async getClient(): Promise<ECS> {
    const credentials = await firstValueFrom(
      this.credentialService.credentials$.pipe(
        filter((cred): cred is CredentialModel => cred !== null) // Suodatetaan null-arvot pois
      )
    );
    
    if (!credentials?.AccessKeyId || !credentials?.SecretAccessKey || !credentials?.SessionToken) {
      throw new Error('AWS Credentials are missing or invalid');
    }

    const ecsClient = new ECS({
      region: credentials.Region,
      credentials: {
        accessKeyId: credentials.AccessKeyId as string,
        secretAccessKey: credentials.SecretAccessKey as string,
        sessionToken: credentials.SessionToken as string
      }
    });

    return ecsClient;
  }
}
