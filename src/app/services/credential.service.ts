import { inject, Injectable } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

import { CognitoIdentityClient, GetCredentialsForIdentityCommand, GetIdCommand, Credentials } from '@aws-sdk/client-cognito-identity';
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';

import { cognitoConfig } from '../config/configuration';

export interface CredentialModel {
  AccessKeyId: string;
  SecretAccessKey: string; 
  SessionToken: string;
  Expiration?: Date;
  Region: string
}


@Injectable({
  providedIn: 'root'
})
export class CredentialService {
  private readonly oidcSecurityService = inject(OidcSecurityService);
  private client = new CognitoIdentityClient({ region: cognitoConfig.region });

  // BehaviorSubject has the latest credential and updates the subscribers
  private credentialsSubject = new BehaviorSubject<Credentials | null>(null);
  credentials$: Observable<Credentials | null> = this.credentialsSubject.asObservable();


  /**
   * Assumes role to given targetRoleArn, and returns temporary credentials.
   * 
   * @param targetRoleArn Role ARN which we want to assume
   * @param sessionName Name of the session
   * @returns Temporary credentials to be used for making AWS API calls
   */
  async assumeRole(targetRoleArn: string, sessionName: string, region: string) {
    console.log(`CredentialService::assumeRole(${targetRoleArn}, ${sessionName})`);

    const credentials = await this.getCredentials()

    const stsClient = new STSClient({
        region: cognitoConfig.region,
        credentials: {
            accessKeyId: credentials.AccessKeyId!,
            secretAccessKey: credentials.SecretAccessKey!,
            sessionToken: credentials.SessionToken!,
        }
    });

    const command = new AssumeRoleCommand({
        RoleArn: targetRoleArn,   
        RoleSessionName: sessionName,
        DurationSeconds: 3600 // 1 hour
    });

    console.log("calling stsClient.send");
    const response = await stsClient.send(command);

    if (!response.Credentials) {
        throw new Error("Failed to assume role");
    }

    console.log("Assumed role successfully:", targetRoleArn, region);

    const unifiedCredentials: CredentialModel = {
      AccessKeyId: response.Credentials.AccessKeyId!,
      SecretAccessKey: response.Credentials.SecretAccessKey!,
      SessionToken: response.Credentials.SessionToken!,
      Expiration: response.Credentials.Expiration,
      Region: region
    };

    this.credentialsSubject.next(unifiedCredentials); // Update Observable
  }

  /**
   * Resets credentials to first login state, where credential is the same
   * as in first login to Cognito.
   */
  async reset() {
    const awsomeCredentials = await this.getCredentials();
    this.credentialsSubject.next(awsomeCredentials); // Update Observable
  }

  /**
   * Gets temporary AWS credentials from the OIDC token.
   * 
   * @param retry whether to retry if the token has expired
   * @returns temporary AWS credentials to be used for making AWS API calls
   */
  private async getCredentials(retry: boolean = true): Promise<CredentialModel> {
    console.log(`CredentialService::getCredentials(${retry})`);

    try {
      let id_token = await firstValueFrom(this.oidcSecurityService.getIdToken());

      if (!id_token) {
        throw new Error('id_token missing');
      }

      // get IdentityId
      const identityId = await this.getIdentityId(id_token);

      // get temporary AWS credentials
      const credentials = await this.getAwsCredentials(identityId, id_token);

      const awsomeCredentials: CredentialModel = {
        AccessKeyId: credentials.AccessKeyId!,
        SecretAccessKey: credentials.SecretKey!,
        SessionToken: credentials.SessionToken!,
        Expiration: credentials.Expiration,
        Region: cognitoConfig.region
      };

      
      return awsomeCredentials;
    } catch (error: any) {

      if (error.name === 'NotAuthorizedException' && error.message.includes('Token expired') && retry) {
        console.info('Token expired. Refreshing session...');

        await firstValueFrom(this.oidcSecurityService.forceRefreshSession());

        return this.getCredentials(false);
      }

      throw error;
    }
  }

  private async getIdentityId(id_token: string): Promise<string> {
    const command = new GetIdCommand({
      IdentityPoolId: cognitoConfig.IdentityPoolId,
      Logins: {
        [cognitoConfig.idpIdentifier]: id_token
      }
    });

    const response = await this.client.send(command);
    if (!response.IdentityId) {
      throw new Error('IdentityId retrieval failed');
    }

    return response.IdentityId;
  }

  private async getAwsCredentials(identityId: string, id_token: string): Promise<Credentials> {
    const command = new GetCredentialsForIdentityCommand({
      IdentityId: identityId,
      Logins: {
        [cognitoConfig.idpIdentifier]: id_token
      }
    });

    const credentialsResponse = await this.client.send(command);
    if (!credentialsResponse.Credentials) {
      throw new Error('Failed to retrieve credentials');
    }

    return credentialsResponse.Credentials;
  }
}
