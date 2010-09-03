
var path  = require('path'),
    fs    = require('fs'),
    utils = require('./../utils');

module.exports = function (dir, prefix) {
  return function (request, response, next) {
    var filename,
        pathname = request.parseUrl().pathname;

    pathname = pathname.replace(/\.\.+/g, '.');

    if (prefix) {
      var index = pathname.indexOf(prefix);
      if (index > -1) {
        filename = pathname.slice(prefix.length);
      } else {
        return next();
      }
    } else {
      filename = pathname;
    }

    // Serve the file :)
    filename = path.join(dir, filename);
    fs.stat(filename, function (error, stat) {
      // Go to the next layer if we can't serve anything.
      if (error) {
        return next();
      } else if (!stat.isFile()) {
        return next();
      }

      if (request.headers['if-modified-since']) {
        var if_modified_since = new Date(request.headers['if-modified-since']);
        if (stat.mtime.getTime() <= if_modified_since.getTime()) {
          return response.send(304, null, {
            'Expires': new Date(Date.now() + 31536000000).toUTCString(),
            'Cache-Control': 'public max-age=' + 31536000
          });
        }
      }

      // Stream the file
      response.sendHeaders(200, {
        'Content-Type': utils.mime.type(filename),
        'Content-Length': stat.size,
        'Last-Modified': stat.mtime.toUTCString(),
        'Expires': new Date(Date.now() + 31536000000).toUTCString(),
        'Cache-Control': 'public max-age=' + 31536000
      });

      var file_stream = fs.createReadStream(filename);
      file_stream.addListener('error', function (error) {
        next(error);
      });
      utils.pump(file_stream, response, function () {
        response.end();
      });
    });
  };
};
