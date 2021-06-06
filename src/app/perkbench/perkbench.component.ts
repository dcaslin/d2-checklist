import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { MarkService } from '@app/service/mark.service';
import { NotificationService } from '@app/service/notification.service';
import { StorageService } from '@app/service/storage.service';
import { GunRoll, GunRolls } from '@app/service/panda-godrolls.service';
import { ChildComponent } from '@app/shared/child.component';
import { format } from 'date-fns';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { ro } from 'date-fns/locale';
import { DestinyCacheService, ManifestInventoryItem } from '@app/service/destiny-cache.service';
import { DamageType, InventoryPlug, InventorySocket, ItemType } from '@app/service/model';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { PerkBenchDialogComponent } from './perk-bench-dialog/perk-bench-dialog.component'


// God bless DIM

const WATERMARK_TO_SEASON = {
  "/common/destiny2_content/icons/0dac2f181f0245cfc64494eccb7db9f7.png": 1,
  "/common/destiny2_content/icons/dd71a9a48c4303fd8546433d63e46cc7.png": 1,
  "/common/destiny2_content/icons/591f14483308beaad3278c3cd397e284.png": 2,
  "/common/destiny2_content/icons/50d36366595897d49b5d33e101c8fd07.png": 2,
  "/common/destiny2_content/icons/e10338777d1d8633e073846e613a1c1f.png": 3,
  "/common/destiny2_content/icons/aaa61f6c70478d87de0df41e5709a773.png": 3,
  "/common/destiny2_content/icons/0669efb55951e8bc9e99f3989eacc861.png": 4,
  "/common/destiny2_content/icons/02478e165d7d8d2a9f39c2796e7aac12.png": 4,
  "/common/destiny2_content/icons/bbddbe06ab72b61e708afc4fdbe15d95.png": 5,
  "/common/destiny2_content/icons/c23c9ec8709fecad87c26b64f5b2b9f5.png": 5,
  "/common/destiny2_content/icons/f9110e633634d112cff72a67159e3b12.png": 6,
  "/common/destiny2_content/icons/e4a1a5aaeb9f65cc5276fd4d86499c70.png": 6,
  "/common/destiny2_content/icons/785e5a64153cabd5637d68dcccb7fea6.png": 7,
  "/common/destiny2_content/icons/69bb11f24279c7a270c6fac3317005b2.png": 7,
  "/common/destiny2_content/icons/d4141b2247cf999c73d3dc409f9d00f7.png": 8,
  "/common/destiny2_content/icons/82a8d6f2b1e4ee14e853d4ffbe031406.png": 8,
  "/common/destiny2_content/icons/8aae1c411642683d341b2c4f16a7130c.png": 8,
  "/common/destiny2_content/icons/ee3f5bb387298acbdb03c01940701e63.png": 8,
  "/common/destiny2_content/icons/ac012e11fa8bb032b923ad85e2ffb29c.png": 9,
  "/common/destiny2_content/icons/9b7e4bbc576fd15fbf44dfa259f8b86a.png": 9,
  "/common/destiny2_content/icons/3d335ddc3ec6668469aae60baad8548d.png": 10,
  "/common/destiny2_content/icons/e27a4f39c1bb8c6f89613648afaa3e9f.png": 10,
  "/common/destiny2_content/icons/796813aa6cf8afe55aed4efc2f9c609b.png": 11,
  "/common/destiny2_content/icons/49dc693c5f3411b9638b97f38a70b69f.png": 11,
  "/common/destiny2_content/icons/2347cc2407b51e1debbac020bfcd0224.png": 12,
  "/common/destiny2_content/icons/d3cffdcb881085bc4fe19d9671c9eb0c.png": 12,
  "/common/destiny2_content/icons/0aff1f4463f6f44e9863370ab1ce6983.png": 12,
  "/common/destiny2_content/icons/1f702463c5e0c4e25c9f00a730dbc6ac.png": 12,
  "/common/destiny2_content/icons/6a52f7cd9099990157c739a8260babea.png": 13,
  "/common/destiny2_content/icons/e197b731c11556b17664b90a87dd0c11.png": 13,
  "/common/destiny2_content/icons/b07d89064a1fc9a8e061f59b7c747fa5.png": 14,
  "/common/destiny2_content/icons/a9faab035e2f59f802e99641a3aaab9e.png": 14
};

const PERK_BENCH_IS_CONTROLLER_KEY = 'perkbench-is-controller';

