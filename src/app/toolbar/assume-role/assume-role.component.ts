import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { NgIf } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog'; // Tämä korjaa virheen!
import { ReactiveFormsModule } from '@angular/forms'; 
import { CredentialService } from '../../services/credential.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-assume-role',
  standalone: true,
  templateUrl: './assume-role.component.html',
  styleUrls: ['./assume-role.component.scss'],
  imports: [
    MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule,
    NgIf, ReactiveFormsModule
  ]
})
export class AssumeRoleComponent {
  private _snackBar = inject(MatSnackBar);

  assumeRoleForm: FormGroup;
  
  constructor(private credentialService: CredentialService,
    private dialogRef: MatDialogRef<AssumeRoleComponent>, 
    private formBuilder: FormBuilder) {

    this.assumeRoleForm = this.formBuilder.group({
      accountId: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]], // 12 digits
      roleName: ['', Validators.required],
      displayName: [''], // Optional
      region: ['']
    });
  }
   


  validateNumberInput(event: KeyboardEvent) {
    const char = event.key;
    if (!/^[0-9]$/.test(char)) {
      event.preventDefault(); 
    }
  }

  // Called from the dialog close button
  closeDialog() {
    this.dialogRef.close();
  }

  async assumeRole() {
    if (this.assumeRoleForm.valid) {
      const accountId = this.assumeRoleForm.value.accountId;
      const roleName = this.assumeRoleForm.value.roleName;
      const displayName = this.assumeRoleForm.value.displayName || roleName + '@' + accountId;
      const region = this.assumeRoleForm.value.region;
      
      console.log('Assuming role: ', accountId, roleName, displayName, region);

      try {
        await this.credentialService.assumeRole(`arn:aws:iam::${accountId}:role/${roleName}`, displayName, region);
        
        // Close the dialog and pass the new account to the parent component
        const newAccount = { displayName: displayName, accountId: accountId, role: roleName, region: region };
        this.dialogRef.close(newAccount);
      }
      catch (error) {
        console.error('Failed to assume role', error);
        this._snackBar.open('Failed to assume role: ' + error, 'Close', { duration: 5000 });
      }
    }    
  }
}
