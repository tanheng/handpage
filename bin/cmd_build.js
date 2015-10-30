/*jslint sub:true, evil:true */
var CODES_MARKER = '//_CODE_FROM_SRC_API_INSERT_HERE',
    BINDINGS_MARKER = '//_BINDINGS_INSERT_HERE',
    CONFIG_FILE_NAME = 'hpconfig.json',
    PLUGIN_PREFIX = 'handpage-plugin-',
    USAGES = ['Install plugins, build src/, generate the "client.html" and "server.js".'],
    fs = require('fs'),
    path = require('path'),
    npm = require('npm'),
    cwd = process.cwd(),
    exec = require('child_process').exec,
    CLIENT_MAIN_PATH = path.join('support', 'client', 'main'),
    tasks = [],
    plugins = [],
    config = null,
    cheerio;

function findSpecifiedFiles(p, exts) {
    var list = [],
        files = fs.readdirSync(p);

    files.forEach(function (file) {
        var stats = fs.lstatSync(path.join(p, file)),
            ext, match, i;

        if(file[0] === '.') return;

        if(stats.isDirectory()) {
            list = list.concat(findSpecifiedFiles(path.join(p, file)));
        } else {
            if(exts) {
                ext = file.split('.');
                if(ext.length > 1) {
                    ext = ext[ext.length - 1].toLowerCase();
                    match = false;
                    for(i = 0; i < exts.length; i++) {
                        if(exts[i].toLowerCase() === ext) {
                            match = true;
                            break;
                        }
                    }
                    if(match) list.push(path.join(p, file));
                }
            } else {
                list.push(path.join(p, file));
            }
        }
    });

    return list;
}

function show_usage(){
    console.log('  ' + USAGES[0]);
    for (var i = 1; i < USAGES.length; i++) {
        console.log('  ' + USAGES[i]);
    }
}

function write_package_json(){
    var p = null,
        pjconfig, i;

    if (fs.existsSync('package.json')) {
        try {
            pjconfig = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
        } catch (e) {
            throw 'build: Bad package.json file, please check or delete it and run build again';
        }
    } else {
        pjconfig = {};
    }
    pjconfig.name = config.name || 'myApp';
    pjconfig.version = config.version || '1.0.0';
    pjconfig.description = config.description || 'A webapp powered by handpage.';
    if (config.author) pjconfig.author = config.author;
    pjconfig.main = config.main || 'server.js';
    pjconfig.dependencies = {
        "handpage": "*",
        "mongodb": ">2.0",
        "express": ">4.8.0"
    };

    for (i = 0; i < config.plugins.length; i++) {
        p = config.plugins[i];
        if (!p.name || !p.version){
            throw 'build: Bad hpconfig.json, please check plugins field.';
        }
        pjconfig.dependencies[PLUGIN_PREFIX + p.name] = p.version;
    }

    fs.writeFileSync('package.json', JSON.stringify(pjconfig), {encoding: 'utf8'});
}

function next(err) {
    tasks.shift();
    if (err) {
        console.error('\nFail to build: ' + err);
    } else {
        if (tasks.length > 0) {
            tasks[0][1](tasks[0][0], next);
        } else {
            process.stdout.write('\n\n  All done. You can run "node server.js" to start your app now.\n')
        }
    }
}

function findEntryHtmlFile() {
    var anyHtmlFile = null,
        files = findSpecifiedFiles(path.join(cwd, 'src', 'page'), ['html', 'htm']),
        entryHtmlList = ['index', 'main', 'home', 'first', 'base', 'client', 'common'], // more?
        i;

    for(i = 0; i < files.length; i++) {
        anyHtmlFile = files[i];
        if(entryHtmlList.indexOf(path.parse(files[i]).name.toLowerCase()) !== -1) return files[i];
    }
    return anyHtmlFile;
}

