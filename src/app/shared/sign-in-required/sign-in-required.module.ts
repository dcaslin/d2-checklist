import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
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
