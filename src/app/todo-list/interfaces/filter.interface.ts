import { ActivityRow } from './activity.interface';
import { InventoryItem } from './vendor.interface';

export interface TogglableItem extends InventoryItem {
  d2cActive: boolean;
}

export interface TogglableRowItem extends ActivityRow {
  d2cActive: boolean;
}
