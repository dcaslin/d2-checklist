import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PlayerAggHistoryEntry } from '@app/clan/clan-state.service';
import { ChartConfiguration, ChartData, ChartType, ScatterDataPoint } from 'chart.js';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-clan-lifetime-graph',
  templateUrl: './clan-lifetime-graph.component.html',
  styleUrls: ['./clan-lifetime-graph.component.scss']
})
export class ClanLifetimeGraphComponent {
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
            const point: PlayerAggHistoryEntry = row.z as PlayerAggHistoryEntry;
            
          const hrs = (point.data.activitySecondsPlayed / (60 * 60)).toFixed(1);
          return [point.member.destinyUserInfo.displayName, 
            point.data.activityCompletions + ' clears',
            hrs + ' hrs'];
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

  @Input()
  set data(all: PlayerAggHistoryEntry[]) {
    this.scatterChartData.labels = [];
    const data = [];
    for (const pt of all) {
      const comp = pt.data.activityCompletions;
      const hours = pt.data.activitySecondsPlayed / (60 * 60);
      data.push({
        x: hours,
        y: comp,
        z: pt
      });
    }
    this.scatterChartData.datasets = [
      {
        pointRadius: 7,
        pointHoverRadius: 9,
        data: data,
        label: 'Members'
      }
    ];
  }  

}

interface ScatterCube extends ScatterDataPoint {
  z: PlayerAggHistoryEntry;
}