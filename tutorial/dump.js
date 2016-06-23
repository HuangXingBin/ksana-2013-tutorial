var Yadm=require('../ksanadb/Yadm4');
var db=new Yadm('./daodejin.ydb');

var tables=db.getdb().keys();
console.log('{')
for (var i in tables) {
	r=db.getdb().get([tables[i]],true);
	console.log(tables[i],':');
	if (tables[i]!=='customfunc') {
		console.log(JSON.stringify(r,'',' '),',');	
	} else {
		console.log(r)
	}
	
}
console.log('}')