import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {
  DestinyCacheService,
  ManifestInventoryItem
} from '@app/service/destiny-cache.service';
import { IconService } from '@app/service/icon.service';
import { MarkService } from '@app/service/mark.service';
import {
  DamageType,
  InventoryPlug,
  InventorySocket,
  ItemType
} from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { CompleteGodRolls, CUSTOM_GOD_ROLLS, GunRoll, GunRolls, GUN_SUFFIXES, PandaGodrollsService } from '@app/service/panda-godrolls.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { environment as env } from '@env/environment';
import { format } from 'date-fns';
import { del, set } from 'idb-keyval';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { PerkBenchDialogComponent } from './perk-bench-dialog/perk-bench-dialog.component';

// TODO show guns with unrollable perks
// x offer option to apply god rolls to local storage
// x offer option to clear god rolls from local storage
// TODO clean up UI and add menu link
// TODO show current god rolls that are being used

// God bless DIM

const WATERMARK_TO_SEASON = {
  '/common/destiny2_content/icons/fb50cd68a9850bd323872be4f6be115c.png': 1,
  '/common/destiny2_content/icons/dd71a9a48c4303fd8546433d63e46cc7.png': 1,
  '/common/destiny2_content/icons/2c024f088557ca6cceae1e8030c67169.png': 2,
  '/common/destiny2_content/icons/50d36366595897d49b5d33e101c8fd07.png': 2,
  '/common/destiny2_content/icons/ed6c4762c48bd132d538ced83c1699a6.png': 3,
  '/common/destiny2_content/icons/aaa61f6c70478d87de0df41e5709a773.png': 3,
  '/common/destiny2_content/icons/1b6c8b94cec61ea42edb1e2cb6b45a31.png': 4,
  '/common/destiny2_content/icons/eb621df1be42ae5db9e8cd20eda17c44.png': 4,
  '/common/destiny2_content/icons/448f071a7637fcefb2fccf76902dcf7d.png': 5,
  '/common/destiny2_content/icons/c23c9ec8709fecad87c26b64f5b2b9f5.png': 5,
  '/common/destiny2_content/icons/1448dde4efdb57b07f5473f87c4fccd7.png': 6,
  '/common/destiny2_content/icons/e4a1a5aaeb9f65cc5276fd4d86499c70.png': 6,
  '/common/destiny2_content/icons/5364cc3900dc3615cb0c4b03c6221942.png': 7,
  '/common/destiny2_content/icons/69bb11f24279c7a270c6fac3317005b2.png': 7,
  '/common/destiny2_content/icons/2352f9d04dc842cfcdda77636335ded9.png': 8,
  '/common/destiny2_content/icons/ee3f5bb387298acbdb03c01940701e63.png': 8,
  '/common/destiny2_content/icons/e8fe681196baf74917fa3e6f125349b0.png': 8,
  '/common/destiny2_content/icons/82a8d6f2b1e4ee14e853d4ffbe031406.png': 8,
  '/common/destiny2_content/icons/3ba38a2b9538bde2b45ec9313681d617.png': 9,
  '/common/destiny2_content/icons/9b7e4bbc576fd15fbf44dfa259f8b86a.png': 9,
  '/common/destiny2_content/icons/b12630659223b53634e9f97c0a0a8305.png': 10,
  '/common/destiny2_content/icons/e27a4f39c1bb8c6f89613648afaa3e9f.png': 10,
  '/common/destiny2_content/icons/4c25426263cacf963777cd4988340838.png': 11,
  '/common/destiny2_content/icons/49dc693c5f3411b9638b97f38a70b69f.png': 11,
  '/common/destiny2_content/icons/9e0f43538efe9f8d04546b4b0af6cc43.png': 12,
  '/common/destiny2_content/icons/1f702463c5e0c4e25c9f00a730dbc6ac.png': 12,
  '/common/destiny2_content/icons/be3c0a95a8d1abc6e7c875d4294ba233.png': 12,
  '/common/destiny2_content/icons/d3cffdcb881085bc4fe19d9671c9eb0c.png': 12,
  '/common/destiny2_content/icons/0ec87dd7ef282db27e1fc337e9545cd0.png': 12,
  '/common/destiny2_content/icons/5ac4a1d48a5221993a41a5bb524eda1b.png': 13,
  '/common/destiny2_content/icons/e197b731c11556b17664b90a87dd0c11.png': 13,
  '/common/destiny2_content/icons/23968435c2095c0f8119d82ee222c672.png': 14,
  '/common/destiny2_content/icons/a9faab035e2f59f802e99641a3aaab9e.png': 14,
  '/common/destiny2_content/icons/671a19eca92ad9dcf39d4e9c92fcdf75.png': 15,
  '/common/destiny2_content/icons/d92e077d544925c4f37e564158f8f76a.png': 15,
  '/common/destiny2_content/icons/6e4fdb4800c34ccac313dd1598bd7589.png': 16,
  '/common/destiny2_content/icons/b973f89ecd631a3e3d294e98268f7134.png': 16,
  '/common/destiny2_content/icons/d05833668bcb5ae25344dd4538b1e0b2.png': 16,
  '/common/destiny2_content/icons/ab075a3679d69f40b8c2a319635d60a9.png': 17,
  '/common/destiny2_content/icons/a3923ae7d2376a1c4eb0f1f154da7565.png': 18,
  '/common/destiny2_content/icons/e775dcb3d47e3d54e0e24fbdb64b5763.png': 19,
  '/common/destiny2_content/icons/31445f1891ce9eb464ed1dcf28f43613.png': 20,
  '/common/destiny2_content/icons/af00bdcd3e3b89e6e85c1f63ebc0b4e4.png': 20,
  '/common/destiny2_content/icons/a568c77f423d1b49aeccbce0e7af79f6.png': 20,
  '/common/destiny2_content/icons/6026e9d64e8c2b19f302dafb0286897b.png': 21,
  '/common/destiny2_content/icons/3de52d90db7ee2feb086ef6665b736b6.png': 22,
  '/common/destiny2_content/icons/a2fb48090c8bc0e5785975fab9596ab5.png': 23,


  // events
  '/common/destiny2_content/icons/ad7fdb049d430c1fac1d20cf39059702.png': 101,
  '/common/destiny2_content/icons/04de56db6d59127239ed51e82d16c06c.png': 102,
  '/common/destiny2_content/icons/52523b49e5965f6f33ab86710215c676.png': 103,
  '/common/destiny2_content/icons/f80e39c767f309f0b2be625dae0e3744.png': 104,
  '/common/destiny2_content/icons/65097e226318b8581ad535b33827e01a.png': 105,
  '/common/destiny2_content/icons/8b0d9b848bfb49077fe018e6f80a2939.png': 105,
  '/common/destiny2_content/icons/d91c738e8179465a165e35f7a249701b.png': 101, // Dawning
  '/common/destiny2_content/icons/f80e5bb37ddd09573fd768af932075b4.png': 102, // Crimson
  '/common/destiny2_content/icons/24ee3aca8624643ed02b684b2f7ef78b.png': 103, // Solstice
  '/common/destiny2_content/icons/215100c99216b9c0bd83b9daa50ace45.png': 104, // Festival of the Lost
  '/common/destiny2_content/icons/0a93338035464bade265763e190b9f12.png': 105, // The Revelry
  // '/common/destiny2_content/icons/8b0d9b848bfb49077fe018e6f80a2939.png': 105,
  '/common/destiny2_content/icons/64e07aa12c7c9956ee607ccb5b3c6718.png': 106, // Guardian Games
  '/common/destiny2_content/icons/97c65a76255ef764a9a98f24e50b859d.png': 106,
  '/common/destiny2_content/icons/efdb35540cd169fa6e334995c2ce87b6.png': 106, 
};

