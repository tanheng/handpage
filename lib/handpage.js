var PLUGIN_PREFIX = 'handpage-plugin-',
    path = require('path'),
    bodyParser = require('body-parser');

/*
 * Convert "/xxx/", "xxx", "xxx/" form url string to "/xxx" form(leading with slash, but has no ending slash)
 */
function slash_url (url) {
    if (url.length > 0 && url[0] !== '/') {
        url = '/' + url;
    }
    if (url === '/') return url;
    return url[url.length - 1] === '/' ? url.slice(0, url.length - 1) : url;
};

function handpage(express, config, rootdir) {
    this.config = config;
    this.rootdir = rootdir;
    this.express = express;
    this.app = express();
    this.db = null;
}

handpage.prototype.init = function(db) {
    var page_route = null,
        asset_route = '/',
        otherStatics = [],
        parseHookList = [],
        plugin, i;

    this.db = db;

    for(i = 0; i < this.config.plugins.length; i++) {
        try {
            plugin = require(PLUGIN_PREFIX + this.config.plugins[i].name);
            if(plugin.onInit) {
                plugin.onInit.call(plugin, this);
            }
            if(plugin.onParse) {
                parseHookList.push([plugin, plugin.onParse]);
            }
        } catch(e) {
            console.log('Error when load plugin "' + this.config.plugins[i].name + '": ' + e);
        }
    }

    this._api_routeRoot = '/';

    for(i = 0; i < this.config.routes.length; i++) {
        if(!this.config.routes[i][1]) continue;

        if(this.config.routes[i][0] === 'src/page' || this.config.routes[i][0] === 'src\\page') {
            page_route = slash_url(this.config.routes[i][1]);
        } else if(this.config.routes[i][0] === 'asset') {
            asset_route = slash_url(this.config.routes[i][1]);
        } else if(this.config.routes[i][0] === 'src/api' || this.config.routes[i][0] === 'src\\api') {
            this._api_routeRoot = slash_url(this.config.routes[i][1]);
        } else {
            otherStatics.push([this.config.routes[i]]);
        }
    }

    if(page_route) this.app.use(page_route, this.express.static(path.join(this.rootdir, 'src', 'page')));
    this.app.use(asset_route, this.express.static(path.join(this.rootdir, 'asset')));

    for(i = 0; i < otherStatics.length; i++) {
        this.app.use(slash_url(otherStatics[i][1]), this.express.static(path.join(this.rootdir, otherStatics[i][0])));
    }

    this.app.use(bodyParser.json({ type: '*/json'}));
    this.app.use(bodyParser.urlencoded({ extended: true }));

    for(i = 0; i < parseHookList.length; i++) {
        parseHookList[i][1].call(parseHookList[i][0], this);
    }
};

handpage.prototype.bindRoute = function(route, func) {
    route = route.replace('\\', '/');

    this.app.all((this._api_routeRoot === '/' ? '' : this._api_routeRoot) + slash_url(route), func);
};

handpage.prototype.bindInterceptor = function(func) {
    this.app.use(func);
};

handpage.prototype.run = function(http) {
    var port = this.config.port;
    http.createServer(this.app).listen(this.config.port, function(){
        console.log('handpage server listening on port ' + port);
    });
};

module.exports = handpage;
