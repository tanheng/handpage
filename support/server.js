var CONFIG_FILE_NAME = 'hpconfig.json',
    path = require('path'),
    fs = require('fs'),
    rootdir = __dirname,
    http = require('http'),
    url = require('url'),
    MongoClient = require('mongodb').MongoClient,
    express = require('express'),
    db = null,
    handpage = null,
    config = null;


//_CODE_FROM_SRC_API_INSERT_HERE

try {
    config = new Function('return ' + fs.readFileSync(path.join(rootdir, CONFIG_FILE_NAME), 'utf-8'))();

    MongoClient.connect(config.db, function(err, theDB) {
        if(err) throw err;

        db = theDB;
        handpage = new (require('handpage'))(express, config, rootdir);

        handpage.init(db);

        //_BINDINGS_INSERT_HERE

        handpage.run(http);
    });
} catch (e) {
    return console.error('Fail to parse config file: ' + e);
}