const SEASON_TO_DESC = {
  1: 'Season of the Forge',
  2: 'Season of the Drifter',
  3: 'Season of Opulence',
  4: 'Season of Dawn',
  5: 'Season of the Worthy',
  6: 'Season of Arrivals',
  7: 'Season of the Splicer',
  8: 'Season of the Lost',
  9: 'Season of the Hunt',
  10: 'Season of the Chosen',
  11: 'Season of the Undying',
  12: 'Season of the Dawn',
  13: 'Season of the Splicer',
  14: 'Season of the Lost',
  15: 'Season of the Hunt',
  16: 'Season of the Chosen',
  17: 'Season of the Undying',
  18: 'Season of the Dawn',
  19: 'Season of the Seraph',
  20: 'Season of Defiance',
  21: 'Season of the Deep',
  22: 'Season of the Witch',
  23: 'Season of the Wish',
  24: 'Episode: Echoes',
  // #UPDATEME
  101: 'Dawning',
  102: 'Crimson Days',
  103: 'Solstice of Heroes',
  104: 'Festival of the Lost',
  105: 'The Revelry',
  106: 'Guardian Games',
};


function isSpecificRollIncomplete(g: GunRoll) {
  const hasGoodPerks = g.goodPerks?.length >= 1;
  const hasGreatPerks = g.greatPerks?.length >= 1;
  const hasMw = g.masterwork?.length >= 1;
  return !hasGoodPerks || !hasGreatPerks || !hasMw;
}

