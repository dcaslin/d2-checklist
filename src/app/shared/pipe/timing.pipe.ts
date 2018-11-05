
import {Pipe, PipeTransform} from '@angular/core';
import * as moment from 'moment';

@Pipe({ name: 'amnsTiming' })
export class TimingPipe implements PipeTransform {

  private static pad(num: number, size: number): string {
      let s = num + '';
      while (s.length < size) { s = '0' + s; }
      return s;
  }

  transform(value: any, ...args: string[]): string {
    if (typeof args === 'undefined' || args.length !== 1) {
      throw new Error('DurationPipe: missing required time unit argument');
    }
    const m = moment.duration(value, args[0] as moment.unitOfTime.DurationConstructor);
    const hours = 24 * m.days() + m.hours();
    if (hours > 36) {
      return m.days() + 'd ' + TimingPipe.pad(m.hours(), 2) + ':' + TimingPipe.pad(m.minutes(), 2) + ':' + TimingPipe.pad(m.seconds(), 2);
    } else {
      return TimingPipe.pad(hours, 2) + ':' + TimingPipe.pad(m.minutes(), 2) + ':' + TimingPipe.pad(m.seconds(), 2);
    }
  }
}
