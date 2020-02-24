/* ! The MIT License (MIT) Copyright (c) 2014 Scott Corgan */

// This is adopted from https://github.com/scottcorgan/glob-slash/

import path from 'path';
const normalize = (value: string) => path.posix.normalize(path.posix.join('/', value));

module.exports = (value: string) => (value.charAt(0) === '!' ? `!${normalize(value.substr(1))}` : normalize(value));
module.exports.normalize = normalize;

export = module.exports;