function isPlatformIncomplete(gs: GunRolls): boolean {
  if (gs == null) {
    return true;
  }
  if (!isSpecificRollIncomplete(gs.pve)) {
    return true;
  }
  if (!isSpecificRollIncomplete(gs.pvp)) {
    return true;
  }
  return false;
}

function isIncomplete(isController: boolean, roll: MappedRoll): boolean {
  if (isController && isPlatformIncomplete(roll?.roll?.controller)) {
    return true;
  }
  if (!isController && isPlatformIncomplete(roll?.roll?.mnk)) {
    return true;
  }
  return false;
}


@Component({
  selector: 'd2c-perkbench',
  templateUrl: './perkbench.component.html',
  styleUrls: ['./perkbench.component.scss'],
})
export class PerkbenchComponent extends ChildComponent {
  public isController = true;
  public sortBy = 'season';
  public sortDesc = true;
  public filterText = '';
  public currentTitle = 'asdf';
  public showMissingOnly = false;
  public showIncompleteOnly = false;
  public showOutOfDateOnly = false;
  public showWrongOnly = false;
  public filterChanged$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public rolls$: BehaviorSubject<MappedRoll[]> = new BehaviorSubject([]);
  public completeRolls$: BehaviorSubject<CompleteGodRolls | null> = new BehaviorSubject(null);
  public customGodRollsApplied$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public filteredRolls$: BehaviorSubject<MappedRoll[]> = new BehaviorSubject(
    []
  );
  public loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private weapons: GunInfo[] = [];



