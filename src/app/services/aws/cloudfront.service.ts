import { Injectable } from '@angular/core';
import {
  CloudFrontClient,
  DistributionSummary,
  ListDistributionsCommand
} from '@aws-sdk/client-cloudfront';
import { filter, firstValueFrom } from 'rxjs';

import { CredentialModel, CredentialService } from './credential.service';

@Injectable({
  providedIn: 'root'
})
export class CloudFrontService {
  constructor(private credentialService: CredentialService) {}

  async listDistributions(): Promise<DistributionSummary[]> {
    const credentials = await firstValueFrom(
      this.credentialService.credentials$.pipe(
        filter((cred): cred is CredentialModel => cred !== null)
      )
    );

    if (!credentials.AccessKeyId || !credentials.SecretAccessKey || !credentials.SessionToken) {
      throw new Error('AWS Credentials are missing or invalid');
    }

    const client = new CloudFrontClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: credentials.AccessKeyId,
        secretAccessKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken
      }
    });

    const distributions: DistributionSummary[] = [];
    let marker: string | undefined;

    do {
      const response = await client.send(new ListDistributionsCommand({ Marker: marker }));
      distributions.push(...(response.DistributionList?.Items ?? []));
      marker = response.DistributionList?.NextMarker;
    } while (marker);

    return distributions;
  }
}
