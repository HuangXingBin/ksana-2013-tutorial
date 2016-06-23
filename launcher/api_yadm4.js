var fs=require('fs');
var Yadm4=require('../ksanadb/yadm4');
var Session=require('./session');
var search=require('../ksanadb/search');
var DM={};
var yafiles=[];
var known=function(id) {
	var fn='/'+id+'.ydb';
	for (var i in yafiles) {
		if (yafiles[i].indexOf(fn)>0) {
			return yafiles[i];
		}
	}
};

var opendb=function(dmid) {
	var dbname=known(dmid);
	if (DM[dbname]) return DM[dbname];	
	var dm=new Yadm4(dbname);
	if (dm) DM[dbname]=dm;
	return dm;
}
var phraseSearch=function(opts) {
	var dm=opendb(opts.db);
	return dm.phraseSearch(opts.tofind,opts);
};

var gettext=function(opts) {
	var dm=opendb(opts.db);
	var r=dm.getText(opts.seq);
	return r;
}
var gettextbytag=function(opts) {
	var dm=opendb(opts.db);
	return dm.getTextByTag(opts)
}

var customfunc=function( opts) {
	var dm=opendb(opts.db);
	return dm.customfunc[opts.name].apply(dm,opts.params);
}

var heartbeat=function(opts) {
	var sid=opts.sessionid;
	if (!Session.sessions[sid]) {
		console.error("wrong session id"+sid);
		delete Session.sessions[sid];
		return -1 ;  //dead session
	}
	
	var session=Session.sessions[sid];
	if (!session.status) session.status={};
	session.status.lastaccess=new Date();
	return 0; 
}
var initialize=function() {
	var session=new Session();
	return session.id;
}
var fuzzysearch=function(opts) {
	var dm=opendb(opts.db);
	dm.phrasecache=dm.phrasecache||{};
	opts.phrasecache=dm.phrasecache; 
	var res=search.fuzzy(dm,opts.tofind,opts);
	//console.log(JSON.stringify(res));
	return res;
}
var closesttag=function(opts) {
	var dm=opendb(opts.db);
	var db=dm.getdb(); 
	var output=[];
	var slots=opts.slots; //default is an array
	console.time('closestTag')
	if (typeof opts.slot=='number') slots=[opts.slots];
	for (var i=0;i<slots.length;i++) {
		var t=dm.closestTag(opts.tag, slots[i]);
		var tag=dm.getTag(opts.tag,t);
		tag.ntag=t;
		output.push(tag);
	}
	console.timeEnd('closestTag')
	console.log(slots.length)
	return output;
}
var getrange=function(opts) {
	var dm=opendb(opts.db); 	
	return dm.getRange(opts.start,opts.end,opts);
}
var getrangebytag=function(opts) {

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
var installservice=function(services) { // so that it is possible to call other services
	services['yadm4']={ 
	heartbeat:heartbeat,
	getText:gettext,
	getTextByTag:gettextbytag,
	customfunc:customfunc,
	phraseSearch:phraseSearch,
	closestTag:closesttag,
	initialize:initialize
	};
	yafiles=listya('..','ydb');
	console.log(yafiles);
	console.info("yadm4 installed");
}
module.exports=installservice;