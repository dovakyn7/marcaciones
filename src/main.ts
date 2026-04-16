import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
//import { Marcaciones } from './app/marcaciones/marcaciones';
import { App } from './app/app';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));