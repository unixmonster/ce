// Native
import http from 'http';
import https from 'https';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { parse } from 'url';

// Packages
import Ajv from 'ajv';
import boxen from 'boxen';
import compression from 'compression';
import chalk from 'chalk';
import clipboardy from 'clipboardy';

// Supplied in this code base
import arg from './helpers/arg';
import * as schema from './helpers/config-static'
import ceHandler from './helpers/ceHandler';
import { getNetworkAddress } from './helpers/functions'
import { error, getHelp, info, pkg, warning, updateCheck } from './helpers/info'
import { ChromeLaunchOptions, launchChrome } from './helpers/chrome';

// Debug Setup
import Debug from 'debug';
const debug = Debug('ce.ts');



/**
 *
 *      V A R I A B L E S
 *
 */
const readFile = promisify(fs.readFile);
const compressionHandler = promisify(compression());

const chromeOpts: ChromeLaunchOptions = {

    //port: 9996,
    //chromeFlags: ['--disable-extensions'],
    // handleSIGINT: true,
    handleSIGINT: true,
    //chromePath: "",
    userDataDir: false,
    startingUrl: 'http://localdev.fvdev.com:5000',
    // logLevel: 'verbose' | 'info' | 'error' | 'silent';
    logLevel: 'error',
    ignoreDefaultFlags: false,
    connectionPollInterval: 500,
    maxConnectionRetries: 50,

    // (optional) A dict of environmental key value pairs to pass to the spawned chrome process.
    //envVars: { [key: string]: string };
    //envVars: {}
}

/*
launchChrome(chromeOpts, true).then((chrome) => {

    // try {
    console.log('LAUNCHING_CHROME HeadLess');

    // The remote debugging port exposed by the launched chrome
    console.log(`launched chrome on port: ${chrome.port}`);

    // Method to kill Chrome (and cleanup the profile folder)
    //chrome.kill: () => Promise<{}>;

    // The process id
    console.log(`chrome is using process.pid: ${chrome.pid}`);

    // The childProcess object for the launched Chrome
    // console.log(`chrome childProcess: ${JSON.stringify(chrome.process, null, 2)}`);

    return chrome;

});

*/


launchChrome(chromeOpts).then((chrome) => {
    // try {
    console.log('LAUNCHING_CHROME');
    console.log(`launched chrome on port: ${chrome.port}`);
    console.log(`chrome is using process.pid: ${chrome.pid}`);
    // console.log(`chrome childProcess: ${JSON.stringify(chrome.process, null, 2)}`);
    return chrome;

    // } catch (error) {
    //     return Error
    // }
});












/**
 *      p a r s e E n d p o i n t
 *
 * @param str
 */
const parseEndpoint = (str: any) => {
    debug(`ce:parseEndpoint()`);
    if (!isNaN(str)) {
        return [str];
    }

    // We cannot use `new URL` here, otherwise it will not
    // parse the host properly and it would drop support for IPv6.
    const url = parse(str);

    switch (url.protocol) {
        case 'pipe:': {
            // some special handling
            const cutStr = str.replace(/^pipe:/, '');

            if (cutStr.slice(0, 4) !== '\\\\.\\') {
                throw new Error(`Invalid Windows named pipe endpoint: ${str}`);
            }

            return [cutStr];
        }
        case 'unix:':
            if (!url.pathname) {
                throw new Error(`Invalid UNIX domain socket endpoint: ${str}`);
            }

            return [url.pathname];
        case 'tcp:':
            url.port = url.port || '5000';
            return [parseInt(url.port, 10), url.hostname];
        default:
            throw new Error(`Unknown --listen endpoint scheme (protocol): ${url.protocol}`);
    }
};



/**
 *      r e g i s t e r  S h u t d o w n
 *
 * @param fn
 */
