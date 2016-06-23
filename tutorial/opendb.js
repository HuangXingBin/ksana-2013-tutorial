var Yadm=require('../ksanadb/Yadm4');
var inputdb=process.argv[2] || 'daodejin.ydb';
if (inputdb.indexOf('.ydb')==-1) inputdb+='.ydb';
module.exports=new Yadm('./'+inputdb);