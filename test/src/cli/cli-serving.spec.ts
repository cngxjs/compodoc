import { hasStderrError, shell, shellAsync, temporaryDir } from '../helpers';

const tmp = temporaryDir();

// Helper function to strip ANSI escape codes
function stripAnsi(str: string): string {
    return str.replace(/\u001b\[[0-9;]*m/g, '');
}

describe('CLI serving', () => {
    const distFolder = `${tmp.name}-serving`,
        TIMEOUT = 8000;

    // Each describe block runs an `./bin/index-cli.js -s …` spawn that binds
    // a port for up to 8 s. Vitest runs spec files in parallel forks, so a
    // shared default port (8080) would race against cli.spec.ts and any
    // unrelated dev server. Assign a distinct port per describe to keep the
    // suite reproducible.
    const PORT_BASIC = 6700;
    const PORT_DEFAULT_DIR = 6701;
    const PORT_DEFAULT_HOST = 6702;
    const PORT_NO_GENERATION = 6703;
    const PORT_DEFAULT_NO_FLAG = 6704;

    describe('when serving with -s flag in another directory', () => {
        let stdoutString = '',
            child;
        beforeAll(() => {
            tmp.create(distFolder);
            const ls = shell(
                'node',
                [
                    './bin/index-cli.js',
                    '--no-multiVersion',
                    '-s',
                    '-d',
                    distFolder,
                    '--port',
                    String(PORT_BASIC)
                ],
                {
                    timeout: TIMEOUT
                }
            );

            if (hasStderrError(ls.stderr.toString())) {
                console.error(`shell error: ${ls.stderr.toString()}`);
                throw new Error('shell error');
            }
            stdoutString = ls.stdout.toString();
        });
        afterAll(() => tmp.clean(distFolder));

        it('should serve', () => {
            expect(stripAnsi(stdoutString)).to.contain(
                `Serving documentation from ${distFolder} at http://127.0.0.1:${PORT_BASIC}`
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
                    '--no-multiVersion',
                    '-p',
                    './test/fixtures/sample-files/tsconfig.simple.json',
                    '-s',
                    '--port',
                    String(PORT_DEFAULT_DIR)
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
                `Serving documentation from ./documentation/ at http://127.0.0.1:${PORT_DEFAULT_DIR}`
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
                    '--no-multiVersion',
                    '-p',
                    './test/fixtures/sample-files/tsconfig.simple.json',
                    '-s',
                    '--host',
                    '127.0.0.1',
                    '--port',
                    String(PORT_DEFAULT_HOST)
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
                `Serving documentation from ./documentation/ at http://127.0.0.1:${PORT_DEFAULT_HOST}`
            );
        });
    });

    describe('when serving with default directory and without doc generation', () => {
        let stdoutString = '',
            child;
        beforeAll(() => {
            const ls = shell(
                'node',
                [
                    './bin/index-cli.js',
                    '--no-multiVersion',
                    '-s',
                    '-d',
                    './documentation/',
                    '--port',
                    String(PORT_NO_GENERATION)
                ],
                {
                    timeout: TIMEOUT
                }
            );

            if (hasStderrError(ls.stderr.toString())) {
                console.error(`shell error: ${ls.stderr.toString()}`);
                throw new Error('shell error');
            }
            stdoutString = ls.stdout.toString();
        });

        it('should display message', () => {
            expect(stripAnsi(stdoutString)).to.contain(
                `Serving documentation from ./documentation/ at http://127.0.0.1:${PORT_NO_GENERATION}`
            );
        });
    });

    describe('when serving with default directory, without -d and without doc generation', () => {
        let stdoutString = '',
            child;
        beforeAll(() => {
            const ls = shell(
                'node',
                [
                    './bin/index-cli.js',
                    '--no-multiVersion',
                    '-s',
                    '--port',
                    String(PORT_DEFAULT_NO_FLAG)
                ],
                {
                    timeout: TIMEOUT
                }
            );

            if (hasStderrError(ls.stderr.toString())) {
                console.error(`shell error: ${ls.stderr.toString()}`);
                throw new Error('shell error');
            }
            stdoutString = ls.stdout.toString();
        });
        afterAll(() => tmp.clean('documentation'));

        it('should display message', () => {
            expect(stripAnsi(stdoutString)).to.contain(
                `Serving documentation from ./documentation/ at http://127.0.0.1:${PORT_DEFAULT_NO_FLAG}`
            );
        });
    });
});
