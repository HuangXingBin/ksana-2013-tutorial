
var getstatus=function() {
	var status=C.status(sid);
	console.log(status.tokencount);
	if (status.log) {
		console.log("LOG:",status.log);
		status.log="";
	}
	if (!status.done) {
		setTimeout( getstatus, 1000);
	}
}

var commandline=function(customproject) {
	console.log('command line ');
	var services={};
	var api_converter=require('./api_converter');  //server side api
	api_converter(services); //install the services

	var C=services['converter'];
	var sid=C.initialize('defbuilder');  // load def builder (process files)

	var project=customproject();
	// supply a project instance instance of name
	var useropts=process.argv[2];
	C.buildproj({sessionid:sid,project:project,useropts:useropts},function(err,res) {
		if (err) {
			console.warn(err);
			console.warn(res);
		} else {
			console.log('build finish');
			console.log(res);
		}
	});
}
var web=function(customproject) {
	console.log('web');
	return customproject();
}

var mode=commandline;
var runproj=function() { return mode }
exports.runproj=runproj;
exports.enablewebmode=function() { mode=web };