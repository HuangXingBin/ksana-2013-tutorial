module.exports=require('../launcher/builder').runproj()(function(){
	var fs=require('fs');
	var yadm4custom=require('./yadm4custom');
	var tokens=require('./tokens');
	var projdir=process.cwd()+'/';
	var P={};
	P.projdir=projdir;
	P.files=[];
	P.setopt=function(opts) {
		P.name=opts.substr( 0, opts.length-4);
		P.request.outputfilename=P.projdir+P.name+".ydb",
		P.files=[opts];
	}
	P.name="unnamed";
	P.workername="../ksanadb/ydb4.worker.js";


	P.request={
		datadir:'./',
		projdir:projdir,
		encoding:'utf8',
		outputfilename:projdir+P.name+".ydb",

		taginfo:{
			's':{remove:true},
			'rem':{comment:true},
			'book':{newslot:true, savepos:true, savehead:true},
			'chapter':{newslot:true, savepos:true, savehead:true, indexattributes:{ n: {regex: / n="(.*?)"/, allowrepeat: false}}},
			'pb':{savepos:true, handler:'pb',indexattributes:{ n: {regex: / n="(.*?)"/, allowrepeat: false, depth:2}  } }
		}		
	};

	P.meta={  // in yadb
		blockshift:8,  
		maintainer:'yapcheahshen@gmail.com'
	}
	
	P.customfunc=yadm4custom;
	P.customfunc.token2tree=tokens.token2tree;
	P.customfunc.processinverted=tokens.postings2tree,
	P.customfunc.splitter=tokens.splitter,
	
	P.getfiles=function( opts, callback ) {
		callback(P.files);
	}
	
	return P ;
});