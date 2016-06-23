var fs=require('fs');
var Yadb=require('../ksanadb/yadbr');
var DB={};
/*
var writeFile=function(opts) {
	var f = new Yadb();
	f.create(opts.filename);
	var k = f.writeJSON(opts.data)
	f.save(k);
}
*/
var readFile=function(filename, callback) {
	try {
		var f = new Yadb();
		f.open(filename);
		f.getJSON(true);
		f.close();
		return f.json;
	} catch (e) {
		callback(e);
		return;
	}
}
/*
  should integrate to yadbr
*/





var natural_order=function(yadb,patharr) {
	var tx=yadb;
	var arr=[],output=[];
	
	//new version of cd should support cd( Array)
	for (var i in patharr) {
		tx=tx.cd(patharr[i]);
	}
	
	for (var i = 0; i < tx.KEY.key.length; i++) {
		arr.push( [tx.KEY.id[i], tx.KEY.key[i] ] );
	} 
	arr.sort( function(a,b) {return a[0]-b[0]});
	
	for (var i=0;i<arr.length;i++) {
		output.push( arr[i][1]);
	}
	return output;
}

var openyadb=function (filename) {
	if (!DB[filename]) {
		var f = new Yadb();
		f.open(filename);	
		DB[filename]=f;
	} 
	return DB[filename];
}


var fetch=function(opts, callback) {
	try {
		var keys={};
		var f = openyadb(opts.filename);
		var natural=natural_order(f,opts.path||[]);
		
		var json=f.getJSON(opts.path||[],opts.recursive||false);
		
		for (var i in natural) {
			keys[natural[i]]=json[natural[i]] || null;
		}

		return keys;
	} catch (e) {
		if (callback) callback(e);
		return;
	}
}

var getvalue=function(opts, callback) {
	try {
		var f = openyadb(opts.filename);
		var json=f.getJSON(opts.path,opts.recursive||false);
		return json;
	} catch (e) {
		callback(e);
		return;
	}
}


var listya=function(path, ext) {
	ext=ext||".ya";
	var output=[];
	
	path=path||".";
	var oldpath=process.cwd();
	console.log(oldpath);
	if (path!=".") process.chdir(path);
	var currentpath=process.cwd();
	var folders=fs.readdirSync(currentpath);
	console.log(folders[0]);
	for (var i in folders) {
		var stat=fs.statSync(folders[i]);
		if (stat && stat.isDirectory()) {
			var files=fs.readdirSync(folders[i]);
			for (var j in files) {
				if(files[j].substring(files[j].length-ext.length)===ext) {
					var yaname=folders[i]+'/'+files[j];
					try {
						output.push(yaname);
					} catch (e) {
						process.chdir(oldpath);
						console.log(e);
					}
				}
			}
		};
	}		
	process.chdir(oldpath);
	//console.log(output);
	return output;
}

var initialize=function(buildername) {
}
var installservice=function(services) { // so that it is possible to call other services
	services['yadb']={ 
	//open:openyadb,
	//writeFile:writeFile,
	readFile:readFile,
	fetch:fetch,
	getvalue:getvalue,
	listya:listya,

	initialize:initialize
	};
	
	console.info("yadb installed");
}
module.exports=installservice;