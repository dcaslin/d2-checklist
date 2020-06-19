import { Injectable } from '@angular/core';
import { ItemType } from '@app/service/model';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { filter, switchMap, takeUntil } from 'rxjs/operators';

import { API_ROOT } from '../constants/constants';
import { ApiResponse } from '../interfaces/api.interface';
import { Character } from '../interfaces/player.interface';
import {
  Bounty,
  InventoryItem,
  SaleItem,
  Vendor,
  VendorResponse,
  VendorSales,
  VendorsSalesList,
} from '../interfaces/vendor.interface';
import { Destroyable } from '../util/destroyable';
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
    private dictionary: DictionaryService
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
    bounty.chars[char.characterId] = { saleStatus: characterBounty.saleStatus };
  }

  /**
   * constructs the piece of the request URL that relates to the character
   * @param char the character in question
   */
  private charUrl(char: Character) {
    // TODO: define a different character object? We're going to be adding more fields to it at least, and there's a lot of other fields we don't care about in this context
    return `destiny2/${char.membershipType}/profile/${char.membershipId}/character/${char.characterId}`
  }
}
