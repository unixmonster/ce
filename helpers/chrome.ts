
import { LaunchedChrome, launch } from 'chrome-launcher';

interface ChromeLaunchOptions {

    // (optional) remote debugging port number to use. If provided port is already busy, launch() will reject
    // Default: an available port is autoselected
    port?: number;

    // (optional) Additional flags to pass to Chrome, for example: ['--headless', '--disable-gpu']
    // See: https://github.com/GoogleChrome/chrome-launcher/blob/master/docs/chrome-flags-for-tools.md
    // Do note, many flags are set by default: https://github.com/GoogleChrome/chrome-launcher/blob/master/src/flags.ts
    chromeFlags?: Array<string>;

    // (optional) Close the Chrome process on `Ctrl-C`
    // Default: true
    handleSIGINT?: boolean;

    // (optional) Explicit path of intended Chrome binary
    // * If this `chromePath` option is defined, it will be used.
    // * Otherwise, the `CHROME_PATH` env variable will be used if set. (`LIGHTHOUSE_CHROMIUM_PATH` is deprecated)
    // * Otherwise, a detected Chrome Canary will be used if found
    // * Otherwise, a detected Chrome (stable) will be used
    chromePath?: string;

    // (optional) Chrome profile path to use, if set to `false` then the default profile will be used.
    // By default, a fresh Chrome profile will be created
    userDataDir?: string | boolean;

    // (optional) Starting URL to open the browser with
    // Default: `about:blank`
    startingUrl?: string;

    // (optional) Logging level
    // Default: 'silent'
    logLevel?: 'verbose' | 'info' | 'error' | 'silent';

    // (optional) Flags specific in [flags.ts](src/flags.ts) will not be included.
    // Typically used with the defaultFlags() method and chromeFlags option.
    // Default: false
    ignoreDefaultFlags?: boolean;

    // (optional) Interval in ms, which defines how often launcher checks browser port to be ready.
    // Default: 500
    connectionPollInterval?: number;

    // (optional) A number of retries, before browser launch considered unsuccessful.
    // Default: 50
    maxConnectionRetries?: number;

    // (optional) A dict of environmental key value pairs to pass to the spawned chrome process.
    envVars?: { [key: string]: string };


}

async function launchChrome(chromeOpts: ChromeLaunchOptions, headless?: boolean) {

    let launched: LaunchedChrome = {
        //pid: chrome.pid,
        //port: chrome.port,
        //process: chrome.process,
        //kill: () => new Promise<{}> {}
        pid: null,
        port: null,
        process: null,
        kill: null
    }

    if (headless === true) {

        launched = await launch({
            ...chromeOpts,
            //startingUrl: 'https://google.com',
            chromeFlags: ['--headless', '--disable-gpu']
        });

    } else {

        launched = await launch({
            ...chromeOpts,
            chromeFlags: ['--app=http://localdev.fvdev.com:5000/']
        });
    }

    return launched;
}

export { ChromeLaunchOptions, launchChrome }
