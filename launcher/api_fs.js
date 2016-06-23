var fs=require('fs');
 
var readdir=function(path,callback) {
	return fs.readdir(path, callback);
}
readdir.async=true;

var writefile=function(opts,callback) {
	try { 
		var written=fs.writeFileSync(opts.fn, opts.data,'utf8');
		callback(0,written);
	} catch(e) {
		callback(e,{msg:'cannot write file'});
	}
};
writefile.async=true;
var readfile=function(opts) {
	if (!opts) return "";
	if (!require('path').existsSync(opts.fn)) return "";
	return fs.readFileSync(opts.fn,'utf8');
};
var installservice=function(services) { // so that it is possible to call other services
	services["fs"]={ readdir: readdir, writefile:writefile,
readfile:readfile	};  
	console.info("fs installed");
}  
module.exports=installservice;