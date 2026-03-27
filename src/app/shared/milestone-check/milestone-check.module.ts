import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatLegacyTooltipModule as MatTooltipModule, MAT_LEGACY_TOOLTIP_DEFAULT_OPTIONS as MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/legacy-tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { MilestoneCheckComponent } from './milestone-check.component';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';


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
