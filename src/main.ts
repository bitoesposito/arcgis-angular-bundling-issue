import { bootstrapApplication } from '@angular/platform-browser';
import esriConfig from '@arcgis/core/config.js';
import { setAssetPath as setArcgisAssetPath } from '@arcgis/map-components';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { setAssetPath } from '@esri/calcite-components';

esriConfig.assetsPath = new URL('assets/vendor/arcgis-core/assets', document.baseURI).href;
setArcgisAssetPath(new URL('assets/vendor/arcgis-map-components/', document.baseURI).href);

setAssetPath(new URL('calcite-components/', document.baseURI).href);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