const registerShutdown = (fn: any) => {
    debug(`ce:registerShutdown()`);
    let run = false;

    const wrapper = () => {
        if (!run) {
            run = true;
            fn();
        }
    };

    process.on('SIGINT', wrapper);
    process.on('SIGTERM', wrapper);
    process.on('exit', wrapper);
};







/**
 *      s t a r t E n d p o i n t
 *
 * @param endpoint
 * @param config
 * @param args
 * @param previous
 */
const startEndpoint = (endpoint: any, config: any, args: any, previous?: any) => {
    debug(`ce:startEndpoint`);
    const { isTTY } = process.stdout;
    const clipboard = args['--no-clipboard'] !== true;
    const compress = args['--no-compression'] !== true;
    const httpMode = args['--ssl-cert'] && args['--ssl-key'] ? 'https' : 'http';

    const serverHandler = async (request: any, response: any) => {
        debug(`ce:startEndpoint:serveHandler`);
        if (args['--cors']) {
            response.setHeader('Access-Control-Allow-Origin', '*');
        }
        if (compress) {
            await compressionHandler(request, response);
        }

        return new ceHandler(request, response, config);
    };

    const server = httpMode === 'https'
        ? https.createServer({
            key: fs.readFileSync(args['--ssl-key']),
            cert: fs.readFileSync(args['--ssl-cert'])
        }, serverHandler)
        : http.createServer(serverHandler);

    server.on('error', (err) => {
        if (err.message === 'EADDRINUSE' && endpoint.length === 1 && !isNaN(endpoint[0])) {
            startEndpoint([0], config, args, endpoint[0]);
            return;
        }

        console.error(error(`Failed to serve: ${err.stack}`));
        process.exit(1);
    });



    server.listen(...endpoint, async () => {
        const details = server.address();
        registerShutdown(() => server.close());

        let localAddress = null;
        let networkAddress = null;

        if (typeof details === 'string') {
            localAddress = details;
        } else if (typeof details === 'object' && details.port) {
            const address = details.address === '::' ? 'localhost' : details.address;
            const ip = getNetworkAddress();

            localAddress = `${httpMode}://${address}:${details.port}`;
            networkAddress = `${httpMode}://${ip}:${details.port}`;
        }

        if (isTTY && process.env.NODE_ENV !== 'production') {
            let message = chalk.green('Serving!');

            if (localAddress) {
                const prefix = networkAddress ? '- ' : '';
                const space = networkAddress ? '            ' : '  ';

                message += `\n\n${chalk.bold(`${prefix}Local:`)}${space}${localAddress}`;
            }

            if (networkAddress) {
                message += `\n${chalk.bold('- On Your Network:')}  ${networkAddress}`;
            }

            if (previous) {
                message += chalk.red(`\n\nThis port was picked because ${chalk.underline(previous)} is in use.`);
            }

            if (clipboard) {
                try {
                    await clipboardy.write(localAddress);
                    message += `\n\n${chalk.grey('Copied local address to clipboard!')}`;
                } catch (err) {
                    console.error(error(`Cannot copy to clipboard: ${err.message}`));
                }
            }

            console.log(boxen(message, {
                padding: 1,
                borderColor: 'green',
                margin: 1
            }));
        } else {
            const suffix = localAddress ? ` at ${localAddress}` : '';
            console.log(info(`Accepting connections${suffix}`));
        }
    });
};


/**
 *      l o a d C o n f i g
 *
 * @param cwd
 * @param entry
 * @param args
 */
