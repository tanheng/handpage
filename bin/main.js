#!/usr/bin/env node
var CMDS = [
    {
        cmd: 'init',
        helps: ['init \t\t create a basic project structure in current folder.']
    }, {
        cmd: 'build',
        helps: ['build \t\t build src/, generate the "client.html" and "server.js".']
    }],
    cmdargv = process.argv.slice(2),
    path = require('path'),
    fs = require('fs'),
    cmd;

if (cmdargv.length === 0) {
    //show help
    console.log('\n  handpage framework for lightweight mobile webapp development, version ' + JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'))).version + '. available commands:\n');
    for (var i = 0; i < CMDS.length; i++) {
        console.log('\t' + CMDS[i].helps[0]);
    }
    console.log('\n');
} else {
    cmd = cmdargv[0].toLowerCase();
    for (var i = 0; i < CMDS.length; i++) {
        if (CMDS[i].cmd === cmd) {
            cmd = require('./cmd_' + cmd).main;
            break;
        }
    }
    if (typeof cmd === 'string') {
        console.log('\nInvalid command name. Issue "handpage" without param to see available commands list.');
    } else {
        cmd(cmdargv.slice(1));
    }
}
