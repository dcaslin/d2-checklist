import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../player-state.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-pursuits',
  templateUrl: './pursuits.component.html',
  styleUrls: ['./pursuits.component.scss']
})
export class PursuitsComponent extends ChildComponent {

  constructor(
    storageService: StorageService,
    public state: PlayerStateService,
    public dialog: MatDialog, 
    public iconService: IconService) {
    super(storageService);

  }


  

}
