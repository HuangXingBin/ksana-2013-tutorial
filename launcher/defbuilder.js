var totalsize=0;
var worker={
		initialize:function(session,callback) {  },
		processfile:function(fn,session,callback) { throw "null worker" },
		finalize:function(session,callback) { }
	}

var sessionalive=function(session) {
	return true;// for debugging
	if (!session.status.lastaccess) return true;
	var span=new Date()-session.status.lastaccess;
	return  span< 5000 ; //ping interval in ms
}
var processfile=function(fn,session,callback) {
	//var fn=f;
	if (fn.charCodeAt(0)===0xfeff || fn.charCodeAt(0)==0xfffe) {
		fn=fn.substring(1); //remove BOM
	}
	session.status.filename=fn;
	//console.log('processing '+fn);
	if (!sessionalive(session)) {  //browser quit
		session.status.dead=true;
		callback("dead","session dead");
		return;
	}
	
	worker.processfile( fn,session,callback);	
}

var doprocessfiles=function(session,finish_callback) {
	var status=session.status;
	var files=session.files;
	
	if (status.dead) {
		console.log('user offline');
		finish_callback("user offline",{state:"user offline"});
		return ;
	}
	if (status.userbreak) {
		console.log('user break');
		finish_callback("user break",{state:"user break"});
		return ;
	}
		
	try {
		
		processfile(files[status.nfile],session,function(err,data) {
			if (err) {
				console.log(err);
				finish_callback(err,{stacktrace:data});
			}
			session.status.nfile++;
			if (status.nfile>=files.length) {
				console.log('doprocessfiles finished');
				status.percent=1;
				finish_callback(0,session.response);
				return ;
			} else {
				setImmediate( function() {
					doprocessfiles(session,finish_callback) ;
				});
			}
		});

	} catch(e) {
		finish_callback(e,{stack:e.stack});
	}
}


var build=function(session,callback) {
	var status=session.status;
	
	if (!status.done) return ;

	status.done=false;
	status.userbreak=false;
	status.totalsize=0;
	status.percent=0;
	status.nfile=0;
	status.totalfile=session.files.length;
	var workername=session.request.workername;
	try {
		console.log('loading worker'+workername);
		worker=require(workername);
	} catch(e) {
		status.done=true;
		callback("unable to load worker "+workername+e.stack);
		return;
	}
	var err=0;
	//console.log('BUILDING');
	worker.initialize(session,function(err) {
		console.log('start process files..');
		status.finalized=false;
		
		if (err) {
			throw 'cannot initialize worker '+workername;
		} else {
			doprocessfiles(session, function(err,data) {
				status.done=true;
				if (err) {
					callback(err,data);
				} else {
					//return to browser
					if (status.finalized) return; //prevent multiple finalize
				    status.finalized=true;
					worker.finalize(session);
					console.log('worker finailized,leaving builder');
					callback(err,data);
				}
			});	
		}
	});
	
}

var stop=function(session) {
	session.status.done=true;
	session.status.userbreak=true;
}

exports.build = build;
exports.stop=stop;
