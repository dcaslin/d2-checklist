import { Injectable } from '@angular/core';
import { ItemType } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import * as moment from 'moment';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { filter, switchMap, takeUntil, tap } from 'rxjs/operators';

import { Destroyable } from '../../util/destroyable';
import { API_ROOT } from '../constants/constants';
import { ApiResponse } from '../interfaces/api.interface';
import { Character } from '../interfaces/player.interface';
import {
  Bounty,
  InventoryItem,
  SaleItem,
  SaleStatus,
  Vendor,
  VendorResponse,
  VendorSales,
  VendorsSalesList,
} from '../interfaces/vendor.interface';
import { ContextService } from './context-service';
import { DictionaryService } from './dictionary.service';
import { HttpService } from './http.service';


/**
 * Provides a catalog of bounties
 */
@Injectable()
export class BountyCatalogService extends Destroyable {

  public bountyCatalog: BehaviorSubject<Bounty[]> = new BehaviorSubject(null);

  private chars: Character[];
  private uniqueBounties: { [key: string]: Bounty } = {};

  constructor(
    private http: HttpService,
    private context: ContextService,
    private dictionary: DictionaryService,
    private notifications: NotificationService
  ) {
    super();
    this.fetchBountiesForChars();
  }

  private fetchBountiesForChars() {
    this.context.characters.pipe(
      filter((x) => !!x),
      tap((chars: Character[]) => {
        // This could technically be done in the switchmap, but I want to separate the logic a bit
        // Some bounties are in character inventories, but are no longer sold by the vendor
        // These are "orphaned" bounties, but still have relevant info and expirations that we can track
        // Also things like Werner-99 treasure maps will always be this way, since he doesn't sell the treasure maps,
        // but you actually get a new bounty when you complete the one that he sold you.
        chars.forEach(char => this.extractInventoryBounties(char));
      }),
      switchMap((chars) => {
        this.chars = chars;
        const dataStream = this.createVendorsStream(chars);
        return combineLatest(...dataStream);
      }),
      takeUntil(this.destroy$)
    ).subscribe(([sales0, sales1, sales2]) => {
      this.extractVendorBounties(sales0, this.chars[0]);
      this.extractVendorBounties(sales1, this.chars[1]);
      this.extractVendorBounties(sales2, this.chars[2]);
      this.bountyCatalog.next(Object.values(this.uniqueBounties));
    },
    // error
    () => {
      this.notifications.fail('Unable to load bounty data, please try again later.');
    });
  }

  private createVendorsStream(chars: Character[]): Observable<ApiResponse<VendorResponse>>[] {
    chars = chars || [];
    const vendorDatas: Observable<ApiResponse<VendorResponse>>[] = [];
    chars.forEach((c) => {
      vendorDatas.push(this.getVendorInfoForChar(c));
    })
    if (!vendorDatas.length) {
      vendorDatas.push(of(null));
    }
    return vendorDatas;
  }

  private getVendorInfoForChar(char: Character): Observable<ApiResponse<VendorResponse>> {
    // vendor sales gives us the bounties (in addition to other things)
    const options = { params: { components: 'vendorSales' } };
    const url = `${API_ROOT}/${this.charUrl(char)}/vendors/`;
    return this.http.get(url, options)
  }

  private extractVendorBounties(resp: ApiResponse<VendorResponse>, char: Character) {
    if (!resp || !char) { return; }
    // get the sale items map
    const salesData: VendorsSalesList = resp.Response.sales.data;

    Object.keys(salesData).forEach((vendorHash) => { // keyed by vendor hash
      let vendor: Vendor = null;
      const vendorSales: VendorSales = salesData[vendorHash].saleItems;

      Object.keys(vendorSales).forEach((key) => { // key is arbitrary
        const rawItem: SaleItem = vendorSales[key];
        const manifestItem: InventoryItem = this.dictionary.findItem(rawItem.itemHash);
        if (this.isBounty(manifestItem)) {
          vendor = vendor || this.dictionary.findVendor(vendorHash);
          const vendorName = vendor.displayProperties.name;
          this.addToBounties(rawItem, manifestItem, char, vendorName, true);
        }
      });
    });
  }

