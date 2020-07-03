import { Component, Input, OnInit } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { Const, MilestoneStatus } from '@app/service/model';



@Component({
  selector: 'd2c-milestone-check',
  templateUrl: './milestone-check.component.html',
  styleUrls: ['./milestone-check.component.scss']
})
export class MilestoneCheckComponent implements OnInit {
  public Const = Const;

  @Input('milestoneStatus') milestone: MilestoneStatus
  @Input() detailed: boolean = false;

  constructor(public iconService: IconService) { }

  ngOnInit() {
  }

}
