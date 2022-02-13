import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { Const, MilestoneStatus } from '@app/service/model';



@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-milestone-check',
  templateUrl: './milestone-check.component.html',
  styleUrls: ['./milestone-check.component.scss']
})
export class MilestoneCheckComponent {
  public Const = Const;

  @Input() milestone: MilestoneStatus;
  @Input() detailed = false;

  constructor(public iconService: IconService) { }

  

}
