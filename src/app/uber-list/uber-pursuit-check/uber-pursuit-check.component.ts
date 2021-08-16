import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { PursuitTuple } from '@app/service/model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-uber-pursuit-check',
  templateUrl: './uber-pursuit-check.component.html',
  styleUrls: ['./uber-pursuit-check.component.scss']
})
export class UberPursuitCheckComponent implements OnInit {
  @Input() pursuit: PursuitTuple;

  constructor(public iconService: IconService) { }

  ngOnInit(): void {
  }

}
