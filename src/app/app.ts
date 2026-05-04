import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import Collection from '@arcgis/core/core/Collection.js';
import '@arcgis/map-components/components/arcgis-map';
import '@arcgis/map-components/components/arcgis-zoom';
import '@arcgis/map-components/components/arcgis-elevation-profile';
import '@esri/calcite-components/components/calcite-shell';
import '@esri/calcite-components/components/calcite-navigation';
import '@esri/calcite-components/components/calcite-navigation-logo';
import '@esri/calcite-components/components/calcite-shell-panel';
import '@esri/calcite-components/components/calcite-panel';

type ArcgisMapEl = HTMLElement & { view?: __esri.MapView };
type ArcgisElevationEl = HTMLElement & {
  view?: __esri.MapView;
  profiles?: __esri.Collection<__esri.ElevationProfileElevationProfileLineGround>;
};

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class App {
  private readonly destroyRef = inject(DestroyRef);
  private readonly mapHost = viewChild.required<ElementRef<HTMLElement>>('mapHost');
  private readonly epHost = viewChild.required<ElementRef<HTMLElement>>('epHost');

  constructor() {
    afterNextRender(() => void this.linkElevationToMap());
  }

  private async linkElevationToMap(): Promise<void> {
    await customElements.whenDefined('arcgis-map');
    await customElements.whenDefined('arcgis-elevation-profile');

    const mapEl = this.mapHost().nativeElement as ArcgisMapEl;
    const epEl = this.epHost().nativeElement as ArcgisElevationEl;

    const sync = () => {
      const view = mapEl.view;
      if (!view || epEl.view === view) {
        return;
      }
      epEl.view = view;
      epEl.profiles = new Collection([{ type: 'ground' }]);
    };

    mapEl.addEventListener('arcgisViewReadyChange', sync);
    this.destroyRef.onDestroy(() =>
      mapEl.removeEventListener('arcgisViewReadyChange', sync)
    );
    requestAnimationFrame(() => requestAnimationFrame(sync));
  }
}
