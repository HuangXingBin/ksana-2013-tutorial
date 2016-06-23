/* return 0 if port available, return 1 if port is occupied */
http=require('http');
var server=http.createServer(function(req, res) {
}).listen(9959,"127.0.0.1");
setTimeout( function() {quitserver()}, 500);
var quitserver=function() {
	server.close();
	process.exit(0);
}
process.on('uncaughtException', function(err) {
  process.exit(1);
});
