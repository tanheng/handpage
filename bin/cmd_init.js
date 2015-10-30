var CONFIG_FILE_NAME = 'hpconfig.json',
    USAGES = ['Create a basic project structure in current folder.'],
    fs = require('fs'),
    path = require('path');

function create_folder(targetPath) {
    if (!fs.existsSync(path.resolve(targetPath, 'asset'))) {
        fs.mkdirSync(path.resolve(targetPath, 'asset'));
    }

    if (!fs.existsSync(path.resolve(targetPath, 'src'))) {
        fs.mkdirSync(path.resolve(targetPath, 'src'));
    }
    if (!fs.existsSync(path.resolve(targetPath, 'src', 'api'))) {
        fs.mkdirSync(path.resolve(targetPath, 'src', 'api'));
    }
    if (!fs.existsSync(path.resolve(targetPath, 'src', 'page'))) {
        fs.mkdirSync(path.resolve(targetPath, 'src', 'page'));
    }
}

function copy_init_hpconfig(targetPath) {
    var init_config_path = path.resolve(__dirname, '..', 'support', 'init_hpconfig.json');
    if (!fs.existsSync(path.resolve(targetPath, CONFIG_FILE_NAME))) {
        fs.createReadStream(init_config_path).pipe(fs.createWriteStream(path.resolve(targetPath, CONFIG_FILE_NAME)));
    }
}


function show_usage(){
    console.log('  ' + USAGES[0]);
    for (var i = 1; i < USAGES.length; i++) {
        console.log('  ' + USAGES[i]);
    }
}

exports.main = function cmd(params) {
    var cwd = process.cwd();
    if (params[0] == '-h' || params[0] == '--help') {
        show_usage();
    } else {
        create_folder(cwd);
        copy_init_hpconfig(cwd);
    }
};
