import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { Character, InventoryItem, Player } from '@app/service/model';
import { BehaviorSubject } from 'rxjs';
import { GearComponent } from '../gear.component';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-season-breakdown-dialog',
  templateUrl: './season-breakdown-dialog.component.html',
  styleUrls: ['./season-breakdown-dialog.component.scss']
})
export class SeasonBreakdownDialogComponent {
  parent: GearComponent;
  chars: CharSeasons[];

  constructor(
    public iconService: IconService,
    public dialogRef: MatDialogRef<SeasonBreakdownDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.parent = data.parent;
    const player = this.parent.player$.getValue();
    this.chars = SeasonBreakdownDialogComponent.generateTable(player);
  }

  showBundle(items: ItemBundle) {
    if (items.items.length == 0) {
      return;
    }
    const dialogRef = this.parent.openGearDialog(items.items[0], items.items, true);
    dialogRef.afterClosed().subscribe(result => {
      SeasonBreakdownDialogComponent.fillinTable(this.parent.player$.getValue(), this.chars);
    });
  }

  private static fillinTable(player: Player, chars: CharSeasons[]) {
    for (const charSeasons of chars) {
      const charGear = player.gear.filter(g => (g.classAllowed == charSeasons.char.classType && g.tier != 'Exotic') );
      for (const season of charSeasons._seasons.getValue()) {
        season.buckets = [];
        let seasonGear: InventoryItem[];
        if (season.season == 0) {
          seasonGear = charGear;
        } else {
          seasonGear = charGear.filter(g => g.coveredSeasons && g.coveredSeasons.includes(season.season));
        }
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
      { name: 'Any', details: true, season: 0, note: 'Everything in one place' },
      { name: 'Artifice', details: true, season: 10, note: 'Artifice mod slot' },
      { name: 'Raid SE', details: true, season: 8, note: 'Salvation\'s Edge dedicated' },
      { name: 'Raid KF', details: true, season: 6, note: 'King\'s Fall dedicated' },
      { name: 'Raid VoD', details: true, season: 5, note: 'Vow of the Disciple dedicated' },
      { name: 'Raid VoG', details: true, season: 4, note: 'Vault of Glass dedicated' },
      { name: 'Raid DSC', details: true, season: 3, note: 'Deepstone Crypt dedicated' },
      { name: 'Raid GoS', details: true, season: 2, note: 'Garden of Salvation dedicated' },
      { name: 'Raid Last Wish', details: true, season: 1, note: 'Last Wish dedicated' },
    ];
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

  constructor(name: string, items: InventoryItem[]) {
    this.name = name;
    this.all = new ItemBundle(items);
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

interface DisplayProperties {
  description?: string;
  icon: string;
  name: string;
}
