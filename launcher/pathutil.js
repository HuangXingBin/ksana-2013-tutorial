var fs=require('fs');
var walk = function(dir, extensions,status,done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var i = 0;
    (function next() {
      var file = list[i++];
      if (!file) return done(null, results);
      file = dir + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
			status.foldercount++;
			process.nextTick(function() {
				status.filecount=results.length;
				walk(file, extensions,status,function(err, res) {
					results = results.concat(res);
					next();
				});
			});
        } else {
			if (extensions) {
				var exts=extensions.split(';');
				for (var i in exts) {
					var ext=exts[i];
					var ex=file.substring(file.length-ext.length);
					if (ex==ext) {
						status.filename=file;
						if (file.indexOf(" ")>0) file="\""+file+"\"";
						results.push(file);
					}
				}
				next();
			}  else {
				status.filename=file;
				if (file.indexOf(" ")>0) file="\""+file+"\"";
				results.push(file);
				next();
			}
        }
      });
    })();
  });
};

exports.walk=walk