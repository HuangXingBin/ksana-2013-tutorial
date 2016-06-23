/*
fetch by chapter
*/
var Yadm=require('../ksanadb/Yadm4');
var db=new Yadm('./daodejin.ydb');

console.log(db.getTextByTag({tag:'chapter',attribute:'n',value:'9'}))