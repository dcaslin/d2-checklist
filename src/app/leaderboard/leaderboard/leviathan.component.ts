import { Component} from '@angular/core';
import { LeaderboardComponent } from './leaderboard.component';

@Component({
  selector: 'anms-leviathan-prestige',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeviathanComponent extends LeaderboardComponent {

    getName(): string {
        return 'Leviathan Raid Leaderboard';
    }

    getAssetPath(): string {
        return '/assets/leviathan.json';
    }

}
