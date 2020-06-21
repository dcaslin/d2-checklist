import { Injectable } from '@angular/core';
import { ItemType } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import * as moment from 'moment';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { filter, switchMap, takeUntil } from 'rxjs/operators';

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
      switchMap((chars) => {
        this.chars = chars;
        const dataStream = this.createVendorsStream(chars);
        return combineLatest(...dataStream);
      }),
      takeUntil(this.destroy$)
    ).subscribe(([sales0, sales1, sales2]) => {
      this.extractBounties(sales0, this.chars[0]);
      this.extractBounties(sales1, this.chars[1]);
      this.extractBounties(sales2, this.chars[2]);
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

  private extractBounties(resp: ApiResponse<VendorResponse>, char: Character) {
    if (!resp || !char) { return; }
    // get the sale items map
    const salesData: VendorsSalesList = resp.Response.sales.data;

    Object.keys(salesData).forEach((vendorHash) => { // keyed by vendor hash
      let vendor: Vendor = null;
      const vendorSales: VendorSales = salesData[vendorHash].saleItems;

      Object.keys(vendorSales).forEach((key) => { // key is arbitrary
        const rawItem: SaleItem = vendorSales[key];
        const manifestItem: InventoryItem = this.dictionary.findItem(rawItem.itemHash);
        if (manifestItem.itemType === ItemType.Bounty) {
          vendor = vendor || this.dictionary.findVendor(vendorHash);
          this.addToBounties(rawItem, manifestItem, char, vendor);
        }
      });
    });
  }

  private addToBounties(
    characterBounty: SaleItem,
    manifestBounty: InventoryItem,
    char: Character,
    vendor: Vendor
  ): void {
    let bounty: Bounty = this.uniqueBounties[manifestBounty.hash]
    if (!bounty) {
      // if the bounty doesn't exist, create that bitch
      bounty = {
        ...manifestBounty,
        costs: characterBounty.costs,
        vendorName: vendor.displayProperties.name,
        chars: { }
      }
      this.uniqueBounties[manifestBounty.hash] = bounty;
    }
    // then add the character specific data to the bounty
    const expiration = this.getExpiration(bounty, char);
    const isExpired = this.isExpired(expiration);
    // NOTE: If a character is holding an expired bounty,
    // that bounty will stay in their inventory until they log in, at which time
    // the bounty will be cleared from their inventory, so for all realistic purposes,
    // the saleStatus should be "Available" for that character
    bounty.chars[char.characterId] = {
      saleStatus: isExpired ? SaleStatus.AVAILABLE : characterBounty.saleStatus,
      expirationDate: isExpired ? undefined : expiration
    };
  }

  /**
   * returns undefined if there is no expiration
   */
  private getExpiration(bounty: InventoryItem, char: Character): string {
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

  /**
   * constructs the piece of the request URL that relates to the character
   * @param char the character in question
   */
  private charUrl(char: Character) {
    return `destiny2/${char.membershipType}/profile/${char.membershipId}/character/${char.characterId}`
  }
}
