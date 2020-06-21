/**
 * The models in this file are only designed to work in the
 * context of the todo-list module.
 */
import { ClassAllowed } from '@app/service/model';

import { DisplayProperties } from './api.interface';
import { InventoryItem } from './vendor.interface';


/**
 * Represents the character metadata
 */
export interface Character {
  emblemPath: string;
  characterId: string;
  membershipId: string;
  membershipType: number;
  light: number;
  classType: ClassAllowed;
  classHash: number;
  className: string; // not from API, but from us
  inventory: ApiInventoryItem[];
}

export interface ManifestClass {
  classType: number; // 2
  displayProperties: DisplayProperties;
  name: string; // "Warlock"
  hash: number; // 2271682572
}

export interface CharResponse {
  characters: any;
  characterInventories?: { [key: string]: Inventory }
}

export interface Inventory {
  items: ApiInventoryItem[];
}

/**
 * There's a lot more properties, but these are the only ones
 * that seem remotely useful.
 */
export interface ApiInventoryItem {
  itemHash: number; // 568515759
  expirationDate: string; // "2020-06-24T01:55:35Z"
  itemInstanceId: string; // "6917529194608561468"
}

export interface InventoryMap {
  [key: string]: InventoryItem; // where the key is the itemHash of the inventory item
}
