import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { DistributionSummary } from '@aws-sdk/client-cloudfront';

import { CloudFrontService } from '../../services/aws/cloudfront.service';
import { CredentialService } from '../../services/aws/credential.service';
import { CommonSidenavComponent } from '../common.component';

@Component({
  selector: 'app-cloudfront',
  imports: [CommonModule],
  templateUrl: './cloudfront.component.html',
  styleUrl: './cloudfront.component.scss'
})
export class CloudfrontComponent extends CommonSidenavComponent implements OnInit, OnDestroy {
  private credentialsSubscription?: Subscription;
  distributions: DistributionSummary[] = [];
  loading = true;

  constructor(
    private cloudFrontService: CloudFrontService,
    private credentialService: CredentialService
  ) {
    super();
  }

  ngOnInit(): void {
    this.credentialsSubscription = this.credentialService.credentials$.subscribe(async (credentials) => {
      if (!credentials) {
        return;
      }

      await this.listDistributions();
    });
  }

  ngOnDestroy(): void {
    this.credentialsSubscription?.unsubscribe();
  }

  async listDistributions(): Promise<void> {
    this.loading = true;

    try {
      this.distributions = await this.cloudFrontService.listDistributions();
    } catch (error: unknown) {
      console.error('Failed to list CloudFront distributions', error);
      this.showErrorOnSnackBar(error);
    } finally {
      this.loading = false;
    }
  }
}
