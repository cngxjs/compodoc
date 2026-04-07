export enum AngularLifecycleHooks {
    // Classic interface-based hooks
    ngOnChanges,
    ngOnInit,
    ngDoCheck,
    ngAfterContentInit,
    ngAfterContentChecked,
    ngAfterViewInit,
    ngAfterViewChecked,
    ngOnDestroy,

    // Function-based render hooks (v16.2+, stable v19+)
    afterRender,
    afterNextRender,
    afterEveryRender,
    afterRenderEffect
}
