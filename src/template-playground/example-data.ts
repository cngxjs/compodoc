/**
 * Example data structure for template playground
 * Contains mock data for all supported template types
 */

export interface ExampleData {
    component: any;
    module: any;
    interface: any;
    class: any;
    injectable: any;
    directive: any;
    pipe: any;
    guard: any;
    interceptor: any;
    entity: any;
    controller: any;
    miscellaneous: any;
    overview: any;
    index: any;
}

export const EXAMPLE_DATA: ExampleData = {
    component: {
        name: 'UserProfileComponent',
        file: 'src/app/components/user-profile.component.ts',
        deprecated: false,
        selector: 'app-user-profile',
        templateUrl: './user-profile.component.html',
        styleUrls: ['./user-profile.component.scss'],
        description: 'Component for displaying and editing user profile information',
        inputs: [
            {
                name: 'user',
                type: 'User',
                description: 'The user object to display',
                line: 15,
                defaultValue: 'null'
            },
            {
                name: 'editable',
                type: 'boolean',
                description: 'Whether the profile can be edited',
                line: 18,
                defaultValue: 'false'
            }
        ],
        outputs: [
            {
                name: 'userUpdated',
                type: 'EventEmitter<User>',
                description: 'Emitted when user profile is updated',
                line: 21
            }
        ],
        properties: [
            {
                name: 'isLoading',
                type: 'boolean',
                defaultValue: 'false',
                description: 'Loading state indicator',
                line: 25,
                modifierKind: [119] // public
            }
        ],
        methods: [
            {
                name: 'saveProfile',
                type: 'void',
                description: 'Saves the user profile changes',
                line: 30,
                modifierKind: [119], // public
                args: [
                    {
                        name: 'userData',
                        type: 'Partial<User>',
                        description: 'Updated user data'
                    }
                ]
            }
        ],
        implements: ['OnInit', 'OnDestroy'],
        hostListeners: [
            {
                name: 'window:resize',
                args: ['$event'],
                argsDecorator: ['$event'],
                description: 'Handle window resize events'
            }
        ],
        template: '<div class="user-profile">...</div>',
        styles: ['.user-profile { padding: 1rem; }'],
        readme: 'This component provides a comprehensive user profile management interface.',
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' },
            { href: '#template', id: 'template', label: 'template', 'data-link': 'template' },
            { href: '#styles', id: 'styles', label: 'styles', 'data-link': 'styles' },
            { href: '#dom-tree', id: 'dom-tree', label: 'dom-tree', 'data-link': 'dom-tree' }
        ]
    },

    module: {
        name: 'UserModule',
        file: 'src/app/modules/user/user.module.ts',
        deprecated: false,
        description: 'Module containing all user-related components and services',
        declarations: [
            { name: 'UserProfileComponent', type: 'component' },
            { name: 'UserListComponent', type: 'component' },
            { name: 'UserDirective', type: 'directive' }
        ],
        imports: [
            { name: 'CommonModule', type: 'module' },
            { name: 'FormsModule', type: 'module' },
            { name: 'HttpClientModule', type: 'module' }
        ],
        exports: [
            { name: 'UserProfileComponent', type: 'component' },
            { name: 'UserListComponent', type: 'component' }
        ],
        providers: [
            { name: 'UserService', type: 'service' },
            { name: 'UserResolver', type: 'resolver' }
        ],
        bootstrap: [],
        graph: '<svg>...</svg>', // SVG dependency graph
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },

    interface: {
        name: 'User',
        file: 'src/app/interfaces/user.interface.ts',
        deprecated: false,
        description: 'Interface defining the structure of a user object',
        properties: [
            {
                name: 'id',
                type: 'string',
                description: 'Unique identifier for the user',
                line: 3,
                optional: false
            },
            {
                name: 'email',
                type: 'string',
                description: 'User email address',
                line: 4,
                optional: false
            },
            {
                name: 'firstName',
                type: 'string',
                description: 'User first name',
                line: 5,
                optional: true
            },
            {
                name: 'lastName',
                type: 'string',
                description: 'User last name',
                line: 6,
                optional: true
            },
            {
                name: 'avatar',
                type: 'string',
                description: 'URL to user avatar image',
                line: 7,
                optional: true
            }
        ],
        indexSignatures: [],
        kind: 'interface',
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },

    class: {
        name: 'UserRepository',
        file: 'src/app/repositories/user.repository.ts',
        deprecated: false,
        description: 'Repository class for managing user data operations',
        constructorObj: {
            name: 'constructor',
            description: 'Creates an instance of UserRepository',
            args: [
                {
                    name: 'httpClient',
                    type: 'HttpClient',
                    description: 'HTTP client for API requests'
                }
            ]
        },
        properties: [
            {
                name: 'baseUrl',
                type: 'string',
                defaultValue: "'/api/users'",
                description: 'Base URL for user API endpoints',
                line: 10,
                modifierKind: [121] // private
            }
        ],
        methods: [
            {
                name: 'getUser',
                type: 'Observable<User>',
                description: 'Retrieves a user by ID',
                line: 15,
                modifierKind: [119], // public
                args: [
                    {
                        name: 'id',
                        type: 'string',
                        description: 'User ID'
                    }
                ]
            },
            {
                name: 'updateUser',
                type: 'Observable<User>',
                description: 'Updates user information',
                line: 20,
                modifierKind: [119], // public
                args: [
                    {
                        name: 'id',
                        type: 'string',
                        description: 'User ID'
                    },
                    {
                        name: 'userData',
                        type: 'Partial<User>',
                        description: 'Updated user data'
                    }
                ]
            }
        ],
        extends: ['BaseRepository'],
        implements: ['UserRepositoryInterface'],
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },

    injectable: {
        name: 'UserService',
        file: 'src/app/services/user.service.ts',
        deprecated: false,
        description: 'Service for managing user-related business logic',
        properties: [
            {
                name: 'currentUser$',
                type: 'BehaviorSubject<User | null>',
                defaultValue: 'new BehaviorSubject(null)',
                description: 'Observable stream of the current user',
                line: 12,
                modifierKind: [121] // private
            }
        ],
        methods: [
            {
                name: 'getCurrentUser',
                type: 'Observable<User | null>',
                description: 'Returns the current user as an observable',
                line: 18,
                modifierKind: [119] // public
            },
            {
                name: 'login',
                type: 'Observable<User>',
                description: 'Authenticates a user',
                line: 25,
                modifierKind: [119], // public
                args: [
                    {
                        name: 'credentials',
                        type: 'LoginCredentials',
                        description: 'User login credentials'
                    }
                ]
            }
        ],
        constructorObj: {
            name: 'constructor',
            description: 'Creates an instance of UserService',
            args: [
                {
                    name: 'userRepository',
                    type: 'UserRepository',
                    description: 'Repository for user data operations'
                }
            ]
        },
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },

    directive: {
        name: 'HighlightDirective',
        file: 'src/app/directives/highlight.directive.ts',
        deprecated: false,
        selector: '[appHighlight]',
        description: 'Directive for highlighting elements on hover',
        inputs: [
            {
                name: 'highlightColor',
                type: 'string',
                description: 'Color to use for highlighting',
                line: 10,
                defaultValue: "'yellow'"
            }
        ],
        hostListeners: [
            {
                name: 'mouseenter',
                args: [],
                description: 'Handle mouse enter events'
            },
            {
                name: 'mouseleave',
                args: [],
                description: 'Handle mouse leave events'
            }
        ],
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },

    pipe: {
        name: 'TruncatePipe',
        file: 'src/app/pipes/truncate.pipe.ts',
        deprecated: false,
        description: 'Pipe for truncating text to a specified length',
        methods: [
            {
                name: 'transform',
                type: 'string',
                description: 'Transforms the input text by truncating it',
                line: 8,
                modifierKind: [119], // public
                args: [
                    {
                        name: 'value',
                        type: 'string',
                        description: 'Text to truncate'
                    },
                    {
                        name: 'limit',
                        type: 'number',
                        description: 'Maximum length'
                    },
                    {
                        name: 'ellipsis',
                        type: 'string',
                        description: 'Ellipsis string to append'
                    }
                ]
            }
        ],
        implements: ['PipeTransform'],
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },

    guard: {
        name: 'AuthGuard',
        file: 'src/app/guards/auth.guard.ts',
        deprecated: false,
        description: 'Guard for protecting routes that require authentication',
        methods: [
            {
                name: 'canActivate',
                type: 'Observable<boolean> | Promise<boolean> | boolean',
                description: 'Determines if the route can be activated',
                line: 12,
                modifierKind: [119], // public
                args: [
                    {
                        name: 'route',
                        type: 'ActivatedRouteSnapshot',
                        description: 'Current route snapshot'
                    },
                    {
                        name: 'state',
                        type: 'RouterStateSnapshot',
                        description: 'Current router state'
                    }
                ]
            }
        ],
        implements: ['CanActivate'],
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },

    interceptor: {
        name: 'AuthInterceptor',
        file: 'src/app/interceptors/auth.interceptor.ts',
        deprecated: false,
        description: 'HTTP interceptor for adding authentication headers',
        methods: [
            {
                name: 'intercept',
                type: 'Observable<HttpEvent<any>>',
                description: 'Intercepts HTTP requests to add auth headers',
                line: 10,
                modifierKind: [119], // public
                args: [
                    {
                        name: 'req',
                        type: 'HttpRequest<any>',
                        description: 'HTTP request to intercept'
                    },
                    {
                        name: 'next',
                        type: 'HttpHandler',
                        description: 'Next handler in the chain'
                    }
                ]
            }
        ],
        implements: ['HttpInterceptor'],
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },

    entity: {
        name: 'UserEntity',
        file: 'src/app/entities/user.entity.ts',
        deprecated: false,
        description: 'Entity class representing a user in the database',
        properties: [
            {
                name: 'id',
                type: 'string',
                description: 'Primary key identifier',
                line: 5,
                decorators: ['@PrimaryGeneratedColumn()']
            },
            {
                name: 'email',
                type: 'string',
                description: 'User email address',
                line: 8,
                decorators: ['@Column({ unique: true })']
            }
        ],
        decorators: ['@Entity()'],
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },

    controller: {
        name: 'UserController',
        file: 'src/app/controllers/user.controller.ts',
        deprecated: false,
        description: 'REST controller for user operations',
        methods: [
            {
                name: 'getUsers',
                type: 'Promise<User[]>',
                description: 'Get all users',
                line: 12,
                modifierKind: [119], // public
                decorators: ['@Get()']
            },
            {
                name: 'getUserById',
                type: 'Promise<User>',
                description: 'Get user by ID',
                line: 18,
                modifierKind: [119], // public
                decorators: ['@Get(":id")'],
                args: [
                    {
                        name: 'id',
                        type: 'string',
                        description: 'User ID'
                    }
                ]
            }
        ],
        decorators: ['@Controller("users")'],
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },

    miscellaneous: {
        variables: [
            {
                name: 'API_BASE_URL',
                type: 'string',
                defaultValue: "'https://api.example.com'",
                description: 'Base URL for API endpoints',
                file: 'src/app/constants/api.constants.ts'
            }
        ],
        functions: [
            {
                name: 'formatDate',
                type: '(date: Date, format?: string) => string',
                description: 'Formats a date according to the specified format',
                file: 'src/app/utils/date.utils.ts'
            }
        ],
        typeAliases: [
            {
                name: 'UserId',
                type: 'string',
                description: 'Type alias for user identifier',
                file: 'src/app/types/user.types.ts'
            }
        ],
        enumerations: [
            {
                name: 'UserRole',
                description: 'Enumeration of user roles',
                file: 'src/app/enums/user-role.enum.ts',
                childs: [
                    { name: 'ADMIN', value: 'admin' },
                    { name: 'USER', value: 'user' },
                    { name: 'GUEST', value: 'guest' }
                ]
            }
        ]
    },

    overview: {
        modules: [
            { name: 'AppModule', file: 'src/app/app.module.ts' },
            { name: 'UserModule', file: 'src/app/modules/user/user.module.ts' }
        ],
        components: [
            { name: 'AppComponent', file: 'src/app/app.component.ts' },
            { name: 'UserProfileComponent', file: 'src/app/components/user-profile.component.ts' }
        ],
        injectables: [
            { name: 'UserService', file: 'src/app/services/user.service.ts' }
        ],
        pipes: [
            { name: 'TruncatePipe', file: 'src/app/pipes/truncate.pipe.ts' }
        ],
        directives: [
            { name: 'HighlightDirective', file: 'src/app/directives/highlight.directive.ts' }
        ],
        classes: [
            { name: 'UserRepository', file: 'src/app/repositories/user.repository.ts' }
        ],
        interfaces: [
            { name: 'User', file: 'src/app/interfaces/user.interface.ts' }
        ],
        guards: [
            { name: 'AuthGuard', file: 'src/app/guards/auth.guard.ts' }
        ],
        interceptors: [
            { name: 'AuthInterceptor', file: 'src/app/interceptors/auth.interceptor.ts' }
        ]
    },

    index: {
        modules: 2,
        components: 2,
        injectables: 1,
        pipes: 1,
        directives: 1,
        classes: 1,
        interfaces: 1,
        guards: 1,
        interceptors: 1
    }
};

