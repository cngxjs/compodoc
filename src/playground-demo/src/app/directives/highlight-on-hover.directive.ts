import {
  Directive,
  ElementRef,
  Input,
  HostListener,
  Renderer2,
  OnInit,
  OnDestroy
} from '@angular/core';

/**
 * Configuration options for the highlight directive
 */
export interface HighlightConfig {
  /** The highlight color (CSS color value) */
  color?: string;
  /** The background color when highlighted */
  backgroundColor?: string;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Whether to use CSS transitions */
  useTransition?: boolean;
  /** Additional CSS classes to apply on hover */
  cssClasses?: string[];
}

/**
 * Directive that adds hover highlighting effects to elements.
 *
 * This directive provides customizable hover effects including color changes,
 * background highlighting, and smooth transitions. It's useful for improving
 * user interaction feedback across the application.
 *
 * @example
 * Basic usage:
 * ```html
 * <div appHighlightOnHover>Hover over me!</div>
 * ```
 *
 * @example
 * With custom colors:
 * ```html
 * <div appHighlightOnHover
 *      [highlightColor]="'#ff0000'"
 *      [backgroundColor]="'#ffeeee'">
 *   Custom highlight colors
 * </div>
 * ```
 *
 * @example
 * With configuration object:
 * ```html
 * <div appHighlightOnHover [highlightConfig]="myConfig">
 *   Configured highlight
 * </div>
 * ```
 *
 * @example
 * In component TypeScript:
 * ```typescript
 * export class MyComponent {
 *   myConfig: HighlightConfig = {
 *     color: '#007bff',
 *     backgroundColor: '#e3f2fd',
 *     duration: 300,
 *     useTransition: true,
 *     cssClasses: ['highlighted', 'interactive']
 *   };
 * }
 * ```
 */
@Directive({
  selector: '[appHighlightOnHover]'
})
export class HighlightOnHoverDirective implements OnInit, OnDestroy {

  /**
   * The color to apply to text when hovering
   *
   * @default '#007bff'
   *
   * @example
   * ```html
   * <div appHighlightOnHover highlightColor="#ff5722">Red text on hover</div>
   * ```
   */
  @Input() highlightColor: string = '#007bff';

  /**
   * The background color to apply when hovering
   *
   * @default '#f8f9fa'
   *
   * @example
   * ```html
   * <div appHighlightOnHover backgroundColor="#e8f5e8">Green background on hover</div>
   * ```
   */
  @Input() backgroundColor: string = '#f8f9fa';

  /**
   * Comprehensive configuration object for the highlight behavior
   *
   * @example
   * ```html
   * <div appHighlightOnHover [highlightConfig]="config">Configured element</div>
   * ```
   */
  @Input() highlightConfig?: HighlightConfig;

  /**
   * Whether the highlight effect is currently disabled
   *
   * @default false
   *
   * @example
   * ```html
   * <div appHighlightOnHover [disabled]="isFormSubmitting">
   *   Conditionally disabled highlight
   * </div>
   * ```
   */
  @Input() disabled: boolean = false;

  /** Original styles before hover effect */
  private originalStyles: {
    color?: string;
    backgroundColor?: string;
    transition?: string;
  } = {};

  /** Whether the element is currently being hovered */
  private isHovered: boolean = false;

  /** Applied CSS classes that need to be removed */
  private appliedCssClasses: string[] = [];

  /**
   * Creates an instance of HighlightOnHoverDirective.
   *
   * @param el - Reference to the host element
   * @param renderer - Angular Renderer2 for safe DOM manipulation
   */
  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {}

  /**
   * Initialize the directive and store original styles
   */
  ngOnInit(): void {
    this.storeOriginalStyles();
    this.setupTransitions();

    console.log('HighlightOnHoverDirective initialized on element:', this.el.nativeElement.tagName);
  }

  /**
   * Clean up when directive is destroyed
   */
  ngOnDestroy(): void {
    this.restoreOriginalStyles();
    console.log('HighlightOnHoverDirective destroyed');
  }

  /**
   * Handle mouse enter events
   *
   * @param event - The mouse event
   */
  @HostListener('mouseenter', ['$event'])
  onMouseEnter(event: MouseEvent): void {
    if (this.disabled) return;

    this.isHovered = true;
    this.applyHighlight();

    console.log('Mouse entered element, applying highlight');
  }

  /**
   * Handle mouse leave events
   *
   * @param event - The mouse event
   */
  @HostListener('mouseleave', ['$event'])
  onMouseLeave(event: MouseEvent): void {
    if (this.disabled) return;

    this.isHovered = false;
    this.removeHighlight();

    console.log('Mouse left element, removing highlight');
  }

  /**
   * Handle focus events for keyboard accessibility
   *
   * @param event - The focus event
   */
  @HostListener('focus', ['$event'])
  onFocus(event: FocusEvent): void {
    if (this.disabled) return;

    this.applyHighlight();
    console.log('Element focused, applying highlight');
  }

