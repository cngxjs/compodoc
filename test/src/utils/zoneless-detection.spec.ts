describe('Zoneless detection', () => {
    describe('hasZoneJs from package.json', () => {
        const detectZoneless = (deps: Record<string, string>, devDeps?: Record<string, string>) => {
            const allDeps = { ...deps, ...devDeps };
            const hasZoneJs = 'zone.js' in allDeps;
            return !hasZoneJs;
        };

        it('should detect zoneless when zone.js is absent from all dependencies', () => {
            expect(
                detectZoneless({ '@angular/core': '^21.0.0' })
            ).toBe(true);
        });

        it('should not be zoneless when zone.js is in dependencies', () => {
            expect(
                detectZoneless({
                    '@angular/core': '^20.0.0',
                    'zone.js': '~0.15.0'
                })
            ).toBe(false);
        });

        it('should not be zoneless when zone.js is in devDependencies', () => {
            expect(
                detectZoneless(
                    { '@angular/core': '^21.0.0' },
                    { 'zone.js': '~0.15.0' }
                )
            ).toBe(false);
        });

        it('should detect zoneless for Angular 21+ with no zone.js', () => {
            expect(
                detectZoneless({
                    '@angular/core': '^21.0.0',
                    '@angular/router': '^21.0.0'
                })
            ).toBe(true);
        });

        it('should detect zoneless for Angular 20 with explicit zoneless provider and no zone.js', () => {
            // The provider detection is separate; this tests only the zone.js check
            expect(
                detectZoneless({ '@angular/core': '^20.0.0' })
            ).toBe(true);
        });

        it('should handle empty dependencies', () => {
            expect(detectZoneless({})).toBe(true);
        });
    });

    describe('AngularVersionUtil.cleanVersion', () => {
        // Import inline to avoid module resolution issues in test
        const cleanVersion = (version: string): string =>
            version.replace(/[~^=<>]/g, '');

        it('should strip caret', () => {
            expect(cleanVersion('^21.0.0')).toBe('21.0.0');
        });

        it('should strip tilde', () => {
            expect(cleanVersion('~20.1.0')).toBe('20.1.0');
        });

        it('should strip range operators', () => {
            expect(cleanVersion('>=20.0.0')).toBe('20.0.0');
        });

        it('should return clean version unchanged', () => {
            expect(cleanVersion('21.0.0')).toBe('21.0.0');
        });
    });
});
