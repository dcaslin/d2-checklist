import { Component} from '@angular/core';
import { LeaderboardComponent } from './leaderboard.component';

@Component({
  selector: 'anms-leviathan-prestige',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeviathanPrestigeComponent extends LeaderboardComponent {

    getName(): string {
        return 'Leviathan Prestige Raid Leaderboard';
    }

    getAssetPath(): string {
        return '/assets/leviathan2.json';
    }

}
