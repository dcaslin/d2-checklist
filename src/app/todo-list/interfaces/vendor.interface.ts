import { ItemType } from '@app/service/model';
import { DisplayProperties } from './api.interface';
import { ApiInventoryItem } from './player.interface';

/**
 * Represents the `vendors` endpoint with the `vendorSales` component
 */
export interface VendorResponse {
  categories: Privacy;
  currencyLookups: Privacy;
  itemComponents: { [key: string]: any; } // in my experience, any is usually `null`
  sales: {
    data: VendorsSalesList // key is the vendor hash
  }
  vendorGroups: Privacy;
  vendors: Privacy;
}

export interface VendorsSalesList {
  saleItems: { [key: string]: VendorSales; } // key is an arbitrary number
}

export interface VendorSales {
  [key: string]: SaleItem; // key is an arbitrary number
}

export interface SaleItem extends ApiInventoryItem {
  augments: number;
  costs: CostReward[];
  failureIndexes: any[];
  itemHash: number; // used to look up what the item is
  quantity: number;
  saleStatus: SaleStatus;
  vendorItemIndex: number;
}

export interface CostReward {
  itemHash: number;
  quantity: number;
}

export interface Reward {
  itemValue: CostReward[];
  valueDescription: string;
}

export interface Vendor {
  hash: number;
  displayProperties: DisplayProperties;
}

/**
 * There are many more properties, but these are the most useful to us,
 * where we only care about bounties at the moment
 */
export interface InventoryItem {
  displayProperties: DisplayProperties;
  itemTypeDisplayName: string; // "Daily Bounty"
  itemTypeAndTierDisplayName: string; // "Common Daily Bounty"
  inventory: any; // could be useful for the inventory item name?
  value: Reward; // rewards
  objectives: any; // TODO: track objectives
  itemCategoryHashes: number[]; // [3441456675, 1784235469] which equates to "Bounties: Daily" and "Bounties" 
  itemType: ItemType; // <enum "Bounty" 26>
  traitIds?: string[]; // ["inventory_filtering.bounty", "item_type.bounty"] seems redundant to `itemCategoryHashes`
  hash: number; // 304697572
  index: number; // 14618
}

/**
 * Idk if this is useful, but it is very common
 */
export interface Privacy {
  privacy: number
}

/**
 * This is defined by us, a combination of the manifest bounty,
 * the character progressions on the bounty, and the vendor
 */
export interface Bounty extends InventoryItem {
  costs: CostReward[]; // assuming that it's the same cost for each character
  vendorName: string;
  inVendorStock: boolean // if it's not in vendor stock, then it's only in inventories
  chars: { [key: string]: BountyCharInfo; }
}

export interface BountyCharInfo {
  saleStatus: SaleStatus;
  expirationDate?: string;
  progress?: any; // TODO: track progress and define a better interface
}

export enum SaleStatus {
  AVAILABLE = 0,
  COMPLETED = 8,
  NOT_FOR_SALE = 32,
  NOT_AVAILABLE = 64,
  ALREADY_HELD = 128,
}
