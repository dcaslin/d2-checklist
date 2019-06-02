import { Component, OnInit, ChangeDetectorRef, Input, ChangeDetectionStrategy } from '@angular/core';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';
import { Player, Character } from '@app/service/model';
import { Router } from '@angular/router';

@Component({
  selector: 'anms-chars',
  templateUrl: './chars.component.html',
  styleUrls: ['./chars.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharsComponent extends ChildComponent implements OnInit {
  @Input() player: Player;

  constructor(
    storageService: StorageService,
    private ref: ChangeDetectorRef, 
    private router: Router) { 
      super(storageService, ref);

    }

    public history(c: Character) {
      this.router.navigate(['/history', c.membershipType, c.membershipId, c.characterId]);
    }
  

  ngOnInit() {
  }

}