@Component({
  selector: 'd2c-perkbench',
  templateUrl: './perkbench.component.html',
  styleUrls: ['./perkbench.component.scss']
})
export class PerkbenchComponent extends ChildComponent implements OnInit {
  public isController: boolean = true;
  public sortBy = 'name';
  public sortDesc = false;
  public filterText = '';
  public showMissingOnly = false;
  public filterChanged$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public rolls$: BehaviorSubject<MappedRoll[]> = new BehaviorSubject([]);
  public filteredRolls$: BehaviorSubject<MappedRoll[]> = new BehaviorSubject([]);
  public loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private weapons: GunInfo[] = [];

  // public getRoll(i: MappedRoll): GunRoll {
  //   for (const r of i.roll.) {

  //   }
  //   if (this.isController && i?.roll?.controller) {
  //     return i.roll.controller;
  //   }
  //   else if (i?.roll?.mnk) {
  //     return i.roll.mnk;
  //   }
  //   return null;
  // }

  constructor(storageService: StorageService,
    public iconService: IconService,
    public dialog: MatDialog,
    private destinyCacheService: DestinyCacheService,
    private notificationService: NotificationService,
    private httpClient: HttpClient
  ) {
    super(storageService);
    this.init();
    this.isController = localStorage.getItem(PERK_BENCH_IS_CONTROLLER_KEY) == 'true';
    combineLatest([this.filterChanged$, this.rolls$]).pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(50))
      .subscribe(([changed, rolls]) => {
        let showMe = rolls;
        if (this.showMissingOnly) {
          showMe = showMe.filter(x => x.roll == null || (this.isController ? x.roll.controller == null : x.roll.mnk == null));
        }
        if (this.filterText.trim().length > 0) {
          showMe = showMe.filter(x => JSON.stringify(x).toLowerCase().indexOf(this.filterText.toLowerCase()) >= 0);
        }
        showMe.sort((a, b) => {
          let aV, bV;
          if (this.sortBy == 'name') {
            aV = a.info.desc.displayProperties.name != null ? a.info.desc.displayProperties.name : '';
            bV = b.info.desc.displayProperties.name != null ? b.info.desc.displayProperties.name : '';
          } else if (this.sortBy == 'type') {
            aV = a.info.type != null ? a.info.type : '';
            bV = b.info.type != null ? b.info.type : '';
          } else if (this.sortBy == 'season') {
            aV = a.info.season != null ? a.info.season : '';
            bV = b.info.season != null ? b.info.season : '';
          }

          if (aV < bV) {
            return this.sortDesc ? 1 : -1;
          } else if (aV > bV) {
            return this.sortDesc ? -1 : 1;
          } else {
            return 0;
          }
        });
        console.log("done");
        this.filteredRolls$.next(showMe);
      });
  }

  ngOnInit(): void {
  }

  changeConsole() {
    localStorage.setItem('perkbench-is-console', '' + this.isController);
  }

  sort(val: string) {
    if (val == this.sortBy) {
      this.sortDesc = !this.sortDesc;
    } else {
      this.sortBy = val;
      this.sortDesc = true;
    }
    this.filterChanged$.next(true);

  }

  async init() {
    this.weapons = this.getWeaponDescs();
    this.load();
  }

  async load() {
    this.loading$.next(true);
    try {
      const gunRolls = await this.httpClient.get<GunRolls[]>(`/assets/panda-godrolls.min.json`).toPromise();
      const rolls = PerkbenchComponent.loadPandaJson(JSON.stringify(gunRolls), this.weapons);
      this.rolls$.next(rolls);
    } catch (x) {
      console.dir(x);
      this.notificationService.fail(x);
    }
    finally {
      this.loading$.next(false);
    }

  }

  static loadPandaJson(sGodRolls: string, weapons: GunInfo[]): MappedRoll[] {
    const gunRolls: GunRolls[] = JSON.parse(sGodRolls);
    return PerkbenchComponent.combine(gunRolls, weapons);
  }

  private static cookNameForRolls(name: string): string {
    name = name.toLowerCase();
    const suffix = ' (Adept)'.toLowerCase();
      if (name.endsWith(suffix)) {
        name = name.substring(0, name.length - suffix.length);
      }
      return name;
  }

  private static combine(gunRolls: GunRolls[], weapons: GunInfo[]): MappedRoll[] {
    const returnMe: MappedRoll[] = [];
    for (const w of weapons) {
      const name = PerkbenchComponent.cookNameForRolls(w.desc.displayProperties.name);
      const controllerRoll = gunRolls.find(x => x.name == name && x.controller);
      let mnkRoll = gunRolls.find(x => x.name == name && x.mnk);
      // we're using one roll for both, split it
      if (controllerRoll!=null &&mnkRoll === controllerRoll) {
        mnkRoll = JSON.parse(JSON.stringify(controllerRoll));
      }
      returnMe.push({
        roll: {
          controller: controllerRoll,
          mnk: mnkRoll
        },
        info: w
      });

    }
    return returnMe;
  }

  public searchChange() {

  }

  async importFromFile(fileInputEvent: any) {
    const files = fileInputEvent.target.files;
    if (files == null || files.length == 0) {
      return;
    }
    const file = files[0];
    const sJson = await MarkService.readFileAsString(file);
    console.dir(sJson);
  }


  private getWeaponDescs(): GunInfo[] {
    const guns: ManifestInventoryItem[] = [];
    // const perkCandidates = new Set<string>();
    // const gunCandidates = new Set<string>();
    // const mwCandidates = new Set<string>();
    const db = this.destinyCacheService.cache;
    for (const key of Object.keys(db.InventoryItem)) {
      const ii = db.InventoryItem[key];

      // possible perk, bucket type consumable
      if (ii.inventory.bucketTypeHash == 1469714392 || ii.inventory.bucketTypeHash == 3313201758) {
        // perkCandidates.add(ii.displayProperties.name.toLowerCase());
      } else if (ii.inventory.bucketTypeHash == 1498876634 ||
        ii.inventory.bucketTypeHash == 2465295065 ||
        ii.inventory.bucketTypeHash == 953998645) {
        // gunCandidates.add(ii.displayProperties.name.toLowerCase());
        if (ii.displayProperties?.name && ii.sockets?.socketCategories?.length > 0) {
          if (ii.itemType != ItemType.Dummy) {
            if (!ii.displayProperties.name.endsWith('(Adept)')) {
              guns.push(ii);
            }
          }
        }
      }
    }
    const gunsWithSockets: GunInfo[] = [];
    for (const desc of guns) {
      let hasRandomRoll = false;
      for (const jCat of desc.sockets.socketCategories) {
        // we only care about weapon perks
        if (jCat.socketCategoryHash != '4241085061') {
          continue;
        }
        const sockets: InventorySocket[] = [];
        for (const index of jCat.socketIndexes) {
          const socketDesc = desc.sockets.socketEntries[index];
          const possiblePlugs: InventoryPlug[] = [];
          if (socketDesc.randomizedPlugSetHash) {
            hasRandomRoll = true;
            const randomRollsDesc: any = this.destinyCacheService.cache.PlugSet[socketDesc.randomizedPlugSetHash];
            if (randomRollsDesc && randomRollsDesc.reusablePlugItems) {
              for (const option of randomRollsDesc.reusablePlugItems) {
                const plugDesc: any = this.destinyCacheService.cache.InventoryItem[option.plugItemHash];
                const plugName = plugDesc?.displayProperties?.name;
                if (plugName == null) { continue; }
                const oPlug = new InventoryPlug(plugDesc.hash,
                  plugName, plugDesc.displayProperties.description,
                  plugDesc.displayProperties.icon, false);
                oPlug.currentlyCanRoll = option.currentlyCanRoll;
                possiblePlugs.push(oPlug);
              }
            }
          }
          if (possiblePlugs.length > 0) {
            sockets.push(new InventorySocket(jCat.socketCategoryHash, [], possiblePlugs));
          }
        }
        let dmgType = DamageType[desc.damageTypes[0]];
        if (dmgType == 'Thermal') {
          dmgType = 'Solar';
        }
        const gi: GunInfo = {
          desc,
          sockets,
          type: desc.itemTypeDisplayName,
          damage: dmgType,
          season: WATERMARK_TO_SEASON[desc.iconWatermark]
        }
        if (gi.season == null) {
          gi.season = -1;
        }
        if (hasRandomRoll) {
          gunsWithSockets.push(gi);
        }

      }
    }
    return gunsWithSockets;
  }


  public exportToFile() {
    const anch: HTMLAnchorElement = document.createElement('a');
    const sMarks = JSON.stringify({});
    anch.setAttribute(
      'href',
      'data:text/csv;charset=utf-8,' + encodeURIComponent(sMarks)
    );
    anch.setAttribute('download', `d2checklist-file_${format(new Date(), 'yyyy-MM-dd')}.json`);
    anch.setAttribute('visibility', 'hidden');
    document.body.appendChild(anch);
    anch.click();
  }


  showRolls(i: MappedRoll) {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      parent: this,
      item: i,
      name: PerkbenchComponent.cookNameForRolls(i.info.desc.displayProperties.name)
    };
    const dialogRef = this.dialog.open(PerkBenchDialogComponent, dc);

    dialogRef.afterClosed().subscribe(async (result) => {
      this.filterChanged$.next(true);
    });
  }

}

export interface MappedRoll {
  roll: PlatformGunRolls;
  info: GunInfo;
}

export interface PlatformGunRolls {
  mnk: GunRolls;
  controller: GunRolls;
}

export interface GunInfo {
  desc: ManifestInventoryItem;
  sockets: InventorySocket[];
  type: string,
  damage: string;
  season: number;
}
