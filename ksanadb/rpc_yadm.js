define(['../ksanadb/rpc'],
function(host) {
	var makeinf=function(name) {
		return (
			function(opts,callback) {
				host.exec(callback,0,"yadm",name,opts);
			});
	}
	
	var exports={};
	
	exports.initialize=makeinf("initialize");
	exports.heartbeat=makeinf("heartbeat");
	exports.phrasesearch=makeinf("phrasesearch");
	exports.gettext=makeinf("gettext");
	exports.getpage=makeinf("getpage");
	exports.finddb=makeinf("finddb");
	exports.getrange=makeinf("getrange");
	exports.suggestion=makeinf("suggestion");
	exports.getmeta=makeinf("getmeta");
	exports.fuzzysearch=makeinf("fuzzysearch");
	

	return exports;
});