import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Components
import { AppComponent } from './app.component';
import { UserProfileComponent } from './components/user-profile.component';

// Services
import { UserService } from './services/user.service';

// Pipes
import { UserDisplayNamePipe } from './pipes/user-display-name.pipe';

// Directives
import { HighlightOnHoverDirective } from './directives/highlight-on-hover.directive';

/**
 * Main application module that bootstraps the Angular application.
 *
 * This module imports all necessary Angular modules and declares
 * all application components, directives, and pipes. It also
 * provides application-wide services.
 *
 * @example
 * The AppModule serves as the root module and is bootstrapped in main.ts:
 * ```typescript
 * import { AppModule } from './app/app.module';
 *
 * platformBrowserDynamic().bootstrapModule(AppModule)
 *   .catch(err => console.error(err));
 * ```
 */
@NgModule({
  /**
   * Components, directives, and pipes that belong to this module
   */
  declarations: [
    AppComponent,
    UserProfileComponent,
    UserDisplayNamePipe,
    HighlightOnHoverDirective
  ],

  /**
   * Other modules whose exported classes are needed by component templates in this module
   */
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule
  ],

  /**
   * Services that should be available application-wide
   */
  providers: [
    UserService,
    UserDisplayNamePipe // Make pipe available for injection
  ],

  /**
   * The main application view, called the root component, which hosts all other app views
   */
  bootstrap: [AppComponent]
})
export class AppModule {

  /**
   * Constructor for the AppModule
   *
   * @example
   * The module constructor can be used for initialization logic:
   * ```typescript
   * constructor() {
   *   console.log('AppModule initialized');
   * }
   * ```
   */
  constructor() {
    console.log('🚀 AppModule initialized - Application starting up');
  }
}
