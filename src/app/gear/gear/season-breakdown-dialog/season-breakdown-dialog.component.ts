import { Component, Inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { GearComponent } from '../gear.component';
import { Character, InventoryPlug, Player, InventoryItem, EnergyType } from '@app/service/model';
import { trigger, transition, style, animate } from '@angular/animations';
import { BehaviorSubject } from 'rxjs';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { DisplayProperties } from '@app/todo-list/interfaces/api.interface';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-season-breakdown-dialog',
  templateUrl: './season-breakdown-dialog.component.html',
  styleUrls: ['./season-breakdown-dialog.component.scss']
})
export class SeasonBreakdownDialogComponent {
  parent: GearComponent;
  chars: CharSeasons[];
  mats: Mat[];

  constructor(
    public iconService: IconService,
    public destinyCacheService: DestinyCacheService,
    public dialogRef: MatDialogRef<SeasonBreakdownDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.parent = data.parent;
    const player = this.parent._player.getValue();
    this.chars = SeasonBreakdownDialogComponent.generateTable(player);
    this.mats = this.generateMats(player);
  }

  showBundle(items: ItemBundle) {
    if (items.items.length == 0) {
      return;
    }
    const dialogRef = this.parent.openGearDialog(items.items[0], items.items, true);
    dialogRef.afterClosed().subscribe(result => {
      SeasonBreakdownDialogComponent.fillinTable(this.parent._player.getValue(), this.chars);
    });
  }

  private static fillinTable(player: Player, chars: CharSeasons[]) {
    for (const charSeasons of chars) {
      const charGear = player.gear.filter(g => (g.classAllowed == charSeasons.char.classType && g.tier != 'Exotic') );
      for (const season of charSeasons._seasons.getValue()) {
        season.buckets = [];
        const seasonGear = charGear.filter(g => g.coveredSeasons && g.coveredSeasons.includes(season.season));
        const helmets = seasonGear.filter(g => g.inventoryBucket.displayProperties.name == 'Helmet');
        season.buckets.push(new SeasonBucket('Helmet', helmets));
        const arms = seasonGear.filter(g => g.inventoryBucket.displayProperties.name == 'Gauntlets');
        season.buckets.push(new SeasonBucket('Arms', arms));
        const chests = seasonGear.filter(g => g.inventoryBucket.displayProperties.name == 'Chest Armor');
        season.buckets.push(new SeasonBucket('Chest', chests));
        const legs = seasonGear.filter(g => g.inventoryBucket.displayProperties.name == 'Leg Armor');
        season.buckets.push(new SeasonBucket('Legs', legs));
        const classItems = seasonGear.filter(g => g.inventoryBucket.displayProperties.name == 'Class Armor');
        season.buckets.push(new SeasonBucket('Class', classItems));
      }
      charSeasons._seasons.next(charSeasons._seasons.getValue());
    }
  }

  private static generateTable(player: Player): CharSeasons[] {
    const chars: CharSeasons[] = [];
    for (const char of player.characters) {
      const charSeasons: CharSeasons = {
        char,
        _seasons: new BehaviorSubject(SeasonBreakdownDialogComponent.generateSeasons())
      };
      chars.push(charSeasons);
    }
    SeasonBreakdownDialogComponent.fillinTable(player, chars);
    return chars;
  }

  private static generateSeasons(): SeasonRow[] {
    return [
      { name: 'Combat', details: true, season: 0, note: 'Charged w/ Light + Warmind' },
      { name: 'Raid VoG', details: true, season: 4, note: 'Vault of Glass dedicated' },
      { name: 'Raid DSC', details: true, season: 3, note: 'Deepstone Crypt dedicated' },
      { name: 'Raid GoS', details: true, season: 2, note: 'Garden of Salvation dedicated' },
      { name: 'Raid Last Wish', details: true, season: 1, note: 'Last Wish dedicated' },
    ];
  }


  private generateMats(player: Player): Mat[] {
    const mats = [];
    const cores = this.calcMat(player.gear, '3853748946');
    const prisms = this.calcMat(player.gear, '4257549984');
    const shards = this.calcMat(player.gear, '4257549985');
    mats.push(cores);
    mats.push(prisms);
    mats.push(shards);
    return mats;
  }

  private calcMat(gear: InventoryItem[], hash: string): Mat {
    const matches = gear.filter(g => g.hash == hash);
    const sum = matches.reduce((total, prism) => {
      return total + prism.quantity;
    }, 0);

    const invItem = this.destinyCacheService.cache.InventoryItem[hash];
    return {
      displayProperties: invItem.displayProperties,
      total: sum
    };
  }
}
interface CharSeasons {
  char: Character;
  _seasons: BehaviorSubject<SeasonRow[]>;
}

interface SeasonRow {
  name: string;
  season: number;
  details: boolean;
  note: string;
  buckets?: SeasonBucket[];
}


class SeasonBucket {
  name: string;
  all: ItemBundle;
  arc: ItemBundle;
  solar: ItemBundle;
  void: ItemBundle;

  constructor(name: string, items: InventoryItem[]) {
    this.name = name;
    this.all = new ItemBundle(items);
    this.arc = new ItemBundle(items.filter(i => i.energyType == EnergyType.Arc));
    this.solar = new ItemBundle(items.filter(i => i.energyType == EnergyType.Thermal));
    this.void = new ItemBundle(items.filter(i => i.energyType == EnergyType.Void));
  }
}

class ItemBundle {
  items: InventoryItem[];
  keep: number;

  constructor(items: InventoryItem[]) {
    this.items = items;
    this.keep = items.filter(i => i.mark == 'keep' || i.mark == 'upgrade').length;
  }
}

interface Mat {
  displayProperties: DisplayProperties;
  total: number;
}