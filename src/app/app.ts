import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import Collection from '@arcgis/core/core/Collection.js';
import '@arcgis/map-components/components/arcgis-map';
import '@arcgis/map-components/components/arcgis-scene';
import '@arcgis/map-components/components/arcgis-zoom';
import '@arcgis/map-components/components/arcgis-elevation-profile';
import '@esri/calcite-components/components/calcite-shell';
import '@esri/calcite-components/components/calcite-navigation';
import '@esri/calcite-components/components/calcite-navigation-logo';
import '@esri/calcite-components/components/calcite-button';
import '@esri/calcite-components/components/calcite-shell-panel';
import '@esri/calcite-components/components/calcite-panel';

type ViewMode = '2d' | '3d';
type ArcgisViewEl = HTMLElement & {
  view?: __esri.MapView | __esri.SceneView;
  viewpoint?: __esri.Viewpoint;
};
type ArcgisElevationEl = HTMLElement & {
  view?: __esri.MapView | __esri.SceneView;
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
  private readonly mapHost = viewChild<ElementRef<HTMLElement>>('mapHost');
  private readonly sceneHost = viewChild<ElementRef<HTMLElement>>('sceneHost');
  private readonly epHost = viewChild.required<ElementRef<HTMLElement>>('epHost');

  protected readonly viewMode = signal<ViewMode>('2d');

  private lastViewpoint: __esri.Viewpoint | null = null;
  private removeViewReadyListener: (() => void) | null = null;

  constructor() {
    afterNextRender(() => void this.linkElevationToActiveView());
    effect(() => {
      // Re-link on view mode changes (2D <-> 3D)
      this.viewMode();
      queueMicrotask(() => void this.linkElevationToActiveView());
    });
  }

  protected setViewMode(nextValue: ViewMode): void {
    if (nextValue === this.viewMode()) {
      return;
    }

    this.captureLastViewpoint();
    this.viewMode.set(nextValue);
  }

  private getActiveViewEl(): ArcgisViewEl | null {
    const host =
      this.viewMode() === '3d'
        ? this.sceneHost()?.nativeElement
        : this.mapHost()?.nativeElement;

    return (host as ArcgisViewEl | undefined) ?? null;
  }

  private captureLastViewpoint(): void {
    const viewEl = this.getActiveViewEl();
    const viewpoint = viewEl?.view?.viewpoint;
    this.lastViewpoint = viewpoint ? viewpoint.clone() : null;
  }

  private async linkElevationToActiveView(): Promise<void> {
    await customElements.whenDefined('arcgis-map');
    await customElements.whenDefined('arcgis-scene');
    await customElements.whenDefined('arcgis-elevation-profile');

    const epEl = this.epHost().nativeElement as ArcgisElevationEl;

    const viewEl = this.getActiveViewEl();
    if (!viewEl) {
      return;
    }

    this.removeViewReadyListener?.();
    this.removeViewReadyListener = null;

    const sync = () => {
      const view = viewEl.view;
      if (!view) {
        return;
      }

      if (this.lastViewpoint) {
        viewEl.viewpoint = this.lastViewpoint;
        this.lastViewpoint = null;
      }

      if (epEl.view !== view) {
        epEl.view = view;
        epEl.profiles = new Collection([{ type: 'ground' }]);
      }
    };

    viewEl.addEventListener('arcgisViewReadyChange', sync);
    this.removeViewReadyListener = () =>
      viewEl.removeEventListener('arcgisViewReadyChange', sync);
    this.destroyRef.onDestroy(() => this.removeViewReadyListener?.());
    requestAnimationFrame(() => requestAnimationFrame(sync));
  }
}