function extractFromPages() {
    var files = findSpecifiedFiles(path.join(cwd, 'src', 'page'), ['html', 'htm']),
        res = {link: {}, script: {}, inline_script: [], style: [], body: []},
        i, j, $, link, js, css, body, tdom, nameInfo;

    for(i = 0; i < files.length; i++) {
        $ = cheerio.load(fs.readFileSync(files[i], 'utf8'));

        link = $('head link');
        for(j = 0; j < link.length; j++) {
            tdom = $(link[j]);
            if(tdom.attr('href')) res.link[tdom.attr('href')] = $.html(tdom);
        }

        js = $('head script');
        for(j = 0; j < js.length; j++) {
            tdom = $(js[j]);
            if(tdom.attr('src')) {
                res.script[tdom.attr('src')] = $.html(tdom);
            } else {
                res.inline_script.push($.html(tdom));
            }
        }

        css = $('head style');
        for(j = 0; j < css.length; j++) {
            tdom = $(css[j]);
            res.style.push($.html(tdom));
        }

        body = $('body');
        nameInfo = path.parse(path.relative(path.join(cwd, 'src', 'page'), files[i]));
        res.body.push(
            '\n<div page="' + (nameInfo.dir.replace(/\/|\s/g, '_') + (nameInfo.dir ? '_' : '') + nameInfo.name.replace(/\s/g, '_')) + '"' +
                (body.attr('class')? (' class="' + body.attr('class') + '"'): '') +
                (body.attr('style')? (' style="' + body.attr('style') + '"'): '') +
                (body.attr('id')? (' id="' + body.attr('id') + '"'): '') +
            '>' +
            '\n' + body.html() + '</div>' + '<!-- end of page ' + (nameInfo.dir.replace(/[^0-9a-zA-Z-]/g, '_') + (nameInfo.dir ? '_' : '') + nameInfo.name) + ' -->'
        );
    }

    return res;
}

function generate_client_html(nouse, next) {
    var entryFile = findEntryHtmlFile();

    if(!entryFile) return next('Cannot find any html file in src/page.');

    process.stdout.write('\n  Generating asset/client.html ...');

    var $ = cheerio.load(fs.readFileSync(entryFile, 'utf8'));

    var headerStr = '<!DOCTYPE html>';
    var html_att_lang = $('html').attr('lang') || '';
    var html_attr_manifest = $('html').attr('manifest') || '';
    headerStr += '\n<html' + (html_att_lang ? ' lang="' + html_att_lang + '"' : '') + (html_attr_manifest ? ' manifest="' + html_attr_manifest + '"' : '') + '>';
    headerStr += '\n<head>';

    var title = $.html('head title') || '<title>myApp</title>';
    var base = $.html('head base');
    var meta = $.html('head meta');
    headerStr += '\n' + title;
    if(base) headerStr += '\n' + base;
    if(meta) headerStr += '\n' + meta;

    var pages = extractFromPages();

    for(var i = 0; i < plugins.length; i++) {
        if(plugins[i].injection.headers) {
            for(var j = 0; j < plugins[i].injection.headers.length; j++) {
                $ = cheerio.load(plugins[i].injection.headers[j]);
                var el = $('*');
                if(el[0].name.toLowerCase() === 'link') {
                    if(el.attr('href')) pages.link[el.attr('href')] = plugins[i].injection.headers[j];
                } else if(el[0].name.toLowerCase() === 'style') {
                    pages.style.push(plugins[i].injection.headers[j]);
                } else if(el[0].name.toLowerCase() === 'script') {
                    if(el.attr('src')) {
                        pages.script[el.attr('src')] = plugins[i].injection.headers[j];
                    } else {
                        pages.inline_script.push(plugins[i].injection.headers[j]);
                    }
                }
            }
        }

        if(plugins[i].injection.blocks) {
            for(var j = 0; j < plugins[i].injection.blocks.length; j++) {
                pages.body.push(plugins[i].injection.blocks[j]);
            }
        }
    }

    for(var href in pages.link) {
        headerStr += '\n' + pages.link[href];
    }
    headerStr += '\n<style>\n' + fs.readFileSync(path.join(cwd, 'node_modules', 'handpage', 'support', 'client', 'handpage.css'), 'utf8') + '\n</style>';
    for(var i = 0; i < pages.style.length; i++) {
        headerStr += '\n' + pages.style[i];
    }
    headerStr += '\n<script>\n' + fs.readFileSync(path.join(cwd, 'node_modules', 'handpage', 'support', 'client', 'handpage.js'), 'utf8') + '\n</script>';
    for(var src in pages.script) {
        headerStr += '\n' + pages.script[src];
    }
    for(var i = 0; i < pages.inline_script.length; i++) {
        headerStr += '\n' + pages.inline_script[i];
    }

    headerStr += '\n</head>';

    var bodyStr = '\n<body>';
    for(var i = 0; i < pages.body.length; i++) {
        bodyStr += '\n' + pages.body[i];
    }
    bodyStr += '\n</body></html>';

    fs.writeFileSync(path.join(cwd, 'asset', 'client.html'), headerStr + bodyStr);

    process.stdout.write(' done.');
    next();
}

