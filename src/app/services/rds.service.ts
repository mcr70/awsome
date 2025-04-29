/**
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/rds/
 */
import { Injectable } from '@angular/core';
import { RDS } from '@aws-sdk/client-rds';
import { CredentialModel, CredentialService } from './credential.service';
import { filter, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RdsService {

  constructor(private credentialService: CredentialService) {}

  async startDBInstance(instanceIdentifier: string) {
    console.log('RdsService::startDBInstance()');

    const rds = await this.getClient();

    await rds.startDBInstance({
      DBInstanceIdentifier: instanceIdentifier
    });
  }

  async stopDBInstance(instanceIdentifier: string) {
    console.log('RdsService::stopDBInstance()');

    const rds = await this.getClient();

    await rds.stopDBInstance({
      DBInstanceIdentifier: instanceIdentifier
    });
  }


  async listDBInstances() {
    console.log('RdsService::decribeDBInstance()');

    const rds = await this.getClient();

    const result =await rds.describeDBInstances();

    return result.DBInstances;
  }


  async decribeDBInstance(instanceIdentifier: string) {
    console.log('RdsService::decribeDBInstance()');

    const rds = await this.getClient();

    const result =await rds.describeDBInstances({
      DBInstanceIdentifier: instanceIdentifier
    });


    return result.DBInstances;
  }



  private async getClient(): Promise<RDS> {
    const credentials = await firstValueFrom(
      this.credentialService.credentials$.pipe(
        filter((cred): cred is CredentialModel => cred !== null)
      )
    );
    
    if (!credentials?.AccessKeyId || !credentials?.SecretAccessKey || !credentials?.SessionToken) {
      throw new Error('AWS Credentials are missing or invalid');
    }

    const client = new RDS({
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
