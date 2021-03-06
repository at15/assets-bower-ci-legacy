// deal with the file operation
var file = {};

var fs = require('fs');
var glob = require('glob');
var path = require('path');
var mkdirp = require('mkdirp');

var log = require('./log');
var arrh = require('./arr');

file.readJson = function (path) {
    var json = {};
    try {
        json = JSON.parse(fs.readFileSync(path));
    } catch (e) {
        log.error('Can\'t parse json ' + path);
        console.log(e);
    }
    return json;
};

/**
 * 根据通配符返回符合要求的所有文件的absolute path
 *
 * @param fileGlob
 * @returns {Array}
 */
file.glob = function (fileGlob) {
    var allFiles = [];
    if (typeof fileGlob !== 'object') {
        fileGlob = [fileGlob];
    }
    fileGlob.forEach(function (pattern) {
        var files = glob.sync(pattern, {});
        files.forEach(function (p) {
            allFiles.push(path.resolve(p));
        });
    });
    return allFiles;
};

/**
 *  write file and create the dir if dir don't exists
 *
 * @param dst
 * @param data
 */
file.write = function (dst, data) {
    if (!fs.existsSync(path.dirname(dst))) {
        mkdirp.sync(path.dirname(dst));
    }
    fs.writeFileSync(dst, data);
};

/**
 * copy the file and create dir if dir don't exists
 *
 * @param src
 * @param dst
 */
file.copy = function (src, dst) {
    if (!fs.existsSync(path.dirname(dst))) {
        mkdirp.sync(path.dirname(dst));
    }
    fs.writeFileSync(dst, fs.readFileSync(src));
};

// resolve the absolute path to relative path to the root
file.resolve = function (files, root) {
    var resolvedPath = [];
    if (typeof root === 'undefined') {
        log.error('root is undefined!');
        return files;
    }
    files.forEach(function (p) {
        resolvedPath.push(path.relative(root, p))
    });
    return resolvedPath;
};

// split files by their extension
file.split = function (files, exts) {
    // 给index补上前面的点
    if (typeof exts === 'string') {
        exts = [exts];// make it an array
    }
    exts = exts.map(function (ext) {
        if (ext.indexOf('.') !== 0) {
            ext = '.' + ext;
        }
        return ext;
    });

    var rFiles = [];
    files.forEach(function (f) {
        if (-1 !== arrh.inArray(exts, path.extname(f))) {
            rFiles.push(f);
        }
    });
    return rFiles;
};

module.exports = file;