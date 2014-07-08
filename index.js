var fs = require('fs');
var path = require('path');
var glob = require('glob');
var tq = require('./tq');

var log4js = require('log4js');
log4js.configure({appenders: [
    { type: 'console' }
]
});
var log = log4js.getLogger();
log.setLevel('DEBUG');

var bower = require('bower');

function Mgr(configPath) {
    this.init();
    this.setConfig(configPath);
}

Mgr.prototype.init = function () {
    this._config = {};
    this._libs = {};
    this._groups = {};
    this._pages = {};
};

Mgr.prototype.setConfig = function (configPath) {
    try {
        this._config = JSON.parse(fs.readFileSync(configPath));
    } catch (e) {
        log.error('Can\'t read config! ' + configPath);
    }
};

Mgr.prototype.parseLib = function (libName) {

    if (typeof this._libs[libName] === 'object') {
        return this._libs[libName];
    }


    var libConfig = this._config.libs[libName];
    if (libConfig.bower) {
        return this.readBower(libName);
    }

    var libFiles = [];

    if (typeof libConfig === 'object') {

        // get all the dependencies
        if (typeof libConfig.dependencies === 'object') {
            var deps = libConfig.dependencies;
            var me = this;
            deps.forEach(function (d) {
                libFiles = me.mergeFiles(libFiles, me.parseLib(d));
            });
        }

        // get all the files
        var fileGlob = this._config.libs[libName].files;
        if (typeof fileGlob !== 'object') {
            fileGlob = [fileGlob];
        }
        fileGlob.forEach(function (pattern) {
            var files = glob.sync(pattern, {});
            files.forEach(function (p) {
                libFiles.push(path.resolve(p));
            });
        });
    }

    if (libFiles.length === 0) {
        log.warn('Lib: ' + libName + ' is empty! ');
    }

    this._libs[libName] = libFiles;
    return this._libs[libName];
};

Mgr.prototype.readBower = function (pkgName) {
    if (typeof this._libs[pkgName] !== 'object') {
        // final files in absolute path
        var libFiles = [];
        var bowerJsonPath = 'bower_components/' + pkgName + '/bower.json';
        var bowerJson = {};
        try {
            bowerJson = JSON.parse(fs.readFileSync(bowerJsonPath));
        } catch (e) {
            // need to try .bower.json
            bowerJsonPath = 'bower_components/' + pkgName + '/.bower.json';
            try {
                bowerJson = JSON.parse(fs.readFileSync(bowerJsonPath));
            } catch (e) {
                log.error('Can\'t read bower.json! ' + bowerJsonPath);
            }
        }

        var mainFilesGlob = bowerJson.main;
        if (typeof mainFilesGlob !== 'object') {
            mainFilesGlob = [mainFilesGlob];
        }

        // change the directory
        var cwd = process.cwd();
        process.chdir('bower_components/' + pkgName);

        mainFilesGlob.forEach(function (pattern) {
            var files = glob.sync(pattern, {});
            files.forEach(function (p) {
                libFiles.push(path.resolve(p));
            });
        });

        // go back to the old dir
        process.chdir(cwd);
        this._libs[pkgName] = libFiles;

        // TODO:check the dependencies

    }
    return this._libs[pkgName];
};

Mgr.prototype.parseGroup = function () {

};

Mgr.prototype.parsePage = function () {

};

// TODO: do we already have function like this?
Mgr.prototype.mergeFiles = function () {
    var arg = arguments;
    var merged = [];

    if (arg.length === 0) {
        log.warn('Nothing provided for merge');
        return merged;
    }
    var i, to_merge = arg.length;
    for (i = 0; i < to_merge; i++) {
        var scripts = arg[i];
        var j, script_count = scripts.length;
        for (j = 0; j < script_count; j++) {
            var s = scripts[j];
            if (-1 === tq.inArray(merged, s)) {
                merged.push(s);
            }
        }
    }
    return merged;
};

module.exports = Mgr;