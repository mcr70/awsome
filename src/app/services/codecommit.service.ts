/**
 * 
 * Provides methods for https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/codecommit/
 * 
 */
import { Injectable } from '@angular/core';
import { CodeCommit, CodeCommitClient, ListRepositoriesCommand, ListRepositoriesCommandOutput } from '@aws-sdk/client-codecommit';

import { filter, firstValueFrom } from 'rxjs';

import { CredentialModel, CredentialService } from './credential.service';


@Injectable({
  providedIn: 'root'
})
export class CodecommitService {

  constructor(private credentialService: CredentialService) {}
  
  /**
   * Lists CodeCommit repositories
   * @returns 
   */
  //@Cache(ccRepositoryCache, {ttl: 60})
  async listCodecommitRepositories(): Promise<string[]> {
    console.log('CodecommitService::listCodecommitRepositories()');

    const cc = await this.getClient();

    let repositories: string[] = [];
    let nextToken: string | undefined;

    do {
      const response = await cc.listRepositories({
        nextToken: nextToken
      });

      if (response.repositories) {
        repositories = repositories.concat(response.repositories.map(repo => repo.repositoryName).filter((name): name is string => name !== undefined));
      }

      nextToken = response.nextToken;

    } while (nextToken); 

    return repositories;
  }


  /**
   * Gets a CodeCommitClient and throws an Error is credentials are missing.
   * @returns 
   */
  private async getClient(): Promise<CodeCommit> {
    const credentials = await firstValueFrom(
      this.credentialService.credentials$.pipe(
        filter((cred): cred is CredentialModel => cred !== null)
      )
    );
    
    if (!credentials?.AccessKeyId || !credentials?.SecretAccessKey || !credentials?.SessionToken) {
      throw new Error('AWS Credentials are missing or invalid');
    }

    const client = new CodeCommit({
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
