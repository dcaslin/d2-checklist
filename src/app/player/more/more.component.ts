import { Component, OnInit } from '@angular/core';
import { IconService } from '@app/service/icon.service';

@Component({
  selector: 'd2c-more',
  templateUrl: './more.component.html',
  styleUrls: ['./more.component.scss']
})
export class MoreComponent implements OnInit {

  constructor(public iconService: IconService) { }

  ngOnInit() {
  }

}
