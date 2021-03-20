import { Pipe, PipeTransform } from '@angular/core';
import { format, formatDuration, intervalToDuration, parseISO } from 'date-fns';
import { formatDistanceStrict } from 'date-fns/esm';

@Pipe({ name: 'd2cTiming' })
export class TimingPipe implements PipeTransform {
  // format ms into a duration
  transform(value: number, unit: string): string {
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
      return dur.days + 'd ' + TimingPipe.pad(dur.hours, 2) + ':' + TimingPipe.pad(dur.minutes, 2) + ':' + TimingPipe.pad(dur.seconds, 2);
    } else {
      return TimingPipe.pad(hours, 2) + ':' + TimingPipe.pad(dur.minutes, 2) + ':' + TimingPipe.pad(dur.seconds, 2);
    }
  }

  private static pad(num: number, size: number): string {
    let s = num + '';
    while (s.length < size) { s = '0' + s; }
    return s;
  }
}

@Pipe({ name: 'd2cDateFormat' })
export class DateFormatPipe implements PipeTransform {
  transform(value: Date | string, formatLayout: string): string {
    if (!value) {
      return '';
    }
    const val = typeof value === 'string' ? parseISO(value) : value;
    try {
      return format(val, formatLayout);
    } catch (x) {
      console.error(x);
      return 'Error formatting date';
    }
  }
}



@Pipe({ name: 'd2cMinsHumanized' })
export class MinsHumanizedPipe implements PipeTransform {
  transform(mins: number): string {
    const duration = intervalToDuration({ start: 0, end: mins * 60 * 1000 });
    return formatDuration(duration);
  }
}



@Pipe({ name: 'd2cAgoHumanized' })
export class AgoHumanizedPipe implements PipeTransform {
  transform( value: string, skipSuffix?: boolean): string {
    const today = new Date();
    const start = parseISO(value);
    return formatDistanceStrict(start, today, {
      addSuffix: !skipSuffix
    });
  }
}