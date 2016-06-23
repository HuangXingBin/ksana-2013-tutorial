/*
  convert txt to xml
*/
var fs=require('fs');
var fn=process.argv[2] || 'daodejin.txt';

var cjkutil=require('../ksanadb/cjkutil');
var arr=fs.readFileSync(fn,'utf8').replace(/\r\n/,'\n').split('\n');
var output=[];
for (var i in arr ) {
	var at=arr[i].match(/第(.*?)章/);
	if (at) {
		var num=cjkutil.toNumber( at[1]);
		output.push( '<chapter n="'+num+'">'+at[0]+'</chapter>')
	} else {
		output.push(arr[i])
	}
}
fs.writeFileSync('daodejin-cnum.xml',output.join('\r\n'),'utf8');
