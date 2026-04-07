import { Component } from '@angular/core';
import { isSearchBot } from '@app/shared/utilities';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'd2c-robot-home',
    templateUrl: './robot-home.component.html',
    styleUrls: ['./robot-home.component.scss'],
    imports: [RouterLink]
})
export class RobotHomeComponent {

  public searchBot = isSearchBot();

}
