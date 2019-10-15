import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { InventoryItem, InventoryPlug } from '@app/service/model';
import { MatDialogRef, MAT_DIALOG_DATA, MatCheckboxChange } from '@angular/material';
import { GearComponent } from '../gear/gear.component';
import { NotificationService } from '@app/service/notification.service';
import { ClipboardService } from 'ngx-clipboard';

@Component({
  selector: 'd2c-possible-rolls-dialog',
  templateUrl: './possible-rolls-dialog.component.html',
  styleUrls: ['../gear/gear.component.scss']

})
export class PossibleRollsDialogComponent implements OnInit {

  item: InventoryItem;
  parent: GearComponent;
  godrolls: string[] = [];
  constructor(
    private clipboardService: ClipboardService,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<PossibleRollsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.item = data.item;
    this.parent = data.parent;
    this.generateString();
  }

  private static flattenPermutations(array: InventoryPlug[][]): InventoryPlug[][] {
    if (array.length === 0) {
      return [];
    }
    if (array.length === 1) {
       return array[0].map(el => [el]);
    }
    const mutations = PossibleRollsDialogComponent.flattenPermutations(array.slice(1));
    const result = [];
    for (const el of array[0]) {
      for (const rest of mutations) {
        result.push([el, ...rest]);
      }
    }
    return result;
 }

  private toRollString(roll: InventoryPlug[]): string {
    // let s1 = "// "+this.item.name;
    // dimwishlist:item=640114618&perks=4090651448,3177308360,1015611457
    let s = 'dimwishlist:item=' + this.item.hash + '&perks=';
    for (const r of roll) {
      s += r.hash + ',';
    }
    if (s.endsWith(',')) {
      s = s.substr(0, s.length - 1);
    }
    return s;
  }


  private generateString() {
    const chosenPlugs: InventoryPlug[][] = [];
    for (const s of this.item.sockets) {
      const selected = [];
      if (!s.possiblePlugs || s.possiblePlugs.length == 0) {
        continue;
      }
      for (const p of s.possiblePlugs) {
        if (p.selectedPossible) {
          selected.push(p);
        }
      }
      if (selected.length > 0) {
        chosenPlugs.push(selected);
      }
    }
    const flatRolls = PossibleRollsDialogComponent.flattenPermutations(chosenPlugs);
    if (flatRolls.length==0) {
      this.godrolls = [];
      return;
    }
    const returnMe = [];
    const header = '//' + this.item.name;
    returnMe.push(header);
    for (const r of flatRolls) {
      const s = this.toRollString(r);
      returnMe.push(s);
    }
    this.godrolls = returnMe;
  }

  copyToClipboard() {
    let s = '';
    for (const g of this.godrolls) {
      s = s + '\n' + g;
    }
    this.clipboardService.copyFromContent(s);
    this.notificationService.success('Copied to clipboard');
  }

  ngOnInit() {
  }

}
