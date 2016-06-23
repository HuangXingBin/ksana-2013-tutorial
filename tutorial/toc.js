var Yadm=require('../ksanadb/Yadm4');
var db=new Yadm('./daodejin.ydb');

var res=db.genToc(['book','chapter'], { start:0, end: db.meta.slotcount });
for (var i in res) {
	var head=db.getText( res[i][1]);
	console.log(res[i],head)
}