  /**
   * Handle blur events for keyboard accessibility
   *
   * @param event - The blur event
   */
  @HostListener('blur', ['$event'])
  onBlur(event: FocusEvent): void {
    if (this.disabled || this.isHovered) return;

    this.removeHighlight();
    console.log('Element blurred, removing highlight');
  }

  /**
   * Store the original styles of the element before applying effects
   *
   * @private
   */
  private storeOriginalStyles(): void {
    const computedStyles = window.getComputedStyle(this.el.nativeElement);

    this.originalStyles = {
      color: computedStyles.color,
      backgroundColor: computedStyles.backgroundColor,
      transition: computedStyles.transition
    };
  }

  /**
   * Set up CSS transitions if enabled in configuration
   *
   * @private
   */
  private setupTransitions(): void {
    const config = this.getEffectiveConfig();

    if (config.useTransition) {
      const duration = config.duration || 200;
      const transition = `color ${duration}ms ease, background-color ${duration}ms ease`;
      this.renderer.setStyle(this.el.nativeElement, 'transition', transition);
    }
  }

  /**
   * Apply the highlight effect to the element
   *
   * @private
   */
  private applyHighlight(): void {
    const config = this.getEffectiveConfig();

    // Apply color changes
    if (config.color) {
      this.renderer.setStyle(this.el.nativeElement, 'color', config.color);
    }

    if (config.backgroundColor) {
      this.renderer.setStyle(this.el.nativeElement, 'background-color', config.backgroundColor);
    }

    // Apply additional CSS classes
    if (config.cssClasses && config.cssClasses.length > 0) {
      config.cssClasses.forEach(cssClass => {
        this.renderer.addClass(this.el.nativeElement, cssClass);
        this.appliedCssClasses.push(cssClass);
      });
    }
  }

  /**
   * Remove the highlight effect from the element
   *
   * @private
   */
  private removeHighlight(): void {
    // Restore original styles
    if (this.originalStyles.color) {
      this.renderer.setStyle(this.el.nativeElement, 'color', this.originalStyles.color);
    } else {
      this.renderer.removeStyle(this.el.nativeElement, 'color');
    }

    if (this.originalStyles.backgroundColor) {
      this.renderer.setStyle(this.el.nativeElement, 'background-color', this.originalStyles.backgroundColor);
    } else {
      this.renderer.removeStyle(this.el.nativeElement, 'background-color');
    }

    // Remove applied CSS classes
    this.appliedCssClasses.forEach(cssClass => {
      this.renderer.removeClass(this.el.nativeElement, cssClass);
    });
    this.appliedCssClasses = [];
  }

  /**
   * Restore all original styles when directive is destroyed
   *
   * @private
   */
  private restoreOriginalStyles(): void {
    this.removeHighlight();

    // Restore original transition
    if (this.originalStyles.transition) {
      this.renderer.setStyle(this.el.nativeElement, 'transition', this.originalStyles.transition);
    } else {
      this.renderer.removeStyle(this.el.nativeElement, 'transition');
    }
  }

  /**
   * Get the effective configuration by merging input properties and config object
   *
   * @returns The merged configuration
   * @private
   */
  private getEffectiveConfig(): HighlightConfig {
    const baseConfig: HighlightConfig = {
      color: this.highlightColor,
      backgroundColor: this.backgroundColor,
      duration: 200,
      useTransition: true,
      cssClasses: []
    };

    return {
      ...baseConfig,
      ...this.highlightConfig
    };
  }

  /**
   * Programmatically trigger the highlight effect
   *
   * @example
   * ```typescript
   * @ViewChild(HighlightOnHoverDirective) highlightDirective!: HighlightOnHoverDirective;
   *
   * triggerHighlight() {
   *   this.highlightDirective.highlight();
   * }
   * ```
   */
  highlight(): void {
    if (this.disabled) return;

    this.applyHighlight();
    console.log('Highlight applied programmatically');
  }

  /**
   * Programmatically remove the highlight effect
   *
   * @example
   * ```typescript
   * @ViewChild(HighlightOnHoverDirective) highlightDirective!: HighlightOnHoverDirective;
   *
   * removeHighlightEffect() {
   *   this.highlightDirective.removeHighlightEffect();
   * }
   * ```
   */
  removeHighlightEffect(): void {
    this.removeHighlight();
    console.log('Highlight removed programmatically');
  }

  /**
   * Toggle the highlight effect on/off
   *
   * @returns True if highlight is now active, false if removed
   *
   * @example
   * ```typescript
   * @ViewChild(HighlightOnHoverDirective) highlightDirective!: HighlightOnHoverDirective;
   *
   * toggleHighlight() {
   *   const isActive = this.highlightDirective.toggle();
   *   console.log('Highlight is now:', isActive ? 'active' : 'inactive');
   * }
   * ```
   */
  toggle(): boolean {
    if (this.disabled) return false;

    const isCurrentlyHighlighted = this.el.nativeElement.style.color !== this.originalStyles.color;

    if (isCurrentlyHighlighted) {
      this.removeHighlight();
      return false;
    } else {
      this.applyHighlight();
      return true;
    }
  }
}
