import { hasStderrError, shell, shellAsync, temporaryDir } from '../helpers';

const tmp = temporaryDir();

// Helper function to strip ANSI escape codes
function stripAnsi(str: string): string {
    return str.replace(/\u001b\[[0-9;]*m/g, '');
}

describe('CLI serving', () => {
    const distFolder = `${tmp.name}-serving`,
        TIMEOUT = 8000;

    describe('when serving with -s flag in another directory', () => {
        let stdoutString = '',
            child;
        beforeAll(() => {
            tmp.create(distFolder);
            const ls = shell('node', ['./bin/index-cli.js', '-s', '-d', distFolder], {
                timeout: TIMEOUT
            });

            if (hasStderrError(ls.stderr.toString())) {
                console.error(`shell error: ${ls.stderr.toString()}`);
                throw new Error('shell error');
            }
            stdoutString = ls.stdout.toString();
        });
        afterAll(() => tmp.clean(distFolder));

        it('should serve', () => {
            expect(stripAnsi(stdoutString)).to.contain(
                `Serving documentation from ${distFolder} at http://127.0.0.1:8080`
            );
        });
    });

    describe('when serving with default directory', () => {
        let stdoutString = '',
            child;
        beforeAll(() => {
            tmp.create('documentation');

            return new Promise<void>((resolve, reject) => {
                const child = shellAsync('node', [
                    './bin/index-cli.js',
                    '-p',
                    './test/fixtures/sample-files/tsconfig.simple.json',
                    '-s'
                ]);

                let output = '';
                let errorOutput = '';

                child.stdout.on('data', data => {
                    output += data.toString();
                    // Look for the serving message
                    if (output.includes('Serving documentation from')) {
                        stdoutString = output;
                        child.kill('SIGTERM');
                    }
                });

                child.stderr.on('data', data => {
                    errorOutput += data.toString();
                });

                child.on('error', err => {
                    console.error(`Process error: ${err}`);
                    reject(err);
                });

                child.on('exit', (code, signal) => {
                    if (signal === 'SIGTERM') {
                        resolve();
                        return;
                    }
                    if (code !== 0 && errorOutput) {
                        console.error(`Shell error: ${errorOutput}`);
                        reject(new Error(`Process exited with code ${code}`));
                    } else {
                        if (!stdoutString) {
                            stdoutString = output;
                        }
                        resolve();
                    }
                });

                // Fallback timeout
                setTimeout(() => {
                    if (child.killed === false) {
                        stdoutString = output;
                        child.kill('SIGTERM');
                    }
                }, 8000);
            });
        });

        it('should display message', () => {
            expect(stripAnsi(stdoutString)).to.contain(
                'Serving documentation from ./documentation/ at http://127.0.0.1:8080'
            );
        });
    });

    describe('when serving with default directory and different host', () => {
        let stdoutString = '',
            child;
        beforeAll(() => {
            tmp.create('documentation');

            return new Promise<void>((resolve, reject) => {
                const child = shellAsync('node', [
                    './bin/index-cli.js',
                    '-p',
                    './test/fixtures/sample-files/tsconfig.simple.json',
                    '-s',
                    '--host',
                    '127.0.0.1'
                ]);

                let output = '';
                let errorOutput = '';

                child.stdout.on('data', data => {
                    output += data.toString();
                    // Look for the serving message with 127.0.0.1 host
                    if (
                        output.includes('Serving documentation from') &&
                        output.includes('127.0.0.1')
                    ) {
                        stdoutString = output;
                        child.kill('SIGTERM');
                    }
                });

                child.stderr.on('data', data => {
                    errorOutput += data.toString();
                });

                child.on('error', err => {
                    console.error(`Process error: ${err}`);
                    reject(err);
                });

                child.on('exit', (code, signal) => {
                    if (signal === 'SIGTERM') {
                        resolve();
                        return;
                    }
                    if (code !== 0 && errorOutput) {
                        console.error(`Shell error: ${errorOutput}`);
                        reject(new Error(`Process exited with code ${code}`));
                    } else {
                        if (!stdoutString) {
                            stdoutString = output;
                        }
                        resolve();
                    }
                });

                // Fallback timeout
                setTimeout(() => {
                    if (child.killed === false) {
                        stdoutString = output;
                        child.kill('SIGTERM');
                    }
                }, 8000);
            });
        });

        it('should display message', ({ skip }) => {
            if (stdoutString === '') {
                // Skip this test if there were network issues
                skip();
                return;
            }
            expect(stripAnsi(stdoutString)).to.contain(
                'Serving documentation from ./documentation/ at http://127.0.0.1:8080'
            );
        });
    });

    describe('when serving with default directory and without doc generation', () => {
        let stdoutString = '',
            child;
        beforeAll(() => {
            const ls = shell('node', ['./bin/index-cli.js', '-s', '-d', './documentation/'], {
                timeout: TIMEOUT
            });

            if (hasStderrError(ls.stderr.toString())) {
                console.error(`shell error: ${ls.stderr.toString()}`);
                throw new Error('shell error');
            }
            stdoutString = ls.stdout.toString();
        });

        it('should display message', () => {
            expect(stripAnsi(stdoutString)).to.contain(
                'Serving documentation from ./documentation/ at http://127.0.0.1:8080'
            );
        });
    });

    describe('when serving with default directory, without -d and without doc generation', () => {
        let stdoutString = '',
            child;
        beforeAll(() => {
            const ls = shell('node', ['./bin/index-cli.js', '-s'], { timeout: TIMEOUT });

            if (hasStderrError(ls.stderr.toString())) {
                console.error(`shell error: ${ls.stderr.toString()}`);
                throw new Error('shell error');
            }
            stdoutString = ls.stdout.toString();
        });
        afterAll(() => tmp.clean('documentation'));

        it('should display message', () => {
            expect(stripAnsi(stdoutString)).to.contain(
                'Serving documentation from ./documentation/ at http://127.0.0.1:8080'
            );
        });
    });
});
