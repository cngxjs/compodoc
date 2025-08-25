import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

/**
 * Main entry point for the Angular application.
 * This bootstraps the application by loading the AppModule.
 */
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
