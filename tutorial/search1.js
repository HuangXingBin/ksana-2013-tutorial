var Yadm=require('../ksanadb/Yadm4');
var db=new Yadm('./daodejin.ydb');

var res=db.phraseSearch( '百姓',{showtext:true}) // raw:true , showtext:true
for (var i in res) {
	console.log(i,res[i])
	//	console.log(i, db.getText(res[i][0]));
}


