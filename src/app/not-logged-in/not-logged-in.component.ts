import { CommonModule } from '@angular/common'; // Varmista, että CommonModule tuodaan
import { Component, Input, OnInit } from '@angular/core';
import { cognitoConfig } from '../config/configuration';
@Component({
  selector: 'app-not-logged-in',
  imports: [ CommonModule ],
  templateUrl: './not-logged-in.component.html',
  styleUrls: ['./not-logged-in.component.scss']
})
export class NotLoggedInComponent implements OnInit {
  @Input() isAuthenticated: boolean = false;
  configDone = cognitoConfig.IdentityPoolId !== '' && cognitoConfig.userPoolId !== '' && cognitoConfig.userPoolClientId !== '';

  ngOnInit(): void {
    console.log('NotLoggedInComponent::ngOnInit');
  }
}
 