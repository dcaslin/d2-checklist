import {Pipe, PipeTransform} from '@angular/core';
import { format, parseISO, formatDuration, intervalToDuration, fromUnixTime } from 'date-fns';
import * as moment from 'moment';

@Pipe({ name: 'xmnsTiming' })
export class XTimingPipe implements PipeTransform {
  // format ms into a duration
  transform(value: number, ...args: string[]): string {
    if (typeof args === 'undefined' || args.length !== 1) {
      throw new Error('DurationPipe: missing required time unit argument');
    }
    const unit = args[0];
    if (unit === 's') {
      value = value * 1000;
    } else if (unit === 'ms') {
      // do nothing
    } else {
      throw new Error(`'${unit}' is not a valid, must be 'ms' or 's'`);

    }
    const dur = intervalToDuration({ start: 0, end: value });
    const hours = 24 * dur.days + dur.hours;
    if (hours > 36) {
      return dur.days + 'd ' + XTimingPipe.pad(dur.hours, 2) + ':' + XTimingPipe.pad(dur.minutes, 2) + ':' + XTimingPipe.pad(dur.seconds, 2);
    } else {
      return XTimingPipe.pad(hours, 2) + ':' + XTimingPipe.pad(dur.minutes, 2) + ':' + XTimingPipe.pad(dur.seconds, 2);
    }
  }

  private static pad(num: number, size: number): string {
      let s = num + '';
      while (s.length < size) { s = '0' + s; }
      return s;
  }

}

@Pipe({ name: 'xmFromUnix' })
export class XFromUnixPipe implements PipeTransform {
  transform(value: number, ...args: string[]): any {
    const val = typeof value === 'string' ? parseInt(value, 10) : value;
    return fromUnixTime(val);
  }
}

@Pipe({ name: 'xmDateFormat' })
export class XDateFormatPipe implements PipeTransform {
  transform(value: Date|string, ...args: any[]): string {
    if (!value) {
      return '';
    }

    const val = typeof value === 'string' ? parseISO(value) : value;
    return format(val, args[0]);
  }
}


@Pipe({ name: 'xmDuration' })
export class XDurationPipe implements PipeTransform {
  allowedUnits: Array<string> = ['ss', 's', 'm', 'h', 'd', 'M'];

  transform(value: moment.DurationInputArg1, ...args: string[]): string {
    if (typeof args === 'undefined' || args.length !== 1) {
      throw new Error('DurationPipe: missing required time unit argument');
    }
    return moment.duration(value, args[0] as moment.unitOfTime.DurationConstructor).humanize();
  }
}

const momentConstructor = moment;

@Pipe({ name: 'xmDifference' })
export class XDifferencePipe implements PipeTransform {
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