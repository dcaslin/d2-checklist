import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PlayerStateService } from '@app/player/player-state.service';
import { AggHistoryEntry } from '@app/service/model';
import { ChartConfiguration, ChartData, ChartType, ScatterDataPoint } from 'chart.js';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-player-efficiency-graph',
  templateUrl: './player-efficiency-graph.component.html',
  styleUrls: ['./player-efficiency-graph.component.scss']
})
export class PlayerEfficiencyGraphComponent {
  public scatterChartType: ChartType = 'scatter';
  public scatterChartData: ChartData<'scatter'> = {
    labels: [],
    datasets: []
  }
  

  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,    
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            const row: ScatterCube = context.dataset.data[context.dataIndex] as ScatterCube;            
            const point: AggHistoryEntry = row.z as AggHistoryEntry;
            const sEff = point.efficiency.toFixed(2);
            return [point.name, sEff + ' clear/hr'];
          }
        }
      }
    },    
    scales: {
      x: {
        title: {
          display: true,
          text: 'Hours'
        },
        ticks: {
          callback: function (tick) {
            return tick.toString() + ' hr';
          }
        },
      },
      y: {
        title: {
          display: true,
          text: 'Completions'
        },
        ticks: {}
      },
    }    
  };


  constructor(public state: PlayerStateService,
  ) {

    const player = state.currPlayer();
    if (!player || !player.aggHistory) {
      return;
    }

    const data: ScatterCube[] = [];
    for (const a of player.aggHistory) {
      const comp = a.activityCompletions;
      const hours = a.activitySecondsPlayed / (60 * 60);
      data.push({
        x: hours,
        y: comp,
        z: a
      });
    }
    this.scatterChartData.datasets = [
      {
        pointRadius: 7,
        pointHoverRadius: 9,
        data: data,
        label: 'Activities'
      }
    ];
  }

}

interface ScatterCube extends ScatterDataPoint {
  z: AggHistoryEntry;
}