const loadConfig = async (cwd: string, entry, args) => {
    debug(`ce:loadConfig()`);
    const files = [
        'ce.json'
    ];

    if (args['--config']) {
        files.unshift(args['--config']);
    }

    const config: any = {};

    for (const file of files) {
        const location = path.resolve(entry, file);
        let content = null;

        try {
            content = await readFile(location, 'utf8');
        } catch (err) {
            if (err.code === 'ENOENT') {
                continue;
            }

            console.error(error(`Not able to read ${location}: ${err.message}`));
            process.exit(1);
        }

        try {
            content = JSON.parse(content);
        } catch (err) {
            console.error(error(`Could not parse ${location} as JSON: ${err.message}`));
            process.exit(1);
        }

        if (typeof content !== 'object') {
            console.error(warning(`Didn't find a valid object in ${location}. Skipping...`));
            continue;
        }

        try {
            switch (file) {
                case 'now.json':
                    content = content.static;
                    break;
                case 'package.json':
                    content = content.now.static;
                    break;
            }
        } catch (err) {
            continue;
        }

        Object.assign(config, content);
        console.log(info(`Discovered configuration in \`${file}\``));

        if (file === 'now.json' || file === 'package.json') {
            console.error(warning('The config files `now.json` and `package.json` are deprecated. Please use `serve.json`.'));
        }

        break;
    }

    if (entry) {
        const { publicStuff } = config;
        config.publicStuff = path.relative(cwd, (publicStuff ? path.resolve(entry, publicStuff) : entry));
    }

    if (Object.keys(config).length !== 0) {
        const ajv = new Ajv();
        const validateSchema = ajv.compile(schema);

        if (!validateSchema(config)) {
            const defaultMessage = error('The configuration you provided is wrong:');
            const { message, params } = validateSchema.errors[0];

            console.error(`${defaultMessage}\n${message}\n${JSON.stringify(params)}`);
            process.exit(1);
        }
    }

    // "ETag" headers are enabled by default unless `--no-etag` is provided
    config.ETag = !args['--no-etag'];

    return config;
};

(async () => {
    let args = null;

    try {
        args = arg({
            '--help': Boolean,
            '--version': Boolean,
            '--listen': [parseEndpoint],
            '--single': Boolean,
            '--debug': Boolean,
            '--config': String,
            '--no-clipboard': Boolean,
            '--no-compression': Boolean,
            '--no-etag': Boolean,
            '--symlinks': Boolean,
            '--cors': Boolean,
            '--ssl-cert': String,
            '--ssl-key': String,
            '-h': '--help',
            '-v': '--version',
            '-l': '--listen',
            '-s': '--single',
            '-d': '--debug',
            '-c': '--config',
            '-n': '--no-clipboard',
            '-u': '--no-compression',
            '-S': '--symlinks',
            '-C': '--cors',
            // This is deprecated and only for backwards-compatibility.
            '-p': '--listen'
        });
    } catch (err) {
        console.error(error(err.message));
        process.exit(1);
    }

    if (process.env.NO_UPDATE_CHECK !== '1') {
        await updateCheck(args['--debug']);
    }

    if (args['--version']) {
        console.log(pkg.version);
        return;
    }

    if (args['--help']) {
        console.log(getHelp());
        return;
    }

    if (!args['--listen']) {
        // Default endpoint
        args['--listen'] = [[process.env.PORT || 5000]];
    }

    if (args._.length > 1) {
        console.error(error('Please provide one path argument at maximum'));
        process.exit(1);
    }

    const cwd: string = process.cwd();
    const entry = args._.length > 0 ? path.resolve(args._[0]) : cwd;

    const config = await loadConfig(cwd, entry, args);

    if (args['--single']) {
        const { rewrites } = config;
        const existingRewrites = Array.isArray(rewrites) ? rewrites : [];

        // As the first rewrite rule, make `--single` work
        config.rewrites = [{
            source: '**',
            destination: '/index.html'
        }, ...existingRewrites];
    }

    if (args['--symlinks']) {
        config.symlinks = true;
    }

    for (const endpoint of args['--listen']) {
        startEndpoint(endpoint, config, args);
    }

    registerShutdown(() => {
        console.log(`\n${info('Gracefully shutting down. Please wait...')}`);

        process.on('SIGINT', () => {
            console.log(`\n${warning('Force-closing all open sockets...')}`);
            process.exit(0);
        });
    });
})();
