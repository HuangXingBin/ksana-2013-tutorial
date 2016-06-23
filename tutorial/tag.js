var Yadm=require('../ksanadb/Yadm4');
var inputdb=process.argv[2] || 'sunzhi.ydb';
if (inputdb.indexOf('.ydb')==-1) inputdb+='.ydb';
var db=Yadm('./'+inputdb);

var res=db.phraseSearch( '知敵', {raw:true})
for (var i in res) {
	var tagid=db.closestTag( 'chapter',i);
	var tag=db.getTag('chapter',tagid);
	console.log(i,res[i],'\n\t','ntag:',tagid,tag)
	console.log(db.getText(tag.slot),'q')
}
