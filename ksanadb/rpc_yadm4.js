define(['../ksanadb/rpc'],
function(host) {
	var makeinf=function(name) {
		return (
			function(opts,callback) {
				host.exec(callback,0,"yadm4",name,opts);
			});
	}
	
	var exports={};
	
	exports.initialize=makeinf("initialize");
	exports.heartbeat=makeinf("heartbeat");
	exports.getText=makeinf("getText");	
	exports.getTextByTag=makeinf("getTextByTag");
	exports.phraseSearch=makeinf("phraseSearch");
	exports.closestTag=makeinf("closestTag");
	exports.customfunc=makeinf("customfunc");
	return exports;
});