// Global template context that's available to all templates
export const TEMPLATE_CONTEXT = {
    // Translation function
    t: (key: string) => {
        const translations: { [key: string]: string } = {
            'components': 'Components',
            'modules': 'Modules',
            'interfaces': 'Interfaces',
            'classes': 'Classes',
            'injectables': 'Injectables',
            'pipes': 'Pipes',
            'directives': 'Directives',
            'guards': 'Guards',
            'interceptors': 'Interceptors',
            'entities': 'Entities',
            'controllers': 'Controllers',
            'info': 'Info',
            'readme': 'Readme',
            'source': 'Source',
            'template': 'Template',
            'styles': 'Styles',
            'dom-tree': 'DOM Tree',
            'file': 'File',
            'overview': 'Overview',
            'getting-started': 'Getting Started',
            'properties': 'Properties',
            'methods': 'Methods',
            'inputs': 'Inputs',
            'outputs': 'Outputs',
            'accessors': 'Accessors',
            'constructor': 'Constructor',
            'zoomin': 'Zoom In',
            'zoomout': 'Zoom Out',
            'reset': 'Reset'
        };
        return translations[key] || key;
    },

    // Relative URL helper
    relativeURL: (depth: number | string, ...args: string[]) => {
        const baseUrl = typeof depth === 'number' ? '../'.repeat(depth) : depth;
        return baseUrl + args.join('/');
    },

    // Template helpers
    compare: (a: any, operator: string, b: any) => {
        switch (operator) {
            case '===': return a === b;
            case '!==': return a !== b;
            case '==': return a == b;
            case '!=': return a != b;
            case '<': return a < b;
            case '>': return a > b;
            case '<=': return a <= b;
            case '>=': return a >= b;
            default: return false;
        }
    },

    // Check if tab is enabled
    isTabEnabled: (navTabs: any[], tabId: string) => {
        return navTabs.some(tab => tab.id === tabId);
    },

    // Check if tab is initial/active
    isInitialTab: (navTabs: any[], tabId: string) => {
        return navTabs.length > 0 && navTabs[0].id === tabId;
    },

    // Depth for relative URLs
    depth: 0,

    // Global flags
    disableSearch: false,
    disableGraph: false,
    disableCoverage: false,
    disableLifeCycleHooks: false,
    disableProperties: false,
    disableDomTree: false,
    disableTemplateTab: false,
    disableStyleTab: false,
    disablePrivate: false,
    disableProtected: false,
    disableInternal: false
};
