import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { ItemType } from '@app/service/model';

@Component({
  selector: 'anms-gear-toggle',
  templateUrl: './gear-toggle.component.html',
  styleUrls: ['./gear.component.scss']
})
export class GearToggleComponent implements OnInit {
  _currentItemType: ItemType;
  hidden: boolean; 

  @Input()
  set currentItemType(currentItemType: ItemType) {
    this._currentItemType = currentItemType;
    this.checkDisplay();
  }
 
  @Input()
  displayOptions: ItemType[];

  @Input()
  choices: Choice[];

  @Input()
  iconClass: string;

  @Input()
  title: string;

  @Output() change = new EventEmitter<ToggleInfo>();



  ngOnInit(){
    this.checkDisplay();
  }

  private emit(){
    this.change.emit({
      title: this.title,
      hidden: this.hidden,
      choices: this.choices
    }); 
  }

  private checkDisplay(){
    if (this.displayOptions!=null && this.displayOptions.length>0){
      if (this.displayOptions.indexOf(this._currentItemType)>=0){
        this.hidden = false;
      }
      else{
        this.hidden = true;
      }
      this.emit();
   }
  }

  isAllSelected(){
    for (const ch of this.choices){
      if (!ch.value) return false;
    } 
    return true;
  }

  selectAll(noEmit?:boolean) {
    for (const ch of this.choices){
      ch.value = true;
    }
    if (!noEmit)
      this.emit();
  }

  exclusiveSelect(choice) {
    for (const ch of this.choices){
      if (ch !== choice)
        ch.value = false;
    }
    choice.value = true;
    this.emit();
  }

  select(event, choice) {
    choice.value = !choice.value;
    this.change.emit();
    event.stopPropagation();
  }

  public isChosen(val: any): boolean {
    if (this.hidden==true) return true;
    if (this.choices.length==null || this.choices.length==0) return true;
    for (const c of this.choices){
      if (c.value==true && c.matchValue == val) return true;
    }
    return false;
  }

  public getNotes(): string{
    if (this.hidden==true) return null;
    if (this.choices.length==null || this.choices.length==0) return null;
    if (this.isAllSelected()) return null;
    let s = this.title+": \n";
    for (const c of this.choices){
      if (c.value==false ){
        s+="    "+c.display+"\n";
      }
    }
    return s;
  }
}

export interface ToggleInfo {
  title: string;
  hidden: boolean;
  choices: Choice[];
}

export class Choice {
  readonly matchValue: string;
  readonly display: string;
  public value = true;

  constructor(matchValue: string, display: string, value?: boolean) {
    this.matchValue = matchValue;
    this.display = display;
    if (value!=undefined) this.value = value;
  }
}
