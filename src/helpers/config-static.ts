
interface configStatic {

    publicStuff: ceStatic
    cleanUrls: ceStatic
    rewrites: ceStatic,
    redirects: ceStatic,
    headers: ceStatic,
    directoryListing: ceStatic,
    unlisted: ceStatic
    trailingslash: ceStatic
    renderSingle: ceStatic
}

interface ceStatic {
    _type: string
    restrictions?: ceRestrictions
}

interface ceRestrictions {
    maxItems?: number
    minItems?: number
    unique?: boolean
    additionalProperties?: boolean
}


let configStatic: configStatic = {
    publicStuff: { _type: 'Array' },
    cleanUrls: { _type: 'Boolean[]' },
    rewrites: { _type: 'Array' },
    redirects: { _type: 'Array' },
    headers: { _type: 'Array' },
    directoryListing: { _type: 'Array' },
    unlisted: { _type: 'Array' },
    trailingslash: { _type: 'Boolean' },
    renderSingle: { _type: 'Boolean' }
}

configStatic.headers.restrictions =
{
    maxItems: 50,
    minItems: 1,
    unique: true
}

export { configStatic };

// console.log(JSON.stringify(configStatic, null, 2))

// export = {
//     type: 'object',
//     properties: {
//         'publicStuff': {
//             type: 'string'
//         },
//         'cleanUrls': {
//             type: [
//                 'boolean',
//                 'array'
//             ]
//         },
//         'rewrites': {
//             type: 'array'
//         },
//         'redirects': {
//             type: 'array'
//         },
//         'headers': {
//             type: 'array',
//             maxItems: 50,
//             minItems: 1,
//             uniqueItems: true,
//             items: {
//                 type: 'object',
//                 required: ['source', 'headers'],
//                 properties: {
//                     source: {
//                         type: 'string',
//                         maxLength: 100,
//                         minLength: 1
//                     },
//                     headers: {
//                         type: 'array',
//                         maxItems: 50,
//                         minItems: 1,
//                         uniqueItems: true,
//                         items: {
//                             type: 'object',
//                             required: ['key', 'value'],
//                             properties: {
//                                 key: {
//                                     type: 'string',
//                                     minLength: 1,
//                                     maxLength: 128,
//                                     pattern: "^[a-zA-Z0-9_!#$%&'*+.^`|~-]+$"
//                                 },
//                                 value: {
//                                     type: 'string',
//                                     minLength: 1,
//                                     maxLength: 2048,
//                                     pattern: "^[a-zA-Z0-9_!#$%&'*+.;/:, =^`|~-]+$"
//                                 }
//                             },
//                             additionalProperties: false
//                         }
//                     }
//                 },
//                 additionalProperties: false
//             }
//         },
//         'directoryListing': {
//             type: [
//                 'boolean',
//                 'array'
//             ]
//         },
//         'unlisted': {
//             type: 'array'
//         },
//         'trailingSlash': {
//             type: 'boolean'
//         },
//         'renderSingle': {
//             type: 'boolean'
//         }
//     },
//     additionalProperties: false
// };
