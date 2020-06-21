import {Pipe, PipeTransform} from '@angular/core';
import { CostReward, InventoryItem } from '@app/todo-list/interfaces/vendor.interface';
import { DictionaryService } from '@app/todo-list/services/dictionary.service';

@Pipe({ name: 'costReward' })
export class CostRewardPipe implements PipeTransform {

  constructor(private dictionary: DictionaryService) {}

  transform(values: CostReward[], ...args: string[]): string[] {
    const output = [];
    values.forEach(value => {
      const manifestItem: InventoryItem = this.dictionary.findItem(value.itemHash);
      output.push(`${manifestItem.displayProperties.name} ${value.quantity}`);
    });
    return output;
  }
}
