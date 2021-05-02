import { Component, OnInit } from '@angular/core';
import { isSearchBot } from '@app/shared/utilities';

@Component({
  selector: 'd2c-robot-home',
  templateUrl: './robot-home.component.html',
  styleUrls: ['./robot-home.component.scss']
})
export class RobotHomeComponent implements OnInit {

  public searchBot = isSearchBot();
  constructor() { }

  ngOnInit(): void {
  }

}
