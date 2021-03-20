import { NgModule } from '@angular/core';
import { FromUnixPipe, DurationPipe, DifferencePipe } from './timing.pipe';
import { XTimingPipe, XFromUnixPipe, XDurationPipe, XDifferencePipe, XDateFormatPipe } from './timing2.pipe';

@NgModule({
  imports: [
  ],
  declarations: [
    FromUnixPipe, DurationPipe, DifferencePipe,
    XTimingPipe, XFromUnixPipe, XDurationPipe, XDifferencePipe, XDateFormatPipe
  ],
  exports: [
    FromUnixPipe, DurationPipe, DifferencePipe,
    XTimingPipe, XFromUnixPipe, XDurationPipe, XDifferencePipe, XDateFormatPipe
  ]
})
export class PipeModule { }
