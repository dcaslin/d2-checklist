import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CountdownDirective } from './directives/countdown.directive';
import { TimeUntilPipe } from './pipes/time-until.pipe';
import { SecondService } from './services/second.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    TimeUntilPipe,
    CountdownDirective,
  ],
  providers: [
    SecondService
  ],
  exports: [
    TimeUntilPipe,
    CountdownDirective,
  ]
})
export class CountdownModule { }
