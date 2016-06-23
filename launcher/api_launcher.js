//generic launcher
var fs=require('fs');
var pathutil=require('./pathutil');
var Session=require('./session');

var listdb=function(sessionid,path) {
	//size of blocks
	var session=Session.sessions[sessionid];
	var entry="ksana.js";
	var output=[];
	
	session.status.phase='list projects';
	path=path||".";
	var oldpath=process.cwd();
	console.log(oldpath);
	if (path!=".") process.chdir(path);
	var currentpath=process.cwd();
	var folders=fs.readdirSync(currentpath);
	for (var i in folders) {
		
		var stat=fs.statSync(folders[i]);
		if (stat && stat.isDirectory()) {
			var files=fs.readdirSync(folders[i]);
			for (var j in files) {
				if(files[j]===entry) {
					var prjname=folders[i]+'/'+files[j];
					var prj=require('../'+prjname);
					output.push([folders[i],prj]);
				}
			}
		};
	}		
	process.chdir(oldpath);
	return output;
}

var initialize=function(buildername) {
	var session=new Session();
	console.log('api launcher initialize '+session.id);
	return session.id;
}
var finalize=function(sessionid) {
	if (!Session.sessions[sessionid]) {
		console.error("wrong session id"+sessionid);
		
	} else {
		delete Session.sessions[sessionid];
	}
}
var status=function(sid) {
	var session=Session.sessions[sid];
	//clone a status object
	r= JSON.parse(JSON.stringify(session.status));
	//empty the log, it has been send to browser for display
	session.status.log=[]; 
	return r;
}

var validsession=function(sessionid) {
	console.log(sessionid);
	return (!!Session.sessions[sessionid]);
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


var installservice=function(services) { // so that it is possible to call other services
	services['launcher']={ 
	status:status,
	initialize: initialize, 
	listdb:listdb,
	validsession:validsession,
	finalize:finalize,
	heartbeat:heartbeat,
	
	};
	
	console.info("launcher installed");
}
module.exports=installservice;