  private extractInventoryBounties(char: Character): void {
    if (!char) { return; }
    char.inventory.forEach(item => {
      const manifestItem: InventoryItem = this.dictionary.findItem(item.itemHash);
      // check expired before calling addToBounties UNLIKE the process for adding a vendor bounty
      // this is because if you have an expired vendor bounty, that means that yours will expire
      // and the vendor will be selling a new one.
      // HOWEVER, this method only searches for bounties in the inventory. If a bounty has expired,
      // that does not mean that it's in the vendor shop, so treat it like it's not there
      if (this.isBounty(manifestItem) && !this.isExpired(item.expirationDate)) {
        // need to get the vendor for the bounty
        const vendorName = this.tryToGetVendorName(manifestItem);
        // spoof data to make it look like it's been bought
        // we could change the logic in the progression renderer to not use this,
        // but instead see if the bounty is in the character inventory?
        const tempItem: Partial<SaleItem> = { ...item, saleStatus: SaleStatus.ALREADY_HELD }
        this.addToBounties(tempItem, manifestItem, char, vendorName, false);
      }
    });
  }

  private addToBounties(
    characterBounty: Partial<SaleItem>, // This is either a legit sale item from the api or an inventory bounty
    manifestBounty: InventoryItem,
    char: Character,
    vendorName: string,
    fromVendor: boolean
  ): void {
    let bounty: Bounty = this.uniqueBounties[manifestBounty.hash]
    if (!bounty) {
      // if the bounty doesn't exist, create it and add it to the unique map
      bounty = {
        ...manifestBounty,
        costs: characterBounty.costs || [],
        vendorName,
        inVendorStock: fromVendor,
        chars: { }
      }
      this.uniqueBounties[manifestBounty.hash] = bounty;
    }
    // then add the character specific data to the bounty
    const expiration = this.getExpiration(bounty, char);
    const isExpired = this.isExpired(expiration);
    // INV_ITEM is a filler because we don't have vendor data for bounties
    // that are sitting in an inventory. So if we find better data, then replace it.
    // I'm thinking about in the future taking vendor off the column list,
    // especially because milestones don't have vendors. 'Rewards' would be a much better column
    if (bounty.inVendorStock === false) {
      bounty.vendorName = vendorName;
      bounty.inVendorStock = fromVendor;
      bounty.costs = characterBounty.costs;
    }
    // NOTE: If a character is holding an expired bounty,
    // that bounty will stay in their inventory until they log in, at which time
    // the bounty will be cleared from their inventory, so for all realistic purposes,
    // the saleStatus should be "Available" for that character
    bounty.chars[char.characterId] = {
      saleStatus: isExpired ? SaleStatus.AVAILABLE : characterBounty.saleStatus,
      expirationDate: isExpired ? undefined : expiration
    };
  }

  private isBounty(manifestItem: InventoryItem) {
    return manifestItem.itemType === ItemType.Bounty;
  }

  /**
   * returns undefined if there is no expiration
   */
  private getExpiration(bounty: Bounty, char: Character): string {
    const bountyHash = bounty.hash;
    // TODO: look into performance of this. Might be worth storing inventory
    // as a hash keyed by the itemHash to get O(1) lookups, giving the bounty
    // parse process O(N) time instead of O(N^2) time. N is still relatively small (~100)
    const item = char.inventory.find(item => item.itemHash === bountyHash);
    return item ? item.expirationDate : undefined;
  }

  private isExpired(expiration: string) {
    if (!expiration) { return false; } // not expired if there is no expiration
    return moment(expiration).diff(moment()) <= 0;
  }

  // Meant to help some of the weirdness around only-in-inventory bounties
  // this isn't trying to do a reverse lookup for all weird cases.
  // if you bought a bounty from a vendor and then it rotated out of stock,
  // there's no way we're realistically going to find that vendor name
  private tryToGetVendorName(item: InventoryItem): string {
    if (item.displayProperties.name === TREASURE_MAP) {
      return 'Werner 99-40'
    }
    return INV_ITEM;
  }

  /**
   * constructs the piece of the request URL that relates to the character
   * @param char the character in question
   */
  private charUrl(char: Character) {
    return `destiny2/${char.membershipType}/profile/${char.membershipId}/character/${char.characterId}`
  }
}

const INV_ITEM = 'Inventory';
const TREASURE_MAP = 'Imperial Treasure Map'
