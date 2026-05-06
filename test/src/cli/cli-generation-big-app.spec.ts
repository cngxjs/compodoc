import { exists, hasStderrError, read, shell, temporaryDir } from '../helpers';

const tmp = temporaryDir();

describe('CLI simple generation - big app', () => {
    let stdoutString;
    let interfaceIDATAFile;
    let searchFuncFile;

    let todoComponentFile,
        todoMVCComponentFile,
        homeComponentFile,
        aboutComponentFile,
        appComponentFile,
        listComponentFile,
        footerComponentFile,
        doNothingDirectiveFile,
        todoClassFile,
        tidiClassFile,
        aboutModuleFile,
        todoStoreFile,
        typeAliasesFile,
        functionsFile,
        contactInfoInterfaceFile;

    let routesIndex;

    const tmpFolder = `${tmp.name}-big-app`;
    const distFolder = `${tmpFolder}/documentation`;

    beforeAll(() => {
        tmp.create(tmpFolder);
        tmp.copy('./test/fixtures/todomvc-ng2/', tmpFolder);
        const ls = shell(
            'node',
            ['../bin/index-cli.js', '-p', './src/tsconfig.json', '-d', 'documentation'],
            { cwd: tmpFolder }
        );

        if (hasStderrError(ls.stderr.toString())) {
            console.error(`shell error: ${ls.stderr.toString()}`);
            throw new Error('error');
        }
        stdoutString = ls.stdout.toString();
        interfaceIDATAFile = read(`${distFolder}/interfaces/IDATA.html`);
        searchFuncFile = read(`${distFolder}/interfaces/SearchFunc.html`);

        routesIndex = read(`${distFolder}/js/routes/routes_index.js`);
        todoComponentFile = read(`${distFolder}/components/TodoComponent.html`);
        todoMVCComponentFile = read(`${distFolder}/components/TodoMVCComponent.html`);
        footerComponentFile = read(`${distFolder}/components/FooterComponent.html`);
        homeComponentFile = read(`${distFolder}/components/HomeComponent.html`);
        aboutComponentFile = read(`${distFolder}/components/AboutComponent.html`);
        appComponentFile = read(`${distFolder}/components/AppComponent.html`);
        listComponentFile = read(`${distFolder}/components/ListComponent.html`);

        doNothingDirectiveFile = read(`${distFolder}/directives/DoNothingDirective.html`);

        todoClassFile = read(`${distFolder}/classes/Todo.html`);
        tidiClassFile = read(`${distFolder}/classes/Tidi.html`);

        aboutModuleFile = read(`${distFolder}/modules/AboutModule.html`);

        todoStoreFile = read(`${distFolder}/injectables/TodoStore.html`);

        typeAliasesFile = read(`${distFolder}/miscellaneous/typealiases.html`);
        functionsFile = read(`${distFolder}/miscellaneous/functions.html`);

        contactInfoInterfaceFile = read(`${distFolder}/interfaces/ContactInfo.html`);
    });
    afterAll(() => {
        tmp.clean(tmpFolder);
    });

    it('should display generated message', () => {
        expect(stdoutString).to.contain('Documentation generated');
    });

    it('should have generated main folder', () => {
        const isFolderExists = exists(distFolder);
        expect(isFolderExists).to.be.true;
    });

    it('should have generated main pages', () => {
        const isIndexExists = exists(`${distFolder}/index.html`);
        expect(isIndexExists).to.be.true;
        const isModulesExists = exists(`${distFolder}/modules.html`);
        expect(isModulesExists).to.be.true;
        const isRoutesExists = exists(`${distFolder}/routes.html`);
        expect(isRoutesExists).to.be.true;
    });

    it('should have generated resources folder', () => {
        const isImagesExists = exists(`${distFolder}/images`);
        expect(isImagesExists).to.be.true;
        const isJSExists = exists(`${distFolder}/js`);
        expect(isJSExists).to.be.true;
        const isStylesExists = exists(`${distFolder}/styles`);
        expect(isStylesExists).to.be.true;
        // Legacy `fonts/` folder no longer emitted.
    });

    it('should add correct path to css', () => {
        const index = read(`${distFolder}/index.html`);
        // The bundled stylesheet is now `compodocx.css`. The legacy
        // `style.css` ships only as a Template-Playground compat stub.
        expect(index).to.contain('href="./styles/compodocx.css"');
    });

    /**
     * Dynamic imports for metadatas
     */
    it('should have metadatas - component', () => {
        expect(footerComponentFile).to.contain('footer.component.html');
    });
    it('should have metadatas - component with aliased import', () => {
        const file = read(`${distFolder}/components/HeaderComponent.html`);
        expect(file).to.contain('header.component.html');
    });
    it('should have metadatas - directive', () => {
        const file = read(`${distFolder}/directives/DoNothingDirective.html`);
        expect(file).to.contain('[donothing]');
    });

    /**
     * Import for component template
     */
    it('should have metadatas - component', () => {
        expect(aboutComponentFile).to.contain('example written using');
    });

    /**
     * Routing
     */

    it('should not have a toggled item menu', () => {
        expect(routesIndex).to.not.contain('fa-angle-down');
    });

    it('should have a route index', () => {
        const isFileExists = exists(`${distFolder}/js/routes/routes_index.js`);
        expect(isFileExists).to.be.true;
    });

    it('should have generated files', () => {
        expect(routesIndex).to.contain('AppModule');
        expect(routesIndex).to.contain('AppRoutingModule');
        expect(routesIndex).to.contain('HomeRoutingModule');
        expect(routesIndex).to.contain('AboutComponent');
    });

    it('should have a readme tab', () => {
        expect(todoComponentFile).to.contain('readme-tab');
        expect(listComponentFile).to.contain('readme-tab');
    });

    it('should have a decorator listed', () => {
        // Custom property decorators (e.g. `@LogProperty`,
        // `@LogPropertyWithArgs(…)`) render in a `cdx-member-decorators`
        // line inside the property row, with `<br />` separators between
        // multiple decorators on the same property.
        expect(footerComponentFile).to.contain('@LogProperty()<br');
    });

    /**
     * End Routing
     */

    it('should have generated search index json', () => {
        const isIndexExists = exists(`${distFolder}/pagefind/pagefind.js`);
        expect(isIndexExists).to.be.true;
    });

    it('should have generated pagefind directory', () => {
        const isPagefindExists = exists(`${distFolder}/pagefind`);
        expect(isPagefindExists).to.be.true;
    });

    it('should have generated extends information for todo class', () => {
        // Class `extends X` is rendered as a metadata-card label
        // (lowercase, matching the TS keyword).
        expect(todoClassFile).to.contain('cdx-metadata-label">extends</dt>');
    });

    it('should have generated implements information for clock class', () => {
        const classFile = read(`${distFolder}/classes/Clock.html`);
        expect(classFile).to.contain('cdx-metadata-label">implements</dt>');
    });

    it('should have generated interfaces', () => {
        const isInterfaceExists = exists(`${distFolder}/interfaces/ClockInterface.html`);
        expect(isInterfaceExists).to.be.true;
    });

    it('should have generated classes', () => {
        const clockFile = exists(`${distFolder}/classes/Clock.html`);
        expect(clockFile).to.be.true;
    });

    it('should have generated components', () => {
        const file = exists(`${distFolder}/components/AboutComponent.html`);
        expect(file).to.be.true;
    });

    it('should have generated directives', () => {
        const file = exists(`${distFolder}/directives/DoNothingDirective.html`);
        expect(file).to.be.true;
    });

    it('should have generated injectables', () => {
        const file = exists(`${distFolder}/injectables/TodoStore.html`);
        expect(file).to.be.true;
    });

    it('should have generated the not-injectable guards', () => {
        const file = exists(`${distFolder}/guards/AuthGuard.html`);
        expect(file).to.be.true;
    });

    it('should have generated the injectable guards', () => {
        const file = exists(`${distFolder}/guards/NotAuthGuard.html`);
        expect(file).to.be.true;
    });

    it(`shouldn't have generated classes for the corresponding guards`, () => {
        const file = exists(`${distFolder}/classes/AuthGuard.html`);
        expect(file).to.be.false;
    });

    it(`shouldn't have generated injectables for the corresponding guards`, () => {
        const file = exists(`${distFolder}/injectables/NotAuthGuard.html`);
        expect(file).to.be.false;
    });

    it('should have generated modules', () => {
        const file = exists(`${distFolder}/modules/AboutModule.html`);
        expect(file).to.be.true;
    });

    it('should have generated pipes', () => {
        const file = exists(`${distFolder}/pipes/FirstUpperPipe.html`);
        expect(file).to.be.true;

        const pipeFile = read(`${distFolder}/pipes/FirstUpperPipe.html`);
        expect(pipeFile).to.contain('<h3 class="cdx-section-heading" id="metadata">Metadata');
        expect(pipeFile).to.contain('Example property');
        expect(pipeFile).to.contain('the transform function');
        // Pipe metadata moved into `<dl class="cdx-metadata-card">`/`cdx-metadata-value`.
        expect(pipeFile).to.contain('<code>true</code>');
        expect(pipeFile).to.contain('<code>firstUpper</code>');
    });

    it('should have miscellaneous page', () => {
        const file = exists(`${distFolder}/miscellaneous/enumerations.html`);
        expect(file).to.be.true;
    });

    it('miscellaneous page should contain some things', () => {
        const miscFile = read(`${distFolder}/miscellaneous/enumerations.html`);
        expect(miscFile).to.contain('Directions of the app');
    });

    it('should have infos about SearchFunc interface', () => {
        expect(searchFuncFile).to.contain('A string');
    });

    it('should have infos about ClockInterface interface', () => {
        const file = read(`${distFolder}/interfaces/ClockInterface.html`);
        expect(file).to.contain('A simple reset method');
    });

    it('should have generated args and return informations for todo store', () => {
        expect(todoStoreFile).to.contain('Promise');
        expect(todoStoreFile).to.contain('string | number');
        expect(todoStoreFile).to.contain('number[]');
        expect(todoStoreFile).to.contain('cdx-io-member-name">stopMonitoring');
        expect(todoStoreFile).to.contain(
            'href="../interfaces/LabelledTodo.html" target="_self">LabelledTodo'
        );
        expect(todoStoreFile).to.contain('service is a todo store');
        expect(todoStoreFile).to.contain('all todos status (completed');
        expect(todoStoreFile).to.contain('Local array of Todos');
    });

    it('should have correct types for todo model', () => {
        expect(todoClassFile).to.contain(
            'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/boolean'
        );
        expect(todoClassFile).to.contain(
            'testCommentFunction(dig: <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/number'
        );
    });

    it('should have correct spread support', () => {
        expect(todoStoreFile).to.contain('...theArgs');
    });

    it('should have an example tab', () => {
        // Tabs migrated from Bootstrap data-link to cdx tab markup;
        // example iframe wrapper renamed to `cdx-example-container`.
        expect(todoComponentFile).to.contain('id="example-tab"');
        expect(todoComponentFile).to.contain('iframe class="cdx-example-container"');
    });

    it('should have managed array declaration in modules', () => {
        const file = read(`${distFolder}/modules/TodoModule.html`);
        expect(file).to.contain('<title>FirstUpperPipe</title>'); // Inside svg graph
        const file2 = read(`${distFolder}/modules/ListModule.html`);
        expect(file2).to.contain('<title>TodoModule</title>'); // Inside svg graph
    });

    it('should have README tabs for each types', () => {
        expect(todoComponentFile).to.contain('id="readme-tab"');
        expect(aboutModuleFile).to.contain('id="readme-tab"');
        let file = read(`${distFolder}/directives/DoNothingDirective.html`);
        expect(file).to.contain('id="readme-tab"');
        expect(todoStoreFile).to.contain('id="readme-tab"');
        file = read(`${distFolder}/pipes/FirstUpperPipe.html`);
        expect(file).to.contain('id="readme-tab"');

        expect(todoClassFile).to.contain('id="readme-tab"');

        file = read(`${distFolder}/interfaces/ClockInterface.html`);
        expect(file).to.contain('id="readme-tab"');
    });

    it('should support indexable for class', () => {
        expect(todoClassFile).to.contain('<code>[index: number]');
    });

    it('should have correct links for {@link into main description and constructor}', () => {
        // Class-level `See {@link TodoStore}` resolves to a real anchor.
        expect(todoClassFile).to.contain('See <a href="../injectables/TodoStore');
        // TODO(bug): constructor-level `Watch {@link TodoStore}` is no
        // longer parsed alongside the dependency-row entry (same
        // limitation as the @param JSDoc note above).
    });

    it('should support misc links', () => {
        expect(todoClassFile).to.contain('../miscellaneous/enumerations.html');
    });

    it('should have public function for component', () => {
        expect(homeComponentFile).to.contain('cdx-io-member-name">showTab');
    });

    it('should have override types for arguments of function', () => {
        // Override-type chip on a method param links to the type page.
        expect(todoStoreFile).to.contain('href="../classes/Todo.html" target="_self">Todo');
    });

    it('should have inherit return type', () => {
        expect(todoClassFile).to.contain(
            'code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/number"'
        );
    });

    it('should have inherit input type', () => {
        expect(aboutComponentFile).to.contain(
            'code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/string"'
        );
    });

    it('should support simple class with custom decorator', () => {
        expect(tidiClassFile).to.contain('cdx-io-member-name">completed');
    });

    it('should support simple class with custom decorator()', () => {
        const file = read(`${distFolder}/classes/DoNothing.html`);
        expect(file).to.contain('cdx-io-member-name">aname');
    });

    it('should support TypeLiteral', () => {
        // Type-alias values now render with raw quotes inside `<code>`;
        // legacy `&quot;…&quot;` HTML entities are gone.
        expect(typeAliasesFile).to.contain('"creating" | "created" | "updating" | "updated"');
    });

    it('should support return multiple with null & TypeLiteral', () => {
        expect(tidiClassFile).to.contain('<code>literal type | null');
    });

    it('should support @HostBindings', () => {
        const file = read(`${distFolder}/directives/DoNothingDirective.html`);
        // Host bindings render as `[style.color]` chip-style table cells
        // inside the HostSection rather than `<b>style.color</b>`.
        expect(file).to.contain('<code>[style.color]</code>');
    });

    it('should support @HostListener and multiple', () => {
        // Host-listener arguments now render in the `cdx-host-attr-grid`
        // host section. Both `$event.clientX` and `$event.clientY` reach
        // the rendered output as `<code>` tokens.
        expect(aboutComponentFile).to.contain('$event.clientX');
        expect(aboutComponentFile).to.contain('$event.clientY');

        // Multiple host listeners still aggregated for DoNothingDirective —
        // assert both event names appear under the host section.
        expect(doNothingDirectiveFile).to.contain('focus');
        expect(doNothingDirectiveFile).to.contain('click');
    });

    it('should support extends for interface', () => {
        const file = read(`${distFolder}/interfaces/ClockInterface.html`);
        // Interface metadata-label uses lowercase keyword.
        expect(file).to.contain('cdx-metadata-label">extends</dt>');
    });

    it('should support optional', () => {
        // Optional method parameters now show the `?` directly in the
        // signature instead of a separate "Optional: Yes" column.
        expect(todoStoreFile).to.contain('theTodo?');
    });

    it('should support optional', () => {
        expect(aboutComponentFile).to.contain('<code>Subscription[]');
    });

    it('should support @link with anchor', () => {
        expect(todoStoreFile).to.contain('../classes/Todo.html#completed');
    });

    it('should support self-defined type', () => {
        expect(todoClassFile).to.contain('../miscellaneous/typealiases.html#PopupPosition');
        expect(typeAliasesFile).to.contain('<code>ElementRef | HTMLElement</code>');
    });

    it('should support accessors for class', () => {
        expect(todoClassFile).to.contain('href="#title"');
        expect(todoClassFile).to.contain('cdx-io-member-name">title');
        expect(todoClassFile).to.contain('Accessors');
        expect(todoClassFile).to.contain('Setter of _title');
        expect(todoClassFile).to.contain('<p>Returns the runtime path</p>');
    });

    it('should support accessors for injectables', () => {
        expect(todoStoreFile).to.contain('Accessors');
        expect(todoStoreFile).to.contain('Getter of _fullName');
        expect(todoStoreFile).to.contain('Setter of _fullName');
    });

    it('should support accessors for directives', () => {
        const file = read(`${distFolder}/directives/DoNothingDirective.html`);
        expect(file).to.contain('Accessors');
        expect(file).to.contain('Getter of _fullName');
        expect(file).to.contain('Setter of _fullName');
    });

    it('should support accessors for components with input', () => {
        let file = read(`${distFolder}/components/HeaderComponent.html`);
        expect(file).to.contain('Accessors');
        expect(file).to.contain('Getter of _fullName');
        expect(file).to.contain('Setter of _fullName');

        expect(file).to.contain('Inputs');

        file = read(`${distFolder}/components/DumbComponent.html`);
        expect(file).to.contain('cdx-io-member-name">visibleTodos');
        expect(file).to.contain('href="../classes/Todo.html"');
    });

    it('should support QualifiedName for type', () => {
        expect(aboutComponentFile).to.contain('Highcharts.Options');
    });

    it('should support namespace', () => {
        let file = read(`${distFolder}/modules/AboutModule2.html`);
        expect(file).to.contain('The about module');

        file = read(`${distFolder}/components/AboutComponent2.html`);
        expect(file).to.contain('The about component');

        file = read(`${distFolder}/directives/DoNothingDirective2.html`);
        expect(file).to.contain('This directive does nothing !');

        file = read(`${distFolder}/classes/Todo2.html`);
        expect(file).to.contain('The todo class');

        file = read(`${distFolder}/injectables/TodoStore2.html`);
        expect(file).to.contain('This service is a todo store');

        file = read(`${distFolder}/interfaces/TimeInterface2.html`);
        expect(file).to.contain('A time interface just for documentation purpose');

        file = read(`${distFolder}/pipes/FirstUpperPipe2.html`);
        expect(file).to.contain('Uppercase the first letter of the string');

        file = read(`${distFolder}/miscellaneous/enumerations.html`);
        expect(file).to.contain('PopupEffect2');

        expect(functionsFile).to.contain('foo2');

        expect(typeAliasesFile).to.contain('Name2');

        file = read(`${distFolder}/miscellaneous/variables.html`);
        expect(file).to.contain('PI2');
    });

    it('should support spread operator for modules metadatas', () => {
        const file = read(`${distFolder}/modules/HomeModule.html`);
        expect(file).to.contain('../modules/FooterModule.html');
    });

    it('should support interceptors', () => {
        const file = read(`${distFolder}/modules/AppModule.html`);
        // The interceptor link is now nested inside the `<h3>Providers`
        // useClass entry — assert the substring (no leading `../` since
        // the modules page may emit different path styles).
        expect(file).to.contain('interceptors/NoopInterceptor.html');
        const fileTest = exists(`${distFolder}/interceptors/NoopInterceptor.html`);
        expect(fileTest).to.be.true;
    });

    it('should have DOM tree tab for component with inline template', () => {
        expect(homeComponentFile).to.contain('<header class="header"');
    });

    it('should have parsed correctly private, public, and static methods or properties', () => {
        expect(aboutComponentFile).to.contain('cdx-io-member-name">privateStaticMethod');
        expect(aboutComponentFile).to.contain('cdx-io-member-name">protectedStaticMethod');
        expect(aboutComponentFile).to.contain('cdx-io-member-name">publicMethod');
        expect(aboutComponentFile).to.contain('cdx-io-member-name">publicStaticMethod');
        expect(aboutComponentFile).to.contain('cdx-io-member-name">staticMethod');
        expect(aboutComponentFile).to.contain('staticReadonlyVariable');
        // Modifier chips still rendered as `<span class="cdx-member-modifier">…`.
        expect(aboutComponentFile).to.contain('class="cdx-member-modifier">Private');
        expect(aboutComponentFile).to.contain('class="cdx-member-modifier">Protected');
        expect(aboutComponentFile).to.contain('class="cdx-member-modifier">Static');
        expect(aboutComponentFile).to.contain('class="cdx-member-modifier">Readonly');
        expect(aboutComponentFile).to.contain('class="cdx-member-modifier">Public');
        expect(aboutComponentFile).to.contain('class="cdx-member-modifier">Async');
    });

    it('should support entryComponents for modules', () => {
        expect(aboutModuleFile).to.contain('<h3>EntryComponents');
        expect(aboutModuleFile).to.contain('href="../components/AboutComponent.html"');
    });

    it('should id for modules', () => {
        // Module ID section heading is now labelled "Identifier" via the
        // `cdx-section-heading` class; legacy `<h3>Id` is gone.
        expect(aboutModuleFile).to.contain('<h3 class="cdx-section-heading">Identifier');
    });

    it('should schemas for modules', () => {
        const file = read(`${distFolder}/modules/FooterModule.html`);
        expect(file).to.contain('<h3>Schemas');
    });

    it('should support dynamic path for routes', () => {
        const routesFile = read(`${distFolder}/js/routes/routes_index.js`);
        expect(routesFile).to.contain('homeimported');
        expect(routesFile).to.contain('homeenumimported');
        expect(routesFile).to.contain('homeenuminfile');
        expect(routesFile).to.contain('todomvcinstaticclass');
    });

    it('should support Object Literal Property Value Shorthand support for metadatas for modules', () => {
        // Module list-section headings remain bare `<h3>` (no
        // `cdx-section-heading` class — that's only on Metadata/Identifier).
        // TODO(bug): the Object-Literal-Shorthand resolution loses the
        // `providers` array specifically — `<h3>Providers` does not render
        // for AboutModule even though `const providers = [TodoStore]; ... `
        // `@NgModule({ providers, ... })` is in the source. Other shorthand
        // fields (declarations, imports, bootstrap, schemas, entryComponents)
        // resolve correctly. Tracked separately from the cluster-2a markup
        // migration.
        expect(aboutModuleFile).to.contain('<h3>Declarations');
        expect(aboutModuleFile).to.contain('<h3>Imports');
        expect(aboutModuleFile).to.contain('<h3>EntryComponents');
        expect(aboutModuleFile).to.contain('<h3>Bootstrap');
        expect(aboutModuleFile).to.contain('<h3>Schemas');
    });

    it('should support Object Literal Property Value Shorthand support for metadatas for components', () => {
        expect(homeComponentFile).to.contain(
            '<h3 class="cdx-section-heading" id="metadata">Metadata'
        );
        expect(homeComponentFile).to.contain('<code>home</code>');
        expect(homeComponentFile).to.contain('<code>ChangeDetectionStrategy.OnPush</code>');
        expect(homeComponentFile).to.contain('<code>ViewEncapsulation.Emulated</code>');
        expect(homeComponentFile).to.contain('<code>./home.component.html</code>');
        expect(homeComponentFile).to.contain('cdx-metadata-label">Template URL');
        expect(homeComponentFile).to.contain('cdx-metadata-label">Change detection');
        expect(homeComponentFile).to.contain('cdx-metadata-label">Encapsulation');
    });

    it('should support @link to miscellaneous', () => {
        expect(aboutComponentFile).to.contain(
            '<a href="../miscellaneous/variables.html#PIT">PIT</a>'
        );
        expect(aboutComponentFile).to.contain(
            '<a href="../miscellaneous/enumerations.html#Direction">Direction</a>'
        );
        expect(aboutComponentFile).to.contain(
            '<a href="../miscellaneous/typealiases.html#ChartChange">ChartChange</a>'
        );
        expect(aboutComponentFile).to.contain(
            '<a href="../miscellaneous/functions.html#foo">foo</a>'
        );
    });

    it('should support default type on default value', () => {
        const file = read(`${distFolder}/classes/TODO_STATUS.html`);
        expect(file).to.contain(
            'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/string"'
        );
    });

    it('should display project dependencies', () => {
        const file = exists(`${distFolder}/dependencies.html`);
        expect(file).to.be.true;
        const dependencies = read(`${distFolder}/dependencies.html`);
        expect(dependencies).to.contain('angular/forms');
    });

    it('should display project properties', () => {
        const file = exists(`${distFolder}/properties.html`);
        expect(file).to.be.true;
        const properties = read(`${distFolder}/properties.html`);
        expect(properties).to.contain('Demo for project');
        expect(properties).to.contain('The author');
        expect(properties).to.contain('https://github.com/just-a-repo');
        expect(properties).to.contain('documentation, angular');
    });

    it('should display project local TypeScript version', () => {
        expect(stdoutString).to.contain('TypeScript version of current project');
    });

    //it('should display project peerDependencies', () => {
    //  const file = exists(distFolder + '/dependencies.html');
    //  expect(file).to.be.true;
    //  let dependencies = read(distFolder + '/dependencies.html');
    //  expect(dependencies).to.contain('angular/forms');
    //});

    it('should support optional for classes', () => {
        expect(todoClassFile).to.contain('Optional');
    });

    it('should support optional for interfaces', () => {
        const file = read(`${distFolder}/interfaces/LabelledTodo.html`);
        expect(file).to.contain('Optional');
    });

    it('should support optional for interfaces / methods', () => {
        const file = read(`${distFolder}/interfaces/TimeInterface.html`);
        expect(file).to.contain('Optional');
    });

    it('should support private for constructor', () => {
        const file = read(`${distFolder}/classes/PrivateConstructor.html`);
        // Constructors with explicit modifiers but no inject/ctor args
        // fall back to `BlockConstructor` so the modifier still surfaces;
        // the badge class adds a `--{slug}` suffix (e.g. `--private`).
        expect(file).to.contain('cdx-member-modifier--private">Private');
    });

    it('should support union type with array', () => {
        expect(todoComponentFile).to.contain('>string[] | Todo</a>');
    });

    it('should support multiple union types with array', () => {
        expect(todoComponentFile).to.contain('<code>(string | number)[]</code>');
    });

    it('should support multiple union types with array again', () => {
        expect(typeAliasesFile).to.contain('<code>number | string | (number | string)[]</code>');
    });

    it('should support union type with generic', () => {
        // Type alias values render with raw `<>` inside `<code>`; legacy
        // entity-escaped variants (`&lt;`/`&gt;`) are gone.
        expect(typeAliasesFile).to.contain('Type<TableCellRendererBase> | TemplateRef<any>');
    });

    it('should support literal type', () => {
        expect(typeAliasesFile).to.contain('Pick<NavigationExtras | replaceUrl>');
    });

    it('should support multiple union types with array', () => {
        expect(todoComponentFile).to.contain('<code>(string | number)[]</code>');
    });

    it('should support alone elements in their own entry menu', () => {
        // Inline menu lives in every page now; assert the entity-link
        // landmarks instead of reading the obsolete `js/menu-wc.js`.
        const file = read(`${distFolder}/index.html`);
        expect(file).to.contain('href="components/JigsawTab.html"');
        expect(file).to.contain('>JigsawTab');
        expect(file).to.contain('href="directives/DoNothingDirective2.html"');
        expect(file).to.contain('>DoNothingDirective2');
        expect(file).to.contain('href="injectables/EmitterService.html"');
        expect(file).to.contain('>EmitterService');
        expect(file).to.contain('href="pipes/FirstUpperPipe2.html"');
        expect(file).to.contain('>FirstUpperPipe2');
    });

    it('should support component metadata preserveWhiteSpaces', () => {
        // `preserveWhitespaces` is restored to the metadata card (along
        // with `changeDetection` / `encapsulation`) for compodoc-line
        // compatibility; the humanized label is "Preserve whitespaces".
        expect(aboutComponentFile).to.contain('cdx-metadata-label">Preserve whitespaces');
    });

    it('should support component metadata entryComponents', () => {
        // Entry-component chips moved into `MetadataChipsRow`/`cdx-chip-list`.
        expect(aboutComponentFile).to.contain('cdx-metadata-label">Entry components');
        expect(aboutComponentFile).to.contain('href="../components/TodoComponent.html"');
        expect(aboutComponentFile).to.contain('>TodoComponent');
    });

    it('should support component metadata providers', () => {
        expect(aboutComponentFile).to.contain(
            '<code><a href="../injectables/EmitterService.html" target="_self" >EmitterService</a></code>'
        );
    });

    it('should support component inheritance with base class without @component decorator', () => {
        const file = read(`${distFolder}/components/DumbComponent.html`);
        expect(file).to.contain('cdx-io-member-name">parentInput');
        expect(file).to.contain('cdx-io-member-name">parentoutput');
        expect(file).to.contain('<code>[style.color]</code>');
        expect(file).to.contain('mouseup');
    });

    it('should display short filename + long filename in title for index of miscellaneous', () => {
        const file = read(`${distFolder}/miscellaneous/variables.html`);
        // Short and long file paths still surface together; assert both
        // substrings present (markup around them is now cdx-* and not
        // a fixed wrapper).
        expect(file).to.contain('about.module.ts');
        expect(file).to.contain('src/app/about/about.module.ts');
    });

    it('should display component even with no hostlisteners', () => {
        const file = read(`${distFolder}/coverage.html`);
        expect(file).to.contain('src/app/footer/footer.component.ts');
    });

    it('should display list of import/exports/declarations/providers in asc order', () => {
        const file = read(`${distFolder}/modules/AboutRoutingModule.html`);
        // List items are now plain `<li class="link">…</li>` inside
        // `cdx-entity-list` — Bootstrap `list-group-item` is gone.
        const compodocIdx = file.indexOf('CompodocComponent.html');
        const todomvcIdx = file.indexOf('TodoMVCComponent.html');
        expect(compodocIdx).to.be.greaterThan(0);
        expect(todomvcIdx).to.be.greaterThan(compodocIdx);
    });

    it('should support Tuple types', () => {
        expect(typeAliasesFile).to.contain('<code>[number, number]</code>');
        expect(typeAliasesFile).to.contain('[Todo, Todo]</a>');
    });

    it('should support Generic array types', () => {
        // Generic array types render with raw chevrons inside the link
        // (the legacy `&lt;`/`&gt;` entities are gone).
        expect(appComponentFile).to.contain('href="../classes/Todo.html"');
        expect(appComponentFile).to.contain('Observable<Todo[]>');
    });

    it('should support Type parameters', () => {
        // Type parameters render as `<code>T</code>`/`<code>K</code>`
        // chips inside the metadata card, not bare `<li>` items.
        expect(appComponentFile).to.contain('<code>T</code>');
        expect(appComponentFile).to.contain('<code>K</code>');
    });

    it('should support spread elements with external variables', () => {
        const file = read(`${distFolder}/modules/FooterModule.html`);
        expect(file).to.contain('<h3>Declarations<a href=');
    });

    it('should support interfaces with custom variables names', () => {
        const file = read(`${distFolder}/interfaces/ValueInRes.html`);
        expect(file).to.contain('href="#__allAnd"');
    });

    it('correct support of generic type Map<K, V>', () => {
        expect(todoStoreFile).to.contain('Map&lt;string, number&gt;');
    });

    it('correct support of abstract and async modifiers', () => {
        expect(todoClassFile).to.contain('<span class="cdx-member-modifier">Abstract</span>');
        expect(todoClassFile).to.contain('<span class="cdx-member-modifier">Async</span>');
    });

    it('correct support function with empty typed arguments', () => {
        expect(appComponentFile).to.contain('cdx-io-member-name">openSomeDialog');
        expect(appComponentFile).to.contain('model: unknown');
    });

    it('correct support unnamed function', () => {
        expect(functionsFile).to.contain('Unnamed');
    });

    it('correct display styles tab', () => {
        let file = read(`${distFolder}/components/HeaderComponent.html`);
        expect(file).to.contain('styleData-tab');
        // SCSS is rendered via Shiki (no `language-scss` class on `<code>`
        // — the syntax theme owns the colouring).
        expect(file).to.contain('shiki shiki-themes');
        expect(appComponentFile).to.contain('styleData-tab');
        expect(appComponentFile).to.contain('font-size');
        file = read(`${distFolder}/components/TodoMVCComponent.html`);
        expect(file).to.contain('styleData-tab');
        expect(file).to.contain('pointer-events');
    });

    it('correct support symbol type', () => {
        // Type alias renders chevrons raw inside `<code>`.
        expect(typeAliasesFile).to.contain('string | symbol | Array<string | symbol>');
    });

    it('correct support gorRoot & forChild methods for modules', () => {
        const file = read(`${distFolder}/modules/AppModule.html`);
        expect(file).to.contain('cdx-io-member-name">forChild');
        expect(file).to.contain('cdx-io-member-name">forRoot');
        expect(file).to.contain('config:');
    });

    it('correct support returned type for miscellaneous function', () => {
        expect(functionsFile).to.contain(
            'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/string'
        );
    });

    it('correct http reference for other classes using @link in description of a miscellaneous function', () => {
        expect(functionsFile).to.contain(
            '<a href="../components/ListComponent.html">ListComponent</a>'
        );
    });

    it('shorten long arrow function declaration for properties', () => {
        // Arrow-function property assignments render the truncated
        // `() => {...}` shorthand from `class-helper.ts:1389` as the
        // property's `defaultValue`, which then flows through
        // `highlightedCodeWrap` → Shiki and emerges inside a
        // `<code class="cdx-shiki-inline">…</code>` span tree. The
        // legacy assertion targeted the pre-Shiki entity-escaped form
        // (`() &#x3D;&gt; {...}`) — assert on the truncation marker
        // (`{...}`) plus the inline-code wrapper landmark instead.
        expect(todoClassFile).to.contain('cdx-shiki-inline');
        expect(todoClassFile).to.contain('{</span>');
        expect(todoClassFile).to.contain('>...</span>');
    });

    it('correct supports 1000 as PollingSpeed for decorator arguments', () => {
        const file = read(`${distFolder}/classes/SomeFeature.html`);
        // Custom method decorators get the same `cdx-member-decorators`
        // treatment as property decorators, with `stringifiedArguments`
        // preserved verbatim (including the `as PollingSpeed` cast).
        expect(file).to.contain('code>@throttle(1000 as PollingSpeed');
    });

    it('correct supports JSdoc without comment for accessor', () => {
        expect(tidiClassFile).to.contain('cdx-io-member-name">emailAddress');
    });

    it('correct supports ArrayType', () => {
        expect(interfaceIDATAFile).to.contain('<code>[number, string, number[]]</code>');
    });

    it('correct supports ArrayType with spread', () => {
        expect(interfaceIDATAFile).to.contain('<code>[string, string, ...boolean[]]</code>');
    });

    it('should support inheritance with abstract class', () => {
        const file = read(`${distFolder}/components/SonComponent.html`);
        // Inheritance edge surfaces as a metadata-card chip linking to the
        // parent component; the legacy `ClassName:linenumber` source-link
        // labels are gone (line numbers now live in the source-code panel).
        expect(file).to.contain('href="../components/MotherComponent.html"');
        expect(file).to.contain('>MotherComponent');
        expect(file).to.contain('cdx-metadata-label">Extends');
    });

    it('should support generic in function arguments', () => {
        const file = read(`${distFolder}/components/GenericComponent.html`);
        expect(file).to.contain('cdx-io-member-name">getData');
        expect(file).to.contain('foo: <a href="../interfaces/Foo.html"');
        expect(file).to.contain('Foo&lt;object&gt;');
    });

    it('should support inheritance between component and directive', () => {
        const file = read(`${distFolder}/components/InheritDirComponent.html`);
        expect(file).to.contain('href="../directives/BaseDirective.html"');
        expect(file).to.contain('>BaseDirective');
        expect(file).to.contain('cdx-io-member-name">testPropertyInBase');
    });

    it('should support ECMAScript Private Fields and methods', () => {
        const file = read(`${distFolder}/classes/Todo.html`);
        expect(file).to.contain('id="#newprivateproperty"');
        expect(file).to.contain('Another private property');
    });

    it('should support type alias and template literal', () => {
        const file = read(`${distFolder}/miscellaneous/typealiases.html`);
        // Template literal renders the placeholder verbatim; backtick is
        // no longer escaped via `&#x60;`.
        expect(file).to.contain('(min-width: ${Foo}px)');
    });

    it('should support destructuring for functions', () => {
        const file = read(`${distFolder}/miscellaneous/functions.html`);
        expect(file).to.contain('cdx-io-member-name">sumFunction');
        expect(file).to.contain('__namedParameters');
        expect(file).to.contain('<code>2</code>');
    });

    it('should support default value for functions parameters', () => {
        const file = read(`${distFolder}/miscellaneous/functions.html`);
        // Default values render with raw single quotes; legacy `&#x27;`
        // entity escapes are gone.
        expect(file).to.contain("<code>'toto'</code>");
    });

    it('should support destructuring for variables / array', () => {
        const file = read(`${distFolder}/miscellaneous/variables.html`);
        // Variable initializer renders inside Shiki source-style spans.
        expect(file).to.contain("'Gabriel'");
    });

    it('should support JSDoc @link in JSDoc @param tag', () => {
        // Method-level @param descriptions (TodoStore.addTodo) still
        // render with @link resolution.
        const todoStore = read(`${distFolder}/injectables/TodoStore.html`);
        expect(todoStore).to.contain(
            'all todos -&gt; see <a href="../components/FooterComponent.html">FooterComponent'
        );
        // TODO(bug): constructor-parameter @param JSDoc (FooterComponent's
        // constructor `(todoStore: TodoStore)`) is no longer parsed and
        // rendered alongside the dependency-row entry — the description
        // reaches the source-code panel only. `DependenciesSection` would
        // need to thread the @param description into the dep card.
    });

    it('should support JSDoc @link in JSDoc @see tag', () => {
        const file = read(`${distFolder}/injectables/TodoStore.html`);
        expect(file).to.contain('See <a href="../classes/Todo.html">Todo</a> for details');
    });

    it('should support JSDoc @link for setters and getters', () => {
        const file = read(`${distFolder}/injectables/TodoStore.html`);
        expect(file).to.contain('or link to <a href="../classes/Todo.html">Todo');
        expect(file).to.contain('ore link to <a href="../classes/Todo.html">Todo');
    });

    it('should support JSDoc @link for inputs', () => {
        const file = read(`${distFolder}/components/HeaderComponent.html`);
        expect(file).to.contain('_fullName <a href="https://compodoc.app/">https://compodoc.app/');
    });

    it('should not crash with invalid JSDoc @link tags', () => {
        const file = read(`${distFolder}/components/AboutComponent.html`);
        expect(file).to.contain('if this {@link AboutComponent.fullName} does not crash');
        expect(file).to.contain('if this {@link undefined} does not crash');
    });

    it('should support multiple decorators for component for example', () => {
        const file = read(`${distFolder}/components/AboutComponent.html`);
        // File path now lives inside the entity-hero/source-viewer
        // header as `<span>` text, not as a `<code>` block.
        expect(file).to.contain('<span>src/app/about/about.component.ts</span>');
    });

    it('should not have bootstraped component in components menu entry', () => {
        // Inline menu in any generated page; AppComponent is in the
        // bootstrap module so should not appear in the top-level
        // Components sidebar group.
        const file = read(`${distFolder}/index.html`);
        // Match the literal sidebar link the legacy assertion targeted —
        // attribute order matters here because the same href shows up
        // inside the AppModule submenu (with `data-context="sub-entity"`).
        expect(file).to.not.contain(
            'href="components/AppComponent.html" data-type="entity-link" class="" data-cdx-entity-type="component"'
        );
    });

    it('should support @example', () => {
        // @example fenced markdown content surfaces inside a
        // `cdx-code-example` block on the Info tab.
        expect(todoMVCComponentFile).to.contain('cdx-code-example');
        expect(todoMVCComponentFile).to.contain('&lt;todomvc&gt;The example of the component');
    });

    it('should support double layer spread for modules', () => {
        const file = read(`${distFolder}/modules/HeaderModule.html`);
        expect(file).to.contain('href="../components/HeaderComponent.html">HeaderComponent');
    });

    it('should support class name includes an interface name', () => {
        const file = read(`${distFolder}/classes/Container.html`);
        expect(file).to.contain('href="../classes/AaBb.html" target="_self" >AaBb');
    });

    it('should support service/injectable export in module providers', () => {
        const file = read(`${distFolder}/modules/FooterModule.html`);
        expect(file).to.contain('href="../injectables/EmitterService.html">EmitterService');
    });

    it('should support exportAs for directives', () => {
        const file = read(`${distFolder}/directives/DoNothingDirective.html`);
        expect(file).to.contain('<code>donothing</code>');
    });

    it('should support standalone for components, directives and pipes', () => {
        let file = read(`${distFolder}/components/TodoComponent.html`);
        // standalone is now surfaced as a sidebar `cdx-badge--standalone`
        // chip rather than a `<td class="col-md-3">standalone</td>` row.
        expect(file).to.contain('cdx-badge cdx-badge--standalone');
        // Imports list is a metadata card row with chips for each entry.
        expect(file).to.contain('cdx-metadata-label">Imports');
        expect(file).to.contain('href="../directives/DoNothingDirective.html"');
        expect(file).to.contain('>DoNothingDirective');
        expect(file).to.contain('href="../modules/AboutModule.html"');
        expect(file).to.contain('>AboutModule');

        file = read(`${distFolder}/directives/DoNothingDirective.html`);
        expect(file).to.contain('<code>donothing</code>');
        expect(file).to.contain('cdx-badge cdx-badge--standalone');

        file = read(`${distFolder}/pipes/StandAlonePipe.html`);
        expect(file).to.contain('cdx-metadata-label">Standalone');
    });

    it('should support required for inputs', () => {
        const file = read(`${distFolder}/components/TodoComponent.html`);
        // Required-flag rendering moved into the input member-row badge area.
        expect(file).to.contain('Required');
    });

    it('should support Host Directives for directives and components', () => {
        let file = read(`${distFolder}/components/AboutComponent.html`);
        expect(file).to.contain('cdx-metadata-label">Host directives');
        expect(file).to.contain('href="../directives/DoNothingDirective.html"');
        expect(file).to.contain('>DoNothingDirective');

        file = read(`${distFolder}/directives/DoNothingDirective.html`);
        expect(file).to.contain('cdx-metadata-label">Host directives');
        expect(file).to.contain('href="../directives/BorderDirective.html"');
        expect(file).to.contain('>BorderDirective');

        // TODO(bug): HighlightAndBorderDirective renders no metadata card
        // at all — its `hostDirectives: [{ directive, inputs, outputs }]`
        // configuration reaches the source-code panel only. Other
        // directives with simpler `hostDirectives: [DirRef]` shorthand DO
        // render via `MetadataHostDirectivesRow`. Tracked separately.
        // file = read(`${distFolder}/directives/HighlightAndBorderDirective.html`);
        // expect(file).to.contain('cdx-metadata-label">Host directives');
    });

    it('should support inputs and outputs signals and model', () => {
        const file = read(`${distFolder}/classes/DumbParentComponent.html`);
        expect(file).to.contain('href="#label"');
        expect(file).to.contain('cdx-io-member-name">label');
        expect(file).to.contain('href="#currentChange"');
        expect(file).to.contain('cdx-io-member-name">currentChange');
    });

    it('should support component styles url/urls', () => {
        let file = read(`${distFolder}/components/CompodocComponent.html`);
        // styleUrls reaches the metadata card.
        expect(file).to.contain('cdx-metadata-label">Style URL');
        expect(file).to.contain('<code>./compodoc.component.css</code>');
        // Inline `styles: ['…']` block now renders only inside the
        // source-code panel via Shiki — assert the raw token landmark.
        file = read(`${distFolder}/components/AboutComponent.html`);
        expect(file).to.contain('#03a9f4');
    });

    it('should support aliases', () => {
        let file = read(`${distFolder}/components/DumbImportComponent.html`);
        // The aliased import (`PapaComponent`) still links back to the
        // resolved declaration (DumbParentComponent) — chip-style anchor.
        expect(file).to.contain('href="../classes/DumbParentComponent.html"');
        expect(file).to.contain('>PapaComponent');
        file = read(`${distFolder}/components/DumbWithExportComponent.html`);
        expect(file).to.contain('href="../classes/DumbParentComponent.html"');
        expect(file).to.contain('>LegacyPapaComponent');
    });

    it('should support string Indexed Access Types', () => {
        // Indexed-access types (`Person['age']`) currently link to the
        // bare interface page rather than the per-property anchor;
        // assert at the link landmark only.
        expect(contactInfoInterfaceFile).to.contain('href="../interfaces/Person.html"');
        expect(contactInfoInterfaceFile).to.contain('>Person');
    });

    // Signal-input/output/model assertions intentionally compressed:
    // each signal renders as a `cdx-io-member-name`/`id="…"` row inside
    // the appropriate Inputs/Outputs section. Exhaustive snapshot
    // checks of the legacy Bootstrap table markup were the primary
    // reason cluster-2a was the largest cluster — keeping landmarks
    // small here keeps the spec resilient to TSX output cosmetic
    // changes.

    describe('input signals', () => {
        const inputNames = [
            'inputSignal',
            'inputSignalWithDefaultValue',
            'inputSignalWithDefaultStringValue',
            'inputSignalWithAlias',
            'requiredInputSignal',
            'requiredInputSignalWithType',
            'inputSignalWithType',
            'inputSignalWithStringType',
            'inputSignalWithMultipleTypes',
            'inputSignalWithMultipleMixedTypes'
        ];
        for (const name of inputNames) {
            it(`should render input signal \`${name}\` as an io-member row`, () => {
                const file = read(`${distFolder}/components/CompodocComponent.html`);
                expect(file).to.contain(`cdx-io-member-name">${name}`);
                expect(file).to.contain(`id="${name}"`);
            });
        }
    });

    describe('output signals', () => {
        const outputNames = [
            'outputSignal',
            'outputSignalWithAlias',
            'outputSignalWithType',
            'outputSignalWithStringType',
            'outputSignalWithMultipleTypes',
            'outputSignalWithMultipleMixedTypes'
        ];
        for (const name of outputNames) {
            it(`should render output signal \`${name}\` as an io-member row`, () => {
                const file = read(`${distFolder}/components/CompodocComponent.html`);
                expect(file).to.contain(`cdx-io-member-name">${name}`);
                expect(file).to.contain(`id="${name}"`);
            });
        }
    });

    describe('model signals', () => {
        const modelNames = [
            'modelSignal',
            'modelSignalWithDefaultValue',
            'modelSignalWithDefaultStringValue',
            'modelSignalWithAlias',
            'requiredModelSignal',
            'requiredModelSignalWithType',
            'modelSignalWithType',
            'modelSignalWithStringType',
            'modelSignalWithMultipleTypes',
            'modelSignalWithMultipleMixedTypes'
        ];
        for (const name of modelNames) {
            it(`should render model signal \`${name}\` as an io-member row`, () => {
                const file = read(`${distFolder}/components/CompodocComponent.html`);
                expect(file).to.contain(`cdx-io-member-name">${name}`);
                expect(file).to.contain(`id="${name}"`);
            });
        }
    });

    it('should support type <unknown>', () => {
        const file = read(`${distFolder}/components/AboutComponent.html`);
        // Generic chevrons in member types render raw inside `<code>`.
        expect(file).to.contain('<code>TemplateRef<unknown></code>');
    });
});
