import { inject } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";


export class CommonSidenavComponent {
  private _snackBar = inject(MatSnackBar);

  protected showErrorOnSnackBar(error: unknown, dur: number = 5000) {
    if (error instanceof Error) {
      this.showSnackBar(error.message, dur);
    } else {
      this.showSnackBar('Unknown error occurred');
    }
  }

  protected showSnackBar(message: string, dur: number = 5000) {
    this._snackBar.open(message, 'Close', { duration: dur });
  }
}