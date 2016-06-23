var Yadm=require('../ksanadb/Yadm4');
var inputdb=process.argv[2] || 'daodejin.ydb';
if (inputdb.indexOf('.ydb')==-1) inputdb+='.ydb';

var db=Yadm('./'+inputdb);

var res=db.phraseSearch( '百姓', {showtext:true})
for (var nslot in res) {
	var ntag=db.closestTag( 'chapter',nslot);
	var tag=db.getTag('chapter',ntag);
	console.log(nslot,tag,res[nslot].trim());
}

