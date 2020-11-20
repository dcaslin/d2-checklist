import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { SignInRequiredComponent } from './sign-in-required.component';

@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    FontAwesomeModule
  ],
  declarations: [SignInRequiredComponent],
  exports: [SignInRequiredComponent]
})
export class SignInRequiredModule { }