  constructor(
    storageService: StorageService,
    public iconService: IconService,
    public dialog: MatDialog,
    private signedOnUserService: SignedOnUserService,
    public pandaGodrollsService: PandaGodrollsService,
    private destinyCacheService: DestinyCacheService,
    private notificationService: NotificationService,
    private httpClient: HttpClient
  ) {
    super(storageService);
    this.init();
    this.isController = this.pandaGodrollsService.isController;
    combineLatest([this.filterChanged$, this.rolls$])
      .pipe(takeUntil(this.unsubscribe$), debounceTime(50))
      .subscribe(([changed, rolls]) => {
        let showMe = rolls;
        if (this.showMissingOnly) {
          showMe = showMe.filter(
            (x) =>
              x.roll == null ||
              (this.isController
                ? x.roll.controller == null || this.isEmpty(x.roll.controller)
                : x.roll.mnk == null || this.isEmpty(x.roll.mnk))
          );
        }
        if (this.showIncompleteOnly) {
          showMe = showMe.filter((x) => !isIncomplete(this.isController, x));
        }
        if (this.showOutOfDateOnly) {
          showMe = showMe.filter(x => x.defunctPerks.length > 0);
        }
        if (this.showWrongOnly) {
          showMe = showMe.filter(x => x.missingPerks.length > 0);
        }
        if (this.filterText.trim().length > 0) {
          showMe = showMe.filter(
            (x) =>
              JSON.stringify(x)
                .toLowerCase()
                .indexOf(this.filterText.toLowerCase()) >= 0
          );
        }
        showMe.sort((a, b) => {
          let aV, bV;
          if (this.sortBy == 'name') {
            aV =
              a.info.desc.displayProperties.name != null
                ? a.info.desc.displayProperties.name
                : '';
            bV =
              b.info.desc.displayProperties.name != null
                ? b.info.desc.displayProperties.name
                : '';
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
        this.filteredRolls$.next(showMe);
      });
  }

  changeConsole() {
    localStorage.setItem('perkbench-is-console', '' + this.isController);
  }

  isEmpty(roll: GunRolls): boolean {
    if (!roll.pvp) return true;
    if (!roll.pve) return true;
    return this.isGunRollEmpty(roll.pvp) || this.isGunRollEmpty(roll.pve);
  }

  isGunRollEmpty(roll: GunRoll): boolean {
    if (roll.greatPerks != null && roll.greatPerks.length > 0) return false;
    if (roll.goodPerks != null && roll.goodPerks.length > 0) return false;
    if (roll.masterwork != null && roll.masterwork.length > 0) return false;
    return true;
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
    this.weapons = await this.getWeaponDescs();
    this.load();
  }

  async fetchGodrolls(): Promise<CompleteGodRolls> {
    return await this.httpClient
      .get<CompleteGodRolls>(`/assets/panda-godrolls.min.json?v=${env.versions.app}`)
      .toPromise();
  }

  async loadOfficialRolls() {
    const gunRolls = await this.fetchGodrolls();
    this.loadPandaJson(
      JSON.stringify(gunRolls),
      this.weapons,
      false
    );
  }

  async load() {
    this.loading$.next(true);
    try {
      let gunRolls = await PandaGodrollsService.getCustomGodRolls();
      if (gunRolls) {
        this.loadPandaJson(
          JSON.stringify(gunRolls),
          this.weapons,
          true
        );
      } else {
        gunRolls = await this.fetchGodrolls();
        this.loadPandaJson(
          JSON.stringify(gunRolls),
          this.weapons,
          false
        );
      }
    } catch (x) {
      console.dir(x);
      this.notificationService.fail(x);
    } finally {
      this.loading$.next(false);
    }
  }

  async importFromFile(fileInputEvent: any) {
    const files = fileInputEvent.target.files;
    if (files == null || files.length == 0) {
      return;
    }
    const file = files[0];
    const sJson = await MarkService.readFileAsString(file);
    this.loadPandaJson(
      sJson,
      this.weapons,
      false
    );
    this.currentTitle = this.completeRolls$.getValue().title;
  }

  loadPandaJson(sGodRolls: string, weapons: GunInfo[], custom: boolean): void {
    this.loading$.next(true);
    try {
      const completeRolls: CompleteGodRolls = JSON.parse(sGodRolls);
      if (!PandaGodrollsService.isValid(completeRolls)) {
        throw new Error('Invalid JSON, must be valid D2Checklist god roll format.');
      }
      const gunRolls: GunRolls[] = completeRolls.rolls;
      const mappedRolls: MappedRoll[] = PerkbenchComponent.combine(gunRolls, weapons);
      this.rolls$.next(mappedRolls);
      this.completeRolls$.next(completeRolls);
      this.customGodRollsApplied$.next(custom);
      let name = this.signedOnUserService.signedOnUser$.getValue()?.userInfo?.displayName;
      name = name ? name : 'My';
      this.currentTitle = `${name} Godrolls`;
    } catch (x) {
      console.dir(x);
      this.notificationService.fail(x);
    } finally {
      this.loading$.next(false);
    }
  }

  private static cookNameForRolls(name: string): string {
    name = name.toLowerCase();
    for (const suffix of GUN_SUFFIXES) {
      if (name.endsWith(suffix.toLowerCase())) {
        name = name.substring(0, name.length - suffix.length);
      }
    }
    return name;
  }

  private static combine(
    gunRolls: GunRolls[],
    weapons: GunInfo[]
  ): MappedRoll[] {
    const returnMe: MappedRoll[] = [];
    for (const w of weapons) {
      const name = PerkbenchComponent.cookNameForRolls(
        w.desc.displayProperties.name
      );
      let controllerRoll: GunRolls = null;
      let mnkRoll: GunRolls = null;
      // get all the rolls, if something for mnk vs controller use the other
      // always clone rolls serving double duty
      const doubleRoll = gunRolls.find((x) => x.name == name && x.controller && x.mnk);
      if (doubleRoll) {
        controllerRoll = JSON.parse(JSON.stringify(doubleRoll));
        controllerRoll.mnk = false;
        mnkRoll = JSON.parse(JSON.stringify(doubleRoll));
        mnkRoll.controller = false;
      } else {
        controllerRoll = gunRolls.find((x) => x.name == name && x.controller);
        mnkRoll = gunRolls.find((x) => x.name == name && x.mnk);
        if (controllerRoll == null && mnkRoll != null) {
          controllerRoll = JSON.parse(JSON.stringify(mnkRoll));
          controllerRoll.mnk = false;
          controllerRoll.controller = true;
        }
        if (mnkRoll == null && controllerRoll != null) {
          mnkRoll = JSON.parse(JSON.stringify(controllerRoll));
          mnkRoll.mnk = true;
          mnkRoll.controller = false;
        }
      }
      const addMe = {
        roll: {
          controller: controllerRoll,
          mnk: mnkRoll,
        },
        info: w,
        missingPerks: [],
        defunctPerks: []
      };
      PerkbenchComponent.checkRolls(addMe);
      returnMe.push(addMe);
    }
    return returnMe;
  }

  private static checkRolls(mr: MappedRoll): void {
    this.checkRoll(mr, mr.roll.controller?.pve, mr.info);
    this.checkRoll(mr, mr.roll.controller?.pvp, mr.info);
    this.checkRoll(mr, mr.roll.mnk?.pve, mr.info);
    this.checkRoll(mr, mr.roll.mnk?.pvp, mr.info);
  }

  private static checkRoll(parent: MappedRoll, roll: GunRoll, w: GunInfo): void {
    if (!roll) {
      return;
    }
    const checkMe = roll.goodPerks.concat(roll.greatPerks);
    // map reduce concat possiblePlugs
    const allPlugs = w.sockets.map(x => x.possiblePlugs).reduce((a, b) => a.concat(b), []);
    const allPlugNames = allPlugs.map(x => x.name.toLowerCase());
    const currentCanRollPlugName = allPlugs.filter(x => x.currentlyCanRoll).map(x => x.name.toLowerCase());

    for (const c of checkMe) {
      if (allPlugNames.indexOf(c) < 0) {
        parent.missingPerks.push(c);
        console.log(`${w.desc.displayProperties.name} has missing perk: ${c}`);
      } else if (currentCanRollPlugName.indexOf(c) < 0) {
        parent.defunctPerks.push(c);
        // console.log(`${w.desc.displayProperties.name} has defunct perks: ${c}`);
      }
    }
  }

  private static rebuildRolls(mappedRolls: MappedRoll[]): GunRolls[] {
    const returnMe: GunRolls[] = [];

    const loaded = {};
    for (const mr of mappedRolls) {
      if (!mr.roll) {
        continue;
      }
      if (mr.roll.controller) {
        const key = `${mr.roll.controller.name}-controller`;
        if (loaded[key]) {
          console.log(`%c    Skipping duplicate for ${key}`);
        } else {
          loaded[key] = true;
          returnMe.push(mr.roll.controller);
        }
      }
      if (mr.roll.mnk) {
        const key = `${mr.roll.controller.name}-mnk`;
        if (loaded[key]) {
          console.log(`%c    Skipping duplicate for ${key}`);
        } else {
          loaded[key] = true;
          returnMe.push(mr.roll.mnk);
        }
      }
    }
    return returnMe;
  }

  private buildRollJson(): CompleteGodRolls {
    const newRolls = PerkbenchComponent.rebuildRolls(this.rolls$.getValue());
    // sort newRolls by name ascending and also always have mnk first then controller
    newRolls.sort((a, b) => {
      if (a.name == b.name) {
        if (a.mnk && !b.mnk) {
          return 1;
        } else if (!a.mnk && b.mnk) {
          return -1;
        } else {
          return 0;
        }
      } else {
        return a.name.localeCompare(b.name);
      }
    });
    const downloadMe: CompleteGodRolls = {
      title: this.currentTitle,
      date: new Date().toISOString(),
      manifestVersion: this.destinyCacheService.cacheLite.version,
      rolls: newRolls
    };
    return downloadMe;
  }


  private async getWeaponDescs(): Promise<GunInfo[]> {
    const guns: ManifestInventoryItem[] = [];
    const dbInvItem = await this.destinyCacheService.getInventoryItemTable();

    for (const key of Object.keys(dbInvItem)) {
      const ii = dbInvItem[key];
      // possible perk, bucket type consumable
      if (
        ii.inventory.bucketTypeHash == 1469714392 ||
        ii.inventory.bucketTypeHash == 3313201758
      ) {
        // perkCandidates.add(ii.displayProperties.name.toLowerCase());
      } else if (
        ii.inventory.bucketTypeHash == 1498876634 ||
        ii.inventory.bucketTypeHash == 2465295065 ||
        ii.inventory.bucketTypeHash == 953998645
      ) {
        // gunCandidates.add(ii.displayProperties.name.toLowerCase());
        if (
          ii.displayProperties?.name &&
          ii.sockets?.socketCategories?.length > 0
        ) {
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
            const randomRollsDesc: any = await this.destinyCacheService.getPlugSet(socketDesc.randomizedPlugSetHash);
            if (randomRollsDesc && randomRollsDesc.reusablePlugItems) {
              for (const option of randomRollsDesc.reusablePlugItems) {
                const plugDesc: any = await this.destinyCacheService.getInventoryItem(option.plugItemHash);
                const plugName = plugDesc?.displayProperties?.name;
                if (plugName == null) {
                  continue;
                }
                const oPlug = new InventoryPlug(
                  plugDesc.hash,
                  plugName,
                  plugDesc.displayProperties.description,
                  plugDesc.displayProperties.icon,
                  false, plugDesc.plug.energyCost,
                  plugDesc.itemTypeDisplayName
                );
                oPlug.currentlyCanRoll = option.currentlyCanRoll;
                possiblePlugs.push(oPlug);
              }
            }
          } else if (socketDesc.singleInitialItemHash && !(socketDesc.socketTypeHash == 1282012138)) {
            const plugDesc: any = await this.destinyCacheService.getInventoryItem(socketDesc.singleInitialItemHash);
            const plugName = plugDesc?.displayProperties?.name;
            if (plugName == null) { continue; }
            const oPlug = new InventoryPlug(plugDesc.hash,
              plugName, plugDesc.displayProperties.description,
              plugDesc.displayProperties.icon, false, plugDesc.plug.energyCost,
              plugDesc.itemTypeDisplayName);
            oPlug.currentlyCanRoll = true;
            possiblePlugs.push(oPlug);

          }
          if (possiblePlugs.length > 0) {
            sockets.push(
              new InventorySocket(jCat.socketCategoryHash, [], [], possiblePlugs, index, null)
            );
          }
        }
        let dmgType = DamageType[desc.damageTypes[0]];
        if (dmgType == 'Thermal') {
          dmgType = 'Solar';
        }
        const season = WATERMARK_TO_SEASON[desc.iconWatermark]
        const gi: GunInfo = {
          desc,
          sockets,
          type: desc.itemTypeDisplayName,
          damage: dmgType,
          season,
          seasonDesc: SEASON_TO_DESC[season]?.toLowerCase() ?? 'unknown',
        };
        if (gi.season == null) {
          gi.season = -1;
          if (desc.iconWatermark) {
            console.log(`Unmapped watermark: ${desc.displayProperties.name} ${desc.iconWatermark}`);
          }
        }
        if (hasRandomRoll) {
          const existing = gunsWithSockets.find(x => x.desc.displayProperties.name == gi.desc.displayProperties.name);
          if (existing) {
            // make the most recent gun the golden copy, (not sure this matters)
            let source = gi;
            let target = existing;
            if (gi.season > existing.season) {
              gunsWithSockets.splice(gunsWithSockets.indexOf(existing), 1);
              gunsWithSockets.push(gi);
              source = existing;
              target = gi;
            } else {
              source = gi;
              target = existing;
            }
            console.log(`--- Merging ${source.desc.displayProperties.name} from season ${source.season} into existing gun from ${target.season}`);
            PerkbenchComponent.mergeGuns(target, source);
          } else {
            gunsWithSockets.push(gi);
          }
        }
      }
    }
    return gunsWithSockets;
  }
  private static mergeGuns(target: GunInfo, source: GunInfo) {
    const socketsToCompareCount = Math.min(target.sockets.length, source.sockets.length)

    for (let i = 0; i < socketsToCompareCount; i++) {
      const targetSocket = target.sockets[i];
      const sourceSocket = source.sockets[i];
      // add all plugs from source to target
      for (const plug of sourceSocket.possiblePlugs) {
        targetSocket
        if (!targetSocket.possiblePlugs.find(x => x.name == plug.name)) {
          targetSocket.possiblePlugs.push(plug);
        }
      }
    }
  }

  public exportToFile() {
    const anch: HTMLAnchorElement = document.createElement('a');
    const sMarks = JSON.stringify(this.buildRollJson(), null, 2);
    anch.setAttribute(
      'href',
      'data:application/json;charset=utf-8,' + encodeURIComponent(sMarks)
    );
    anch.setAttribute(
      'download',
      `d2checklist-file_${format(new Date(), 'yyyy-MM-dd')}.json`
    );
    anch.setAttribute('visibility', 'hidden');
    document.body.appendChild(anch);
    anch.click();
  }

  public applyCurrentRolls() {
    const rolls = this.buildRollJson();
    set(CUSTOM_GOD_ROLLS, rolls);
    this.notificationService.success(`Using your custom god rolls on this browser.`);
    this.load();
    // refresh rolls
    this.pandaGodrollsService.reload();
  }

  public clearCustomRolls() {
    del(CUSTOM_GOD_ROLLS);
    this.load();
    // refresh rolls
    this.pandaGodrollsService.reload();
  }


  showRolls(i: MappedRoll) {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      parent: this,
      item: i,
      name: PerkbenchComponent.cookNameForRolls(
        i.info.desc.displayProperties.name
      ),
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
  defunctPerks: string[];
  missingPerks: string[];
}

export interface PlatformGunRolls {
  mnk: GunRolls;
  controller: GunRolls;
}

export interface GunInfo {
  desc: ManifestInventoryItem;
  sockets: InventorySocket[];
  type: string;
  damage: string;
  season: number;
  seasonDesc: string;
}
