'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');

const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.woff2':'font/woff2','.ico':'image/x-icon'};

function openBrowser(url) {
    const command = process.platform === 'win32' ? 'rundll32.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url];
    const child = spawn(command, args, {stdio:'ignore', detached:true, windowsHide:true});
    child.on('error', () => console.log('Open this address in your browser: ' + url));
    child.unref();
}

function handlerFor(root) {
    const absoluteRoot = fs.realpathSync(root);
    return async (request, response) => {
        if (!['GET','HEAD'].includes(request.method)) { response.writeHead(405, {'Allow':'GET, HEAD'}).end(); return; }
        let relative;
        try {
            relative = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
            if (relative.includes('\\') || relative.includes('\0') || relative.split('/').some(part => part.startsWith('.'))) throw Error('Forbidden path');
        } catch { response.writeHead(400).end('Invalid path'); return; }
        const target = path.resolve(absoluteRoot, '.' + relative);
        if (!target.startsWith(absoluteRoot + path.sep) && target !== absoluteRoot) { response.writeHead(403).end(); return; }
        try {
            let file = target, stats = await fs.promises.stat(file);
            if (stats.isDirectory()) { file = path.join(file,'index.html'); stats = await fs.promises.stat(file); }
            const realFile = await fs.promises.realpath(file);
            if (!realFile.startsWith(absoluteRoot + path.sep) || !stats.isFile()) { response.writeHead(403).end(); return; }
            response.writeHead(200, {'Content-Type':MIME[path.extname(realFile).toLowerCase()] || 'application/octet-stream','Content-Length':stats.size,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
            if (request.method === 'HEAD') { response.end(); return; }
            const stream = fs.createReadStream(realFile);
            stream.on('error', () => response.destroy());
            response.on('close', () => stream.destroy());
            stream.pipe(response);
        } catch { response.writeHead(404).end('Not found'); }
    };
}

async function startServer(options = {}) {
    const root = options.root || path.resolve(__dirname,'..');
    const requestedPort = options.port ?? 8080;
    if (!Number.isInteger(requestedPort) || requestedPort < 0 || requestedPort > 65535) throw Error('Port must be an integer from 0 to 65535.');
    const handler = handlerFor(root);
    let server, port = requestedPort;
    for (let attempt=0; attempt<20; attempt++,port++) {
        server = http.createServer(handler);
        try {
            await new Promise((resolve,reject) => { server.once('error',reject); server.listen(port,'127.0.0.1',resolve); });
            break;
        } catch (error) {
            server.close();
            if (error.code !== 'EADDRINUSE' || port === 65535 || attempt === 19) throw error;
        }
    }
    const url = 'http://127.0.0.1:' + server.address().port + '/';
    console.log('Sky Dominators: ' + url);
    console.log('Keep this window open. Press Ctrl+C to stop.');
    if (options.open !== false) (options.openBrowser || openBrowser)(url);
    return {server,url,close:() => new Promise(resolve => server.close(resolve))};
}

if (require.main === module) {
    const args = process.argv.slice(2), portAt = args.indexOf('--port');
    if (args.includes('--help')) {
        console.log('node tools/dev-server.cjs [--port 8080] [--no-open]');
    } else {
        startServer({port:portAt < 0 ? 8080 : Number(args[portAt+1]),open:!args.includes('--no-open')}).then(({server}) => {
            const stop = () => server.close(() => process.exit(0));
            process.on('SIGINT',stop); process.on('SIGTERM',stop);
        }).catch(error => { console.error('Unable to start Sky Dominators: ' + error.message); process.exitCode=1; });
    }
}

module.exports = {startServer,handlerFor};
