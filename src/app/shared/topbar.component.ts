import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <header class="ipe-topbar">
      <div>
        <h2>{{ titulo }}</h2>
        <p class="ipe-topbar__sub" *ngIf="subtitulo">{{ subtitulo }}</p>
      </div>
      <div class="ipe-topbar__spacer"></div>
      <div class="ipe-topbar__actions">
        <ng-content></ng-content>
      </div>
    </header>
  `
})
export class TopbarComponent {
  @Input() titulo = '';
  @Input() subtitulo = '';
}
