var util=require('util');
var hello=function( name) {
	return {"msg":"hello "+ name.first +','+name.last +' memory use:'+util.inspect(process.memoryUsage())} ;
}

var installservice=function(services) { // so that it is possible to call other services
	services["myservice"]={ hello: hello };  
	console.info("myservice installed");
}
module.exports=installservice;