
import { createHash } from 'crypto';
import * as path from 'path';
import Debug from './debug'

const debug = Debug('functions')

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





export { calculateSha, ensureSlashStart }
