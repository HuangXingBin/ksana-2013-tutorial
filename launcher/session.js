var sessions={};
var GUID=function() {
	var S4 = function ()    {    return Math.floor(        Math.random() * 0x10000  ).toString(16);  };
	return (   S4() + S4() + "-" + S4() + "-" +  S4() + "-" + S4() + "-" +S4() + S4() + S4()    );
}
var sessionalive=function(status) {
	var span=new Date()-status.lastaccess;
	console.log("span "+span);
	return  span<5000 ; //heartbeat interval in ms
}
var removedeadsession=function() {
	for (var i in sessions) {
		var session=sessions[i];
		if (!session) continue;
		var alive=sessionalive(session.status);
		console.log('alive:'+alive);
		if (!alive) {
			if (session.finalize) session.finalize();
			delete sessions[i];
			console.log('session dead:'+i);
		}
	}
}
var Session=function() {
	removedeadsession();
	var id=GUID();
	this.id=id;
	this.rawtext={};
	this.status={done:true,phase:"initialized",log:[],lastaccess:new Date()};
	this.response={}; //response to client
	sessions[id]=this;
}
Session.sessions=sessions;

module.exports=Session;