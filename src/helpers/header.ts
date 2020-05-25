// Native
import path from 'path';

// Packages
import contentDisposition from 'content-disposition';
import mime from 'mime-types';

// Supplied in this code base
import slasher from './glob-slash';
import { calculateSha, sourceMatches } from './functions'

// Debug Setup
import Debug from 'debug';
const debug = Debug('headers.ts')


/**
 *
 *      V A R I A B L E S
 *
 */
const etags = new Map();


/**
 *      a p p e n d H e a d e r s
 *
 * @param target
 * @param source
 */
const appendHeaders = (target: any, source: any) => {
    debug(`appendHeaders()`);
    for (let index = 0; index < source.length; index++) {
        const { key, value } = source[index];
        target[key] = value;
    }
};


/**
 *      g e t H e a d e r s
 *
 * @param handlers
 * @param config
 * @param current
 * @param absolutePath
 * @param stats
 */
const getHeaders = async (handlers: any, config: any, current: any, absolutePath: any, stats: any) => {
    debug(`getHeaders()`);
    const { headers: customHeaders = [], etag = false } = config;
    const related = {};
    const { base } = path.parse(absolutePath);
    const relativePath = path.relative(current, absolutePath);

    if (customHeaders.length > 0) {
        // By iterating over all headers and never stopping, developers
        // can specify multiple header sources in the config that
        // might match a single path.
        for (let index = 0; index < customHeaders.length; index++) {
            const { source, headers } = customHeaders[index];

            if (sourceMatches(source, slasher(relativePath))) {
                appendHeaders(related, headers);
            }
        }
    }

    let defaultHeaders = {};

    if (stats) {
        defaultHeaders = {
            'Content-Length': stats.size,
            // Default to "inline", which always tries to render in the browser,
            // if that's not working, it will save the file. But to be clear: This
            // only happens if it cannot find a appropiate value.
            'Content-Disposition': contentDisposition(base, {
                type: 'inline'
            }),
            'Accept-Ranges': 'bytes'
        };

        if (etag) {
            let [mtime, sha] = etags.get(absolutePath) || [];
            if (Number(mtime) !== Number(stats.mtime)) {
                sha = await calculateSha(handlers, absolutePath);
                etags.set(absolutePath, [stats.mtime, sha]);
            }
            defaultHeaders['ETag'] = `"${sha}"`;
        } else {
            defaultHeaders['Last-Modified'] = stats.mtime.toUTCString();
        }

        const contentType = mime.contentType(base);

        if (contentType) {
            defaultHeaders['Content-Type'] = contentType;
        }
    }

    const headers = Object.assign(defaultHeaders, related);

    for (const key in headers) {
        if (headers.hasOwnProperty(key) && headers[key] === null) {
            delete headers[key];
        }
    }

    return headers;
};


// Exports

export { appendHeaders, getHeaders }
