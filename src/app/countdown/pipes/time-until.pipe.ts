import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeUntil' })
export class TimeUntilPipe implements PipeTransform {

  /**
   * If under 24 hours, displays time in HH:mm:ss
   * If over 24 hours, displays time in 'd Days, h Hours'
   * @param value a number of seconds until the present time.
   * @param args 
   */
  transform(value: number, args?: any): any {
    // set the value to 0 if invalid (null, undefined, negative)
    value = (!value || value < 0 ) ? 0 : value;
    if (value > 60 * 60 * 24) {
      // value is over a day
      const days = Math.floor(value / ONE_DAY);
      const hours = Math.floor(value / ONE_HOUR) % 24;
      const daysDisplay = `${days} ${this.pluralize(days, 'day', 'days')}`
      const hoursDisplay = `${hours} ${this.pluralize(hours, 'hour', 'hours')}`;
      if (hours > 0) {
        return `${daysDisplay} ${hoursDisplay}`;
      } else {
        return `${daysDisplay}`;
      }
    }
    const hours = Math.floor((value / 60) / 60);
    const minutes = Math.floor(value / 60) % 60;
    const seconds = value % 60;
    return `${this.padded(hours)}:${this.padded(minutes)}:${this.padded(seconds)}`;
  }
  
  private padded(time: number): string {
    const pad: string = time < 10 ? '0' : '';
    return `${pad}${time}`;
  }

  private pluralize(value: number, single: string, plural: string) {
    return value === 1 ? single : plural;
  }
}

const ONE_HOUR = 60 * 60;
const ONE_DAY = 60 * 60 * 24;
