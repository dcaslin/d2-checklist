import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatTooltipModule, MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { MilestoneCheckComponent } from './milestone-check.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';


@NgModule({
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatTooltipModule,
    MatProgressBarModule
  ],
  declarations: [MilestoneCheckComponent],
  exports: [MilestoneCheckComponent],
  providers: [
    {
      provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
      useValue: {
        disableTooltipInteractivity: true
      },
    }
  ],
})
export class MilestoneCheckModule { }
