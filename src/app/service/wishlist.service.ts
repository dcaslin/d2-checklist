import { Injectable, OnDestroy } from '@angular/core';
import { Subject,  } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import * as LZString from 'lz-string';
import { InventoryItem } from './model';
import { NotificationService } from './notification.service';

@Injectable()
export class WishlistService implements OnDestroy {
    private data: { [hash: string] : CuratedRoll[]; };
    static WildcardItemId = -69420 // nice

    constructor(private httpClient: HttpClient, private notificationService: NotificationService) {
       
    }

    public async init(): Promise<void> {
        if (this.data != null) { return; } else {
            const temp = await this.load();
            const data: { [hash: string] : CuratedRoll[]; } = {};
            for (const c of temp){
              if (data[c.itemHash]==null){
                data[c.itemHash] = [];
              }
              data[c.itemHash].push(c);
            }
            this.data = data;
            console.log("Loaded "+this.data.length+" wish list items");
        }
    }

    private async load(): Promise<CuratedRoll[]> {
        try{
        const requestUrl = 'https://raw.githubusercontent.com/darkelement1987/godroll/master/godrolls.txt';
        const bansheeText = await this.httpClient.get(requestUrl, {responseType: 'text'}).toPromise();
         return WishlistService.toCuratedRolls(bansheeText);
        }
        catch (e){
            this.notificationService.info("Error loading wishlist: "+e);
            return [];
        }
    }

    public processItems(items: InventoryItem[]): void {
      console.log("Processing wishlist");
      for (const i of items){
        if (this.data[i.hash]!=null){
          //for each curated roll
          for (const c of this.data[i.hash]){
            let rollMatches = true;
            //is every.single.perk found in the sockets
            for (const desiredPerk of c.recommendedPerks){
              let perkFound = false;
              for (const s of i.sockets){
                for (const p of s.plugs){
                  if (+p.hash==desiredPerk){
                    perkFound = true;
                    break;
                  }
                }
                if (perkFound==true) break;
              }
              if (!perkFound){
                rollMatches = false;
                break;
              }
            }
            if (rollMatches){
              i.godRoll = true;
              i.searchText = i.searchText+" godroll";
              break;
            }
          }
        }
      }
    }

    
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    private unsubscribe$: Subject<void> = new Subject<void>();

    private static toCuratedRoll(bansheeTextLine: string): CuratedRoll | null {
        if (!bansheeTextLine || bansheeTextLine.length === 0) {
          return null;
        }
      
        const matchResults = bansheeTextLine.match(
          /https:\/\/banshee-44\.com\/\?weapon=(\d.+)&socketEntries=(.*)/
        );
      
        if (!matchResults || matchResults.length !== 3) {
          return null;
        }
      
        const itemHash = Number(matchResults[1]);
        const recommendedPerks = matchResults[2]
          .split(',')
          .map(Number)
          .filter((perkHash) => perkHash > 0);
      
        return {
          itemHash,
          recommendedPerks,
          isExpertMode: false
        };
      }
      
      private static toDimWishListCuratedRoll(textLine: string): CuratedRoll | null {
        if (!textLine || textLine.length === 0) {
          return null;
        }
        const matchResults = textLine.match(/dimwishlist:item=(-?\d.+)&perks=([\d|,]*).*/);
        if (!matchResults || matchResults.length !== 3) {
          return null;
        }
      
        const itemHash = Number(matchResults[1]);
        if (itemHash < 0 && itemHash !== WishlistService.WildcardItemId) {
          return null;
        }
        const recommendedPerks = matchResults[2]
          .split(',')
          .map(Number)
          .filter((perkHash) => perkHash > 0);
        return {
          itemHash,
          recommendedPerks,
          isExpertMode: true
        };
      }
      
      /** Newline-separated banshee-44.com text -> CuratedRolls. */
      static toCuratedRolls(bansheeText: string): CuratedRoll[] {
        const textArray = bansheeText.split('\n');
        let temp = textArray.map(WishlistService.toCuratedRoll).concat(textArray.map(WishlistService.toDimWishListCuratedRoll));
        temp = temp.filter(Boolean);
        return temp;
      }
}



/**
 * From https://github.com/DestinyItemManager/DIM/blob/5719fca8aba513415930a6fb175897e0736d05da/src/app/curated-rolls/curatedRoll.ts
 * Interface for translating lists of curated rolls to a format we can use.
 * Initially, support for translating banshee-44.com -> this has been built,
 * but this is here so that we can plug in support for anyone else that can
 * get us this information.
 */
export interface CuratedRoll {
    /** Item hash for the recommended item. */
    itemHash: number;
    /**
     * All of the perks (perk hashes) that need to be present for an item roll to
     * be recognized as curated.
     * Note that we'll discard some (intrinsics, shaders, masterworks) by default.
     * Also note that fuzzy matching isn't present, but can be faked by removing
     * perks that are thought to have marginal bearing on an item.
     */
    recommendedPerks: number[];
    /**
     * Is this an expert mode recommendation?
     * With B-44 rolls, we make sure that most every perk asked for exists
     * on the item. (It does discard masterwork and some other odds and ends).
     * With expert rolls, you can be as vague or specific as you want, so we make
     * sure that at least every perk asked for is there.
     */
    isExpertMode: boolean;
  }