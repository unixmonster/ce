
// Native
import { createHash } from 'crypto';
import os from 'os';
import * as path from 'path';

// Packages
import minimatch from 'minimatch';
import { pathToRegexp, compile as regexCompile } from 'path-to-regexp';

// Supplied in this code base
import slasher from './glob-slash';

// Debug Setup
import Debug from 'debug';
const debug = Debug('functions.ts');

/**
 *
 *      V A R I A B L E S
 *
 */
const interfaces = os.networkInterfaces();

/**
 *      c a l c u l a t e S h a
 *
 * @param handlers
 * @param absolutePath
 */
const calculateSha = (handlers: any, absolutePath: string) =>
    new Promise((resolve, reject) => {
        debug(`calculateSha()`);
        const hash = createHash('sha1');
        hash.update(path.extname(absolutePath));
        hash.update('-');
        const rs = handlers.createReadStream(absolutePath);
        rs.on('error', reject);
        rs.on('data', buf => hash.update(buf));
        rs.on('end', () => {
            const sha = hash.digest('hex');
            resolve(sha);
        });
    });


/**
 *      e n s u r e S l a s h S t a r t
 *
 * @param target
 */
const ensureSlashStart = (target: string) => (target.startsWith('/') ? target : `/${target}`);


/**
 *      s o u r c e M a t c h e s
 *
 * @param source
 * @param requestPath
 * @param allowSegments
 */
const sourceMatches = (source: any, requestPath: any, allowSegments: boolean = false) => {
    debug(`sourceMatches()`);
    const keys = [];
    const slashed = slasher(source);

    const resolvedPath = path.posix.resolve(requestPath);

    let results = null;



    if (allowSegments) {
        const normalized = slashed.replace('*', '(.*)');
        const expression = pathToRegexp(normalized, keys);

        results = expression.exec(resolvedPath);

        if (!results) {
            // clear keys so that they are not used
            // later with empty results. this may
            // happen if minimatch returns true
            keys.length = 0;
        }
    }

    if (results || minimatch(resolvedPath, slashed)) {
        return {
            keys,
            results
        };
    }

    return null;
};



/**
 *      g e t N e t w o r k A d d r e s s
 *
 */
const getNetworkAddress = () => {
    debug(`ce:getNetworkAddress()`);
    for (const name of Object.keys(interfaces)) {
        for (const _interface of interfaces[name]) {
            const { address, family, internal } = _interface;
            if (family === 'IPv4' && !internal) {
                return address;
            }
        }
    }
};


// Exports

export { calculateSha, ensureSlashStart, getNetworkAddress, sourceMatches }
