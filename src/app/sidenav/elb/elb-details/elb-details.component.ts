import { Component, OnInit } from '@angular/core';
import { CommonSidenavComponent } from '../../common.component';
import { CommonModule } from '@angular/common';

import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ElbService } from '../../../services/elb.service';
import { Listener, LoadBalancer, Rule, RuleCondition } from '@aws-sdk/client-elastic-load-balancing-v2';
import { CredentialService } from '../../../services/credential.service';
import { Subscription } from 'rxjs';
import { SafeHtmlPipe } from './safeHtml.pipe';


@Component({
  selector: 'app-elb-details',
  imports: [
    CommonModule, MatExpansionModule, MatListModule, MatIconModule, MatButtonModule, MatTableModule, RouterModule,
    SafeHtmlPipe
  ],
  templateUrl: './elb-details.component.html',
  styleUrl: './elb-details.component.scss'
})
export class ElbDetailsComponent extends CommonSidenavComponent implements OnInit {
  constructor(private route: ActivatedRoute, private elbSvc: ElbService, private credentialService: CredentialService) {
    super();
  }

  private credentialsSubscription?: Subscription;

  listeners: Listener[] = [];
  rulesDataSources: { [key: string]: MatTableDataSource<Rule> } = {};
    
  //rulesDataSource = new MatTableDataSource<Rule>([]); 
  elbDetails: { key: string; value: string }[] = [];
  elb: LoadBalancer | undefined;

  ngOnInit(): void {
    this.credentialsSubscription = this.credentialService.credentials$.subscribe(async (credentials) => {
      this.listeners = [];
      this.elbDetails = [];
      console.log('ElbDetailsComponent::ngOnInit() - credentials changed');
    });


    this.route.paramMap.subscribe(async (params) => {
      let elbId = params.get('id') ?? '';
      console.log('ElbDetailsComponent::ngOnInit()');

      this.elb = this.elbSvc.findLoadBalancerById(elbId);

      if (this.elb === undefined) {
        this.showSnackBar('Load Balancer not found');
        return;
      }

      this.elbDetails = [
        { key: 'Arn', value: this.elb.LoadBalancerArn || 'Not available' },
        { key: 'DNS Name', value: this.elb.DNSName || 'Not available' },
        { key: 'Type', value: this.elb.Type || 'Not available' },
        { key: 'Scheme', value: this.elb.Scheme || 'Not available' },
        { key: 'VPC', value: this.elb.VpcId || 'Not available' },
        { key: 'Availability Zones', value: this.elb.AvailabilityZones?.map(z => z.ZoneName).join(', ') || 'Not available' },
        { key: 'Subnets', value: this.elb.AvailabilityZones?.map(z => z.SubnetId).join(', ') || 'Not available' },

        { 
          key: 'IP addresses', 
          value: this.elb.AvailabilityZones
            ?.flatMap(z => z.LoadBalancerAddresses?.map(a => a.IpAddress) || [])
            .join(', ') || 'Not available'
        },
      ];

      try {
        this.listeners = await this.elbSvc.getListeners(this.elb.LoadBalancerArn || '');
    
        for (let listener of this.listeners) {
          if (listener.ListenerArn) {
            const rules = await this.elbSvc.getRules(listener.ListenerArn || '');
            this.rulesDataSources[listener.ListenerArn] = new MatTableDataSource(rules);
          }
        }
      } catch (error: unknown) {
        console.error('Failed to get listeners or rules', error);
        this.showErrorOnSnackBar(error);
      }

    });
  }

  ruleConditionToString(rule: Rule): string {
    try {
      let ruleCondition = ''
      for (let condition of rule.Conditions || []) {
        if (ruleCondition !== '') {
          ruleCondition += ' AND ';
        }
        if (condition.Field === 'path-pattern') {
          ruleCondition += `${condition.Values?.join(', ')}`;
        }
        else if (condition.Field === 'host-header') {
          ruleCondition += `Host: ${condition.Values?.join(', ')}`;
        }
        else if (condition.Field === 'http-header') {
          ruleCondition += `Header: ${condition.HttpHeaderConfig?.Values?.join(', ')}`
        }
        else if (condition.Field === 'query-string') {
          ruleCondition += `Query: ${condition.QueryStringConfig?.Values?.join(', ')}`
        }
        else if (condition.Field === 'source-ip') {
          ruleCondition += `Source IP: ${condition.SourceIpConfig?.Values?.join(', ')}`
        }
        else if (condition.Field === 'http-request-method') {
          ruleCondition += `Method: ${condition.HttpRequestMethodConfig?.Values?.join(', ')}`
        }
        else {
          ruleCondition += `Unknown field: ${condition.Field}`;
        }
      }
      return ruleCondition;
    }
    catch (error: unknown) {
      console.error('Failed to convert rule condition to string', error);
      this.showErrorOnSnackBar(error);
      return 'Not available';
    }
  }


  ruleActionToString(rule: Rule): string {
    try {
      let ruleAction = ''
      for (let action of rule.Actions || []) {
        if (ruleAction !== '') {
          ruleAction += ' AND ';
        }
        if (action.Type === 'forward') {
          ruleAction += `Forward to: ${action.TargetGroupArn?.split("/")[1] ?? "???"}`;
        }
        else if (action.Type === 'redirect') {        
          ruleAction += `Redirect to: (${action.RedirectConfig?.StatusCode}) ${action.RedirectConfig?.Protocol}://${action.RedirectConfig?.Host}:${action.RedirectConfig?.Port}/${action.RedirectConfig?.Path}?${action.RedirectConfig?.Query}`;
        }
        else if (action.Type === 'fixed-response') {
          ruleAction += `Fixed response: (${action.FixedResponseConfig?.ContentType}) ${action.FixedResponseConfig?.MessageBody}`;
        } 
        else {
          ruleAction += `Unknown action: ${action.Type}`;
        }
      }
      return ruleAction;
    }
    catch (error: unknown) {
      console.error('Failed to convert rule condition to string', error);
      this.showErrorOnSnackBar(error);

      return 'Not available';
    }
  }
}
