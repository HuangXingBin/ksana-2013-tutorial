var fs=require('fs');
var Yadm=require('../ksanadb/yadm3');

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
var fn2id=function(f) {
	var p=f.lastIndexOf('/');
	f=f.substring(p+1);
	var p=f.lastIndexOf('.');
	f=f.substring(0,p);
	return f;
}
var finddb=function(opts) {
	var out=[];
	console.log(JSON.stringify(opts));
	for (var i in yafiles) {
		console.log(yafiles[i].match(opts.pat));
		if (yafiles[i].match(opts.pat)) {
			out.push(fn2id(yafiles[i]));
		}
	}
	return out;
}
var opendm=function(dmid) {
	var dbname=known(dmid);
	if (DM[dbname]) return DM[dbname];	
	var dm=new Yadm(dbname);
	if (dm) DM[dbname]=dm;
	return dm;
}
var phrasesearch=function(opts) {
	var dm=opendm(opts.db);
	return dm.phrasesearch(opts.tofind,opts);
};
var normalizeid=function(id) {
	var idarr=id.split('.');
	while (idarr.length<3) idarr.push(0);
	return idarr.join('.');
}
/*
	multiple id can be seperated by ,
	or a range operator by ~
*/
var gettext=function(opts) {
	var dm=opendm(opts.db);
	var idarr=[];
	var res={};
	if (opts.id instanceof Array) {
		idarr=opts.id;
	} else {
		idarr=opts.id.split(',');
	}
	
	
	if (idarr.length<1) return obj;
	for (var i in idarr) {
		var nid=normalizeid(idarr[i]);
		var range=nid.split('~');
		if (range.length==2) {
			var idrange=dm.getRange(range[0],range[1],opts);
			
			for (var j in idrange) {
				var s=dm.getTextById(normalizeid(idrange[j]));
				if (s) res[idrange[j]]=s;
			}
		} else {
			var s=dm.getTextById(normalizeid(idarr[i]));
			if (s) res[idarr[i]]=s;
		}
	}
	return res;
}

var getpage=function(opts) {
	
	var dm=opendm(opts.db); 
	var idpath=opts.id.split('.');
	idpath.pop();
	idpath.unshift('texts');
	var page=dm.getdb().getJSON(idpath,true);
	var texts='';
	//console.log('getpage',JSON.stringify(page));
	for (var i in page) {
		texts+=page[i].text+'<hr/>';
	}
	return texts;
}
var getrange=function(opts) {
	var dm=opendm(opts.db); 
	
	return dm.getRange(opts.start,opts.end,opts);
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
	console.log('session ',session.id);
	return session.id;
}
var fuzzysearch=function(opts) {
	var dm=opendm(opts.db);
	dm.phrasecache=dm.phrasecache||{};
	opts.phrasecache=dm.phrasecache; 
	var res=search.fuzzy(dm,opts.tofind,opts);
	//console.log(JSON.stringify(res));
	return res;
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

var suggestion=function(opts) {
	var dm=opendm(opts.db);
	var tofind=opts.tofind;
	
	var out=dm.suggest(tofind);
	
	return out;
}
var getmeta=function(opts) {
	var dm=opendm(opts.db);
	return dm.meta;
}
var getkeys=function(opts) {
	var dm=opendm(opts.db);
	return dm.getKeys(opts.prefix);
}

var installservice=function(services) { // so that it is possible to call other services
	services['yadm']={ 
	heartbeat:heartbeat,
	phrasesearch:phrasesearch,
	fuzzysearch:fuzzysearch ,
	gettext:gettext,
	getpage:getpage,
	suggestion:suggestion,
	finddb:finddb,
	getrange:getrange,
	getmeta:getmeta,
	//getid:getid,
	getkeys:getkeys,
	initialize:initialize
	};
	yafiles=listya('..','.ydb');
	console.log(yafiles);
	console.info("yadm installed");
}
module.exports=installservice;