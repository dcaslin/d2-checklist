import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { MarkService } from '@app/service/mark.service';
import { NotificationService } from '@app/service/notification.service';
import { StorageService } from '@app/service/storage.service';
import { GunRolls } from '@app/service/panda-godrolls.service';
import { ChildComponent } from '@app/shared/child.component';
import { format } from 'date-fns';
import { BehaviorSubject } from 'rxjs';
import { ro } from 'date-fns/locale';
import { DestinyCacheService, ManifestInventoryItem } from '@app/service/destiny-cache.service';
import { DamageType, InventoryPlug, InventorySocket, ItemType } from '@app/service/model';

@Component({
  selector: 'd2c-perkbench',
  templateUrl: './perkbench.component.html',
  styleUrls: ['./perkbench.component.scss']
})
export class PerkbenchComponent extends ChildComponent implements OnInit {
  public rolls$: BehaviorSubject<MappedRoll[]> = new BehaviorSubject([]);
  public loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private weapons: GunInfo[] = [];


  constructor(storageService: StorageService,
    public iconService: IconService,
    private destinyCacheService: DestinyCacheService,
    private notificationService: NotificationService,
    private httpClient: HttpClient
  ) {
    super(storageService);
    this.init();
  }

  ngOnInit(): void {
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

  private static combine(gunRolls: GunRolls[], weapons: GunInfo[]): MappedRoll[] {
    const returnMe: MappedRoll[] = [];
    for (const w of weapons) {
      let name = w.desc.displayProperties.name.toLowerCase();
      const suffix = ' (Adept)'.toLowerCase();
      if (name.endsWith(suffix)) {
        name = name.substring(0, name.length - suffix.length);
      }
      const g = gunRolls.find(x => x.name == name);
      returnMe.push({
        roll: g,
        info: w
      });

    }
    return returnMe;
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
          if (ii.itemType!=ItemType.Dummy) {
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
        const gi: GunInfo = {
          desc,
          sockets,
          bucket: this.destinyCacheService.cache.InventoryBucket[desc.inventory.bucketTypeHash].displayProperties.name,
          damage: DamageType[desc.defaultDamageType]
        }
        if (hasRandomRoll) {
          gunsWithSockets.push(gi);
        }
        
      }
    }

    // for (const key of Object.keys(db.Stat)) {
    //   const stat = db.Stat[key];
    //   mwCandidates.add(stat.displayProperties.name.toLowerCase());
    // }
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

}

interface MappedRoll {
  roll: GunRolls;
  info: GunInfo;
}

interface GunInfo {
  desc: ManifestInventoryItem;
  sockets: InventorySocket[];
  bucket: string,
  damage: string;
}
