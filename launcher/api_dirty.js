var dirty=require('./dirty');
var loaded={};

var open=function(fn,callback) {
	if (loaded[fn]) {
		callback(loaded[fn]);
		return;
	}
	var db=dirty(fn);
	db.on('load',function() {
		console.log('loaded '+fn);
		loaded[fn]=db;
		callback(db);
	});
}

var get=function(opt,callback) {
	open(opt.db,function(db) {
		callback(0,db.get(opt.key) );
	}); 
}
get.async=true;

var set=function(opt,callback) {
	open(opt.db ,function(db) {
		console.log('set');
		db.set(opt.key,opt.value);
		callback(0,opt.value.length);
	});
}
set.async=true;

var installservice=function(services) { // so that it is possible to call other services
	services["dirty"]={ get: get, set:set};  
	console.info("dirty installed");
}  
module.exports=installservice;