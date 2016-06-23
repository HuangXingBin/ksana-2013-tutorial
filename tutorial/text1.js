var Yadm=require('../ksanadb/Yadm4');
var db=new Yadm('./daodejin.ydb');

for (var i=0;i<50;i++) {
	var r=db.getText(i);
	console.log(i,r)
}


// var t = db.getText(0);
// console.log(t);
//
// var slotCount = db.meta.slotcount;
