import { NgModule } from '@angular/core';
import { TimingPipe, FromUnixPipe, DurationPipe, DifferencePipe, DateFormatPipe } from './timing.pipe';

@NgModule({
  imports: [
  ],
  declarations: [TimingPipe, FromUnixPipe, DurationPipe, DifferencePipe, DateFormatPipe],
  exports: [TimingPipe, FromUnixPipe, DurationPipe, DifferencePipe, DateFormatPipe]
})
export class PipeModule { }
