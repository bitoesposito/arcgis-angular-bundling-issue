import { bootstrapApplication } from '@angular/platform-browser';
import esriConfig from '@arcgis/core/config.js';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { setAssetPath } from '@esri/calcite-components';

const ARCGIS_CDN = 'https://js.arcgis.com/4.34';
esriConfig.assetsPath = `${ARCGIS_CDN}/@arcgis/core/assets`;

setAssetPath(new URL('calcite-components/', document.baseURI).href);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
