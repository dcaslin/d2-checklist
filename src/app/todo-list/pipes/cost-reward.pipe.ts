import {Pipe, PipeTransform} from '@angular/core';
import { CostReward, InventoryItem } from '@app/todo-list/interfaces/vendor.interface';
import { DictionaryService } from '@app/todo-list/services/dictionary.service';

@Pipe({ name: 'costReward' })
export class CostRewardPipe implements PipeTransform {

  constructor(private dictionary: DictionaryService) {}

  transform(values: CostReward[], ...args: string[]): ManifestCostReward[] {
    const output: ManifestCostReward[] = [];
    values.forEach(value => {
      const item: InventoryItem = this.dictionary.findItem(value.itemHash);
      if (!!item) { // reward arrays often have empty elements, but a set length of 6
        output.push( { item, quantity: value.quantity } );
      }
    });
    return output;
  }
}

export interface ManifestCostReward {
  item: InventoryItem;
  quantity: number;
}