function extractFromApis() {
    var files = findSpecifiedFiles(path.join(cwd, 'src', 'api'), ['js']),
        res = [],
        i, nameInfo;

    for(i = 0; i < files.length; i++) {
        nameInfo = path.parse(path.relative(path.join(cwd, 'src', 'api'), files[i]));
        res.push({
            name: nameInfo.dir.replace(/[^0-9a-zA-Z-]/g, '_') + (nameInfo.dir ? '_' : '') + nameInfo.name.replace(/[^0-9a-zA-Z-]/g, '_'),
            interceptor: nameInfo.name[0] === '_',
            content: fs.readFileSync(files[i], 'utf8'),
            path: path.join(nameInfo.dir, nameInfo.name)
        });
    }

    return res;
}

function generate_server_js(nouse, next) {
    var apis = extractFromApis(),
        codes = fs.readFileSync(path.join(cwd, 'node_modules', 'handpage', 'support', 'server.js'), 'utf8'),
        functions = '',
        bindings = '',
        i, wrapperName;

    process.stdout.write('\n  Generating server.js ...');

    apis.forEach(function(api){
        wrapperName = api.interceptor ? 'interceptor' + api.name : 'data_' +api.name;
        functions +=  '\n' + 'function ' + wrapperName + '(req, res' + (api.interceptor ? ', next' : '') + ') { ' +
                '\n' + api.content + '\n' +
                '}' + '\n';

        bindings += '\n        ' + (api.interceptor ? 'handpage.bindInterceptor('+ wrapperName +')' : 'handpage.bindRoute("' + api.path + '", ' + wrapperName + ');');
    });

    codes = codes.replace(CODES_MARKER, functions);
    codes = codes.replace(BINDINGS_MARKER, bindings);

    fs.writeFileSync(path.join(cwd, 'server.js'), codes);

    process.stdout.write(' done.');
    next();
}

// main entry point
exports.main = function cmd(params) {
    if (params.length > 0 && (params[0] == '-h' || params[0] == '--help')) {
        return show_usage();
    }
    try {
        fs.accessSync(path.join(cwd, CONFIG_FILE_NAME));
    } catch(e) {
        return console.error('Cannot find ' + CONFIG_FILE_NAME + ' in current directory. Consider run "handpage init" first.');
    }
    try {
        //config file could contain RegExp and other non-json object, so we use Function-eval instead JSON.parse
        config = new Function('return ' + fs.readFileSync(path.join(cwd, CONFIG_FILE_NAME), 'utf-8'))();
    } catch (e) {
        return console.error('Fail to parse ' + CONFIG_FILE_NAME + ': ' + e);
    }
    write_package_json();

    process.stdout.write('  Check and install plugins and dependencies ...');

    exec('npm install', function(err, stdout, stderr){
        var plugin, injection;

        if(err) {
            console.error('Fail to build: ' + err);
        } else {
            process.stdout.write(' done.');
            if(config.plugins.length > 0) process.stdout.write('\n  Build plugins:');
            cheerio = require('cheerio');

            for(var i = 0; i < config.plugins.length; i++) {
                plugin = require(path.join(cwd, 'node_modules', PLUGIN_PREFIX + config.plugins[i].name));
                if (typeof plugin.onBuild === 'function') {
                    injection = {headers: null, blocks: null};
                    plugins.push({name: config.plugins[i].name, instance: plugin, injection: injection});
                    tasks.push([{name: config.plugins[i].name}, function(env, n){process.stdout.write('\n    ' + env.name + ' ...'); n();}]);
                    tasks.push([{injection: injection, config: config, cwd: cwd}, plugin.onBuild]);
                    tasks.push([null, function(nouse, n){process.stdout.write(' done.'); n();}]);
                }
            }

            tasks.push([null, generate_client_html]);
            tasks.push([null, generate_server_js]);

            tasks[0][1](tasks[0][0], next);
        }
    });
};
