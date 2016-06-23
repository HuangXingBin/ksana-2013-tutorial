//generic converter
var fs=require('fs');
var pathutil=require('./pathutil');
var path=require('path');
var Session=require('./session');
var builder=require('./builder');
builder.enablewebmode();

var adddir=function(opts,callback) {
	
	var session=Session.sessions[opts.sessionid];
	if (!session) {
		console.error('empty session');
		return null;
	};
	if (!session.status.done) return;
	
	console.log('adddir');
	session.status.done=false;
	session.status.percent=0;
	session.status.filecount=0;
	session.status.foldercount=0;
	session.status.nfile=0; //
	pathutil.walk(opts.dir,opts.ext||"",session.status,function(err,files) {
		
		session.files=files;
		session.status.done=true;
		if (files) {
			callback(err,{count:files.length});
		} else {
			callback("invalid folder "+opts.dir,{});
		}
		console.log('adddir completed');
	});
};
adddir.async=true;
var opts2sessionrequest=function(opts,session) {
	session.request={};
	session.request.encoding=opts.encoding || 'utf8';
	session.request.crlf=opts.crlf || '\r\n';
	//session.request.workername=opts.workername;
	session.request.projectname=opts.projectname;
	session.request.project=opts.project;
	
}
/*
var build=function(opts,callback) {
	//size of blocks
	var session=Session.sessions[opts.sessionid];
	
	opts2sessionrequest(opts,session);
	console.log(session.workername);
	session.status.phase='build';
	console.log(session.files.length);
	session.builder.build(session,callback);
}
build.async=true;
*/
var buildproj=function(opts,callback) {
	//size of blocks
	var session=Session.sessions[opts.sessionid];
	opts2sessionrequest(opts,session);
	try {

		var project=session.request.project || require("../"+session.request.projectname);
		var prjpath=process.cwd();
		if (project.projdir) prjpath=project.projdir.replace(/\\/g,'/') //new proj
		console.log('pwd '+process.cwd());
		session.status.phase='build';
		session.request.workername=project.workername;
		session.project=project;
		session.customfunc={};
		session.meta={};
		
		//pass user setting to prj file
		if(project.setopt)project.setopt(opts.useropts);
		
		//import project settings
		for (var i in project.request) {
			session.request[i]=project.request[i];
		}
		for (var i in project.meta) {
			session.meta[i]=project.meta[i];
		}
		for (var i in project.customfunc) {
			session.customfunc[i]=project.customfunc[i];
		}
		
		project.getfiles(null,function(files) {
			session.files=files;
			session.builder.build(session,callback);
		});
		
	} catch(e) {
		callback(e,e.stack);
	}
}
buildproj.async=true;

var listproj=function(sessionid,path) {
	//size of blocks
	var session=Session.sessions[sessionid];
	var ext=".prj.js";
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
				if(files[j].substring(files[j].length-ext.length)===ext) {
					var prjname=folders[i]+'/'+files[j];
					try {
						var prj=require('../'+prjname);
						output.push([prjname,prj.name||prjname,prj.help||""]);
					} catch (e) {
						console.log(e);
					}
				}
			}
		};
	}		
	process.chdir(oldpath);
	return output;
}




var createbuilder=function(buildername) {
	try {
		buildername=buildername||"defbuilder";
		console.log("Loading builder:"+buildername);
		var builder=require("./"+buildername);
	} catch(e) {
		console.log('error loading builder '+buildername);
		console.log(e);
	}
	return builder;
}


var initialize=function(buildername) {
	var session=new Session();
	session.builder=createbuilder(buildername);
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

var stop=function(opts) {
	var session=Session.sessions[opts.sessionid];
	session.builder.stop(session);
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
	services['converter']={ status:status,initialize: initialize, 
	listproj:listproj,
//	addfile: addfile , 
//	addplan:addplan,
	adddir:adddir,
	stop:stop, 
	validsession:validsession,
	buildproj:buildproj, finalize:finalize,heartbeat:heartbeat,
	
	};
	
	console.info("generic converter installed");
}
module.exports=installservice;