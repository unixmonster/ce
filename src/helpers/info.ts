
// Packages
import chalk from 'chalk';

// Supplied in this code base
import checkForUpdate from './update-check';

// Package Json
import pkg from '../../package.json'

// Debug Setup
import Debug from 'debug';
const debug = Debug('info.ts')

/**
 *      g e t H e l p
 *
 */
const getHelp = () => chalk`
  {bold.cyan ce} - Static file serving and directory listing

  {bold USAGE}

      {bold $} {cyan ce} --help
      {bold $} {cyan ce} --version
      {bold $} {cyan ce} folder_name
      {bold $} {cyan ce} [-l {underline listen_uri} [-l ...]] [{underline directory}]

      By default, {cyan ce} will listen on {bold 0.0.0.0:5000} and serve the
      current working directory on that address.

      Specifying a single {bold --listen} argument will overwrite the default, not supplement it.

  {bold OPTIONS}

      --help                              Shows this help message

      -v, --version                       Displays the current version of serve

      -l, --listen {underline listen_uri}             Specify a URI endpoint on which to listen (see below) -
                                          more than one may be specified to listen in multiple places

      -d, --debug                         Show debugging information

      -s, --single                        Rewrite all not-found requests to \`index.html\`

      -c, --config                        Specify custom path to \`serve.json\`

      -n, --no-clipboard                  Do not copy the local address to the clipboard

      -u, --no-compression                Do not compress files

      --no-etag                           Send \`Last-Modified\` header instead of \`ETag\`

      -S, --symlinks                      Resolve symlinks instead of showing 404 errors

      --ssl-cert                          Optional path to an SSL/TLS certificate to serve with HTTPS

      --ssl-key                           Optional path to the SSL/TLS certificate\'s private key

  {bold ENDPOINTS}

      Listen endpoints (specified by the {bold --listen} or {bold -l} options above) instruct {cyan ce}
      to listen on one or more interfaces/ports, UNIX domain sockets, or Windows named pipes.

      For TCP ports on hostname "localhost":

          {bold $} {cyan ce} -l {underline 1234}

      For TCP (traditional host/port) endpoints:

          {bold $} {cyan ce} -l tcp://{underline hostname}:{underline 1234}

      For UNIX domain socket endpoints:

          {bold $} {cyan ce} -l unix:{underline /path/to/socket.sock}

      For Windows named pipe endpoints:

          {bold $} {cyan ce} -l pipe:\\\\.\\pipe\\{underline PipeName}
`;



/**
 *      w a r n i n g
 *
 * @param message
 */
const warning = (message: string) => chalk`{yellow WARNING:} ${message}`;

/**
 *      i n f o
 *
 * @param message
 */
const info = (message: string) => chalk`{magenta INFO:} ${message}`;

/**
 *      e r r o r
 *
 * @param message
 */
const error = (message: string) => chalk`{red ERROR:} ${message}`;


/**
 *      u p d a t e C h e c k
 *
 * @param isDebugging
 */
const updateCheck = async (isDebugging: boolean) => {
    debug(`ce:updateCheck()`);
    let update = null;

    try {
        update = await checkForUpdate(pkg);
    } catch (err) {
        const suffix = isDebugging ? ':' : ' (use `--debug` to see full error)';
        console.error(warning(`Checking for updates failed${suffix}`));

        if (isDebugging) {
            console.error(err);
        }
    }

    if (!update) {
        return;
    }

    console.log(`${chalk.bgRed('UPDATE AVAILABLE')} The latest version of \`ce\` is ${update.latest}`);
};


// Exports

export { error, getHelp, info, pkg, warning, updateCheck }
