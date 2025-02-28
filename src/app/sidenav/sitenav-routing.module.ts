import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { authGuard } from '../auth.guard';

import { HomeComponent } from './home/home.component';
import { CodecommitComponent } from './codecommit/codecommit.component';
import { CloudWatchComponent } from './cloudwatch/cloudwatch.component';
import { EcsComponent } from './ecs/ecs.component';
import { ElbComponent } from './elb/elb.component';
import { LogGroupComponent } from './cloudwatch/loggroup/loggroup.component';


export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'codecommit', component: CodecommitComponent, canActivate: [authGuard] },
    { path: 'cloudwatch', component: CloudWatchComponent, canActivate: [authGuard] },
    { path: 'cloudwatch/:name', component: LogGroupComponent, canActivate: [authGuard] },
    { path: 'ecs', component: EcsComponent, canActivate: [authGuard] },
    { path: 'elb', component: ElbComponent, canActivate: [authGuard] }
  ];
  
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class SidenavRoutingModule {}
