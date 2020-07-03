import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { MilestoneCheckComponent } from './milestone-check.component';


@NgModule({
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatTooltipModule
  ],
  declarations: [MilestoneCheckComponent],
  exports: [MilestoneCheckComponent]
})
export class MilestoneCheckModule { }
