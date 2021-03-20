import { NgModule } from '@angular/core';
import { AgoHumanizedPipe, TimingPipe, MinsHumanizedPipe, DateFormatPipe } from './timing.pipe';

@NgModule({
  imports: [
  ],
  declarations: [
    AgoHumanizedPipe, TimingPipe, MinsHumanizedPipe, DateFormatPipe
  ],
  exports: [
    AgoHumanizedPipe, TimingPipe, MinsHumanizedPipe, DateFormatPipe
  ]
})
export class PipeModule { }
