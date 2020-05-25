// Native
import { URL } from 'url';
import { join } from 'path';
import fs, { PathLike } from 'fs';
import { promisify } from 'util';
import { tmpdir } from 'os';

// Packages
import registryUrl from 'registry-url';

// Debug Setup
import Debug from 'debug';
const debug = Debug('update-check.ts')


/**
 *
 *      V A R I A B L E S
 *
 */
interface updateConfig {
    interval: number;
    distTag: string;
}

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const compareVersions = (a, b) => a.localeCompare(b, 'en-US', { numeric: true });
const encode = (value: string | number | boolean) => encodeURIComponent(value).replace(/^%40/, '@');


const getFile = async (details: any, distTag: string) => {
    const rootDir = tmpdir();
    const subDir = join(rootDir, 'update-check');

    if (!fs.existsSync(subDir)) {
        await mkdir(subDir);
    }

    let name = `${details.name}-${distTag}.json`;

    if (details.scope) {
        name = `${details.scope}-${name}`;
    }

    return join(subDir, name);
};

const evaluateCache = async (file: fs.PathLike, time: number, interval: number) => {
    if (fs.existsSync(file)) {
        const content = await readFile(file, 'utf8');
        const { lastUpdate, latest } = JSON.parse(content);
        const nextCheck = lastUpdate + interval;

        // As long as the time of the next check is in
        // the future, we don't need to run it yet
        if (nextCheck > time) {
            return {
                shouldCheck: false,
                latest
            };
        }
    }

    return {
        shouldCheck: true,
        latest: null
    };
};

const updateCache = async (file: PathLike, latest: number, lastUpdate: number) => {
    const content = JSON.stringify({
        latest,
        lastUpdate
    });

    await writeFile(file, content, 'utf8');
};

const loadPackage = (url: URL, authInfo?: any) => new Promise((resolve, reject) => {
    const options = {
        host: url.hostname,
        path: url.pathname,
        port: url.port,
        headers: {
            accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*',
            authorization: null
        },
        timeout: 2000
    };

    if (authInfo) {
        options.headers.authorization = `${authInfo.type} ${authInfo.token}`;
    }

    const { get } = require(url.protocol === 'https:' ? 'https' : 'http');
    get(options, response => {
        const { statusCode } = response;

        if (statusCode !== 200) {
            const error = new Error(`Request failed with code ${statusCode}`);
            error.message = statusCode;

            reject(error);

            // Consume response data to free up RAM
            response.resume();
            return;
        }

        let rawData = '';
        response.setEncoding('utf8');

        response.on('data', chunk => {
            rawData += chunk;
        });

        response.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);
                resolve(parsedData);
            } catch (e) {
                reject(e);
            }
        });
    }).on('error', reject).on('timeout', reject);
});

const getMostRecent = async ({ full, scope }, distTag: any) => {
    const regURL = registryUrl(scope);
    const url = new URL(full, regURL);

    let spec = null;

    try {
        spec = await loadPackage(url);
    } catch (err) {
        // We need to cover:
        // 401 or 403 for when we don't have access
        // 404 when the package is hidden
        if (err.message && String(err.message).startsWith('4')) {
            // We only want to load this package for when we
            // really need to use the token
            const registryAuthToken = require('registry-auth-token');
            const authInfo = registryAuthToken(regURL, { recursive: true });

            spec = await loadPackage(url, authInfo);
        } else {
            throw err;
        }
    }

    const version = spec['dist-tags'][distTag];

    if (!version) {
        throw new Error(`Distribution tag ${distTag} is not available`);
    }

    return version;
};

const defaultConfig: updateConfig = {
    interval: 3600000,
    distTag: 'latest'
};

const getDetails = (name: string) => {
    const spec: any = {
        full: encode(name)
    };

    if (name.includes('/')) {
        const parts = name.split('/');

        spec.scope = parts[0];
        spec.name = parts[1];
    } else {
        spec.scope = null;
        spec.name = name;
    }

    return spec;
};

module.exports = async (pkg: any, config: any) => {
    if (typeof pkg !== 'object') {
        throw new Error('The first parameter should be your package.json file content');
    }

    const details = getDetails(pkg.name);
    const time = Date.now();
    const { distTag, interval } = Object.assign({}, defaultConfig, config);
    const file: fs.PathLike = await getFile(details, distTag);

    let latest = null;
    let shouldCheck = true;

    ({ shouldCheck, latest } = await evaluateCache(file, time, interval));

    if (shouldCheck) {
        latest = await getMostRecent(details, distTag);

        // If we pulled an update, we need to update the cache
        await updateCache(file, latest, time);
    }

    const comparision = compareVersions(pkg.version, latest);

    if (comparision === -1) {
        return {
            latest,
            fromCache: !shouldCheck
        };
    }

    return null;
};

// Exports

export = module.exports
