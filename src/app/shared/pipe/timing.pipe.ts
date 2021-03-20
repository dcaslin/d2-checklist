
import {Pipe, PipeTransform} from '@angular/core';
import * as moment from 'moment';

// @Pipe({ name: 'amnsTiming' })
// export class TimingPipe implements PipeTransform {

//   private static pad(num: number, size: number): string {
//       let s = num + '';
//       while (s.length < size) { s = '0' + s; }
//       return s;
//   }

//   transform(value: any, ...args: string[]): string {
//     if (typeof args === 'undefined' || args.length !== 1) {
//       throw new Error('DurationPipe: missing required time unit argument');
//     }
//     const m = moment.duration(value, args[0] as moment.unitOfTime.DurationConstructor);
//     const hours = 24 * m.days() + m.hours();
//     if (hours > 36) {
//       return m.days() + 'd ' + TimingPipe.pad(m.hours(), 2) + ':' + TimingPipe.pad(m.minutes(), 2) + ':' + TimingPipe.pad(m.seconds(), 2);
//     } else {
//       return TimingPipe.pad(hours, 2) + ':' + TimingPipe.pad(m.minutes(), 2) + ':' + TimingPipe.pad(m.seconds(), 2);
//     }
//   }
// }

@Pipe({ name: 'amFromUnix' })
export class FromUnixPipe implements PipeTransform {
  transform(value: number | string, ...args: string[]): any {
    return typeof value === 'string' ? moment.unix(parseInt(value, 10)) : moment.unix(value);
  }
}

@Pipe({ name: 'amDuration' })
export class DurationPipe implements PipeTransform {
  allowedUnits: Array<string> = ['ss', 's', 'm', 'h', 'd', 'M'];

  transform(value: moment.DurationInputArg1, ...args: string[]): string {
    if (typeof args === 'undefined' || args.length !== 1) {
      throw new Error('DurationPipe: missing required time unit argument');
    }
    return moment.duration(value, args[0] as moment.unitOfTime.DurationConstructor).humanize();
  }
}

const momentConstructor = moment;

@Pipe({ name: 'amDifference' })
export class DifferencePipe implements PipeTransform {
  transform(
    value: moment.MomentInput,
    otherValue: moment.MomentInput,
    unit?: moment.unitOfTime.Diff,
    precision?: boolean,
  ): number {
    const date = momentConstructor(value);
    const date2 = otherValue !== null ? momentConstructor(otherValue) : momentConstructor();

    return date.diff(date2, unit, precision);
  }
}

// @Pipe({ name: 'amDateFormat' })
// export class DateFormatPipe implements PipeTransform {
//   transform(value: moment.MomentInput, ...args: any[]): string {
//     if (!value) {
//       return '';
//     }
//     return momentConstructor(value).format(args[0]);
//   }
// }
