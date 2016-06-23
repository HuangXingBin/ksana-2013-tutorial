/*
	better tag support, finer granularity 

	split the input file into sentences.
	textseq is a continuos number.
	each posting = textseq<<blockshift + offset_in_sentence

	multilevel id . each id point to a posting
	user may choose to remove or keep tag during indexing.

	<pb ed="xx" n="xx"/> will probably removed.
	
	text saving strategy:
	a file is sliced into sentences.
	sentence has a mininum size of 64 tokens. 1 slot.
	long sentence will overflow to another slot.
	
	
	internal document pointer = slot+token offset

	tag saving strategy:
	a tag will convert into key,
	    1)where the key is unique and *sane*:
	        multiple level key , with a attached posting number. (vint)
	        defer loading is support, lookup is fast once the group is loaded.
	    2) where the key is unique but not sane:
	       a sorted stringlist with an array of vint.
	       which is fast for thousands of keys and provide very fast lookup,
	        but slower on loading
	    3) the key is not unique , or natural order of keys must be keeped
	        a unsorted stringlist with an array of packed posting number (sorted)

	2013/5/4

*/
var fs=require('fs');
var splitter=require('./splitter');
var objhelper=require('./objhelper');

var taginfo={ //default behavior, remove:false, index:false
	'pb' :{ remove:true, index:true},
	'lb' : { remove:true, index:true},
}

var Parser = function(context,buffer) {
	var isbreaker_def=function(ch) {
		var c=ch.charCodeAt(0);
		return  ( c==0xf0d || c==0x3002 || ch=='.') ;
	}	
	context.isbreaker=context.isbreaker||isbreaker_def;	
	buffer=buffer.replace(/\r\n/g,'\n');
	buffer=buffer.replace(/\r/g,'\n');		
	context.onsentence = context.onsentence || function(){};
	context.ontag = context.ontag || function(){};
	context.sentence='';
	context.hidetext=false;
	var i=0;
	while (i<buffer.length) {
		t=buffer[i];
		if (context.isbreaker(t)) {
			while (t&& (context.isbreaker(t) || t==' ') && i<buffer.length) {
				context.sentence+=t;
				t=buffer[++i];
			}
			context.onsentence.call(context);
		} else if (t=='<') {
			var tag='';
			while (i<buffer.length) {
				tag+=buffer[i++];
				if (buffer[i-1]=='>') break;
			}
			/*
			context.sentence+=opts.ontag.apply(context, [tag]);
			no working as expected , because context.sentence is changed in ontag handler
			*/
			var r=context.ontag.apply(context, [tag]);
			context.sentence+=r;
		} else {
			if (!context.hidetext) {
				context.sentence+=t;
			}
			i++;
		}
	}
	if (context.sentence) context.onsentence.call(context);
}
var extracttagname=function(xml) {
	var tagname=xml.substring(1);
	if (tagname[0]=='/') tagname=tagname.substring(1);
	tagname=tagname.match(/(.*?)[ \/>]/)[1];	
	return tagname;
}


var initialize=function(context) {
	context.taginfo=objhelper.MergeRecursive(taginfo, context.taginfo||{}) ;
	if (typeof context.tags=='undefined') context.tags={};
	if (typeof context.totalsentencecount=='undefined') {
		context.totalsentencecount=0;
	}
	
	context.initialized=true;
}
var parsefile=function(context,filebuffer) {
	var setuphandler=function() {
		for (var i in context.taginfo) {
			var h=context.taginfo[i].handler;
			if (typeof h == 'string') {
				context.taginfo[i].handler=taghandlers[h];
			}
		}
	}	
	context.onsentence=function() {
		this.sentences.push(this.sentence);
		//console.log(this.sentences.length,this.sentence);
		this.sentence='';
	}
		
	context.ontag=function(tag) {
		var tagname=extracttagname(tag);
		var ti=this.taginfo[tagname];
		if (!ti) ti={};
		ti.tagname=tagname;
		ti.opentag=true;
		ti.closetag=false;
		ti.tag=tag;

		if (tag.substr(tag.length-2,1)=='/') ti.closetag=true;
		if (tag.substr(1,1)=='/') {ti.closetag=true; ti.opentag=false;}

		if (ti.comment) {
			if (ti.opentag) context.hidetext=true;
			if (ti.closetag) context.hidetext=false;
		}

		if (ti.handler) ti.handler.apply(this,[ti, this.sentence.length]);
		return defaulttaghandler.apply(this,[ti,this.sentence.length]);
	}
	if (!context.initialized) throw ' not initialized'
	context.sentences=[];	
	setuphandler();
	var parser=new Parser(context,filebuffer);
	context.totalsentencecount+=context.sentences.length;
}
/* handle slot overflow */
var addslot=function(context, tokencount,sentence) {
	var extraslot=  Math.floor( tokencount / context.maxslottoken ); //overflow
	if (extraslot>0) {
		console.log('overflow '+tokencount,sentence.substring(0,30)+'...');
	}
	var slotgroup=Math.floor(context.slotcount / context.slotperbatch );//
	if (!context.slottexts[slotgroup]) context.slottexts[slotgroup]=[];
	context.slottexts[slotgroup].push( sentence);
	context.sentence2slot[context.nsentence]=context.slotcount;
	context.slotcount+=(1+extraslot);
	context.extraslot+=extraslot;
	context.nsentence++;
	while (extraslot--) {
		context.slottexts[slotgroup].push(''); //insert null slot
	}
}
/* convert tags sentence number to slot number */
var tagsentence2slot=function(tags, mapping){
	for (var i in tags) {
		for (var j in tags[i].slot ) {
			tags[i].slot[j]= mapping[ tags[i].slot[j] ];
		}
	}
	return tags;
}
var initcontext=function(context) {
	context.settings=context.settings || {};
	context.customfunc=context.customfunc||{};
	context.slotperbatch=context.slotperbatch||256;
	context.settings.blockshift=context.meta.blockshift||5;
	context.normalize=context.normalize || function( t) {return t.trim()};
	context.maxslottoken = 2 << (context.settings.blockshift -1);
	console.log('context.meta.blockshift',context.settings.blockshift, ' maxslottoken',context.maxslottoken)

	if (typeof context.slottexts=='undefined') { //first file
		context.nsentence=0;
		context.slotcount=0;
		context.extraslot=0;
		context.sentence2slot=[]; // sentence number to slot number mapping
		context.slottexts=[];	
	}
}
var build=function(context) {

	initcontext(context);	
	if (!context.invert) {
		throw ' please supply invert builder'
	}
	for (var i=0;i<context.sentences.length;i++) {
		var splitted=context.invert.addslot(context.slotcount, context.sentences[i]);
		var indexabletokencount=splitted.tokens.length-splitted.skiptokencount;
		addslot(context, indexabletokencount, context.sentences[i]);
	}

	return true;
}

var finalize=function(context) {
	//convert sentence seq to slot seq
	context.tags=tagsentence2slot(context.tags, context.sentence2slot);
}
/*
	split multilevel id and create tree structure
*/
var iddepth2tree=function(obj,id,nslot,depth,ai ,tagname) {
	var idarr=null;
	if (ai.cbid2tree) idarr=ai.cbid2tree(id); else idarr=id.split('.');
	if (idarr.length>depth) {
		throw 'id depth exceed';
		return;
	}
	while (idarr.length<depth) idarr.push('0');
	for (var i=0;i<idarr.length-1;i++) {
		if (!obj[ idarr[i]]) obj[ idarr[i]]={};
		obj = obj[ idarr[i]];
	}
	var val=idarr[idarr.length-1];

	if (typeof obj[val] !=='undefined') {
		if (ai.allowrepeat) {
			if (typeof obj[val]=='number') obj[val]=[ obj[val] ] ; // convert to array
			obj[val].push( nslot );
		} else {
			console.log('repeated val:',val, ', tagname:',tagname);
		}
	} else  {
		obj[val]= nslot; 
	} 
}
var defaulttaghandler=function(taginfo,offset) {
	var k=taginfo.tagname;
	var hidetag=false;
	if (taginfo.append) k+=taginfo.append;
	if (!this.tags[k]) this.tags[k]={ };

	if (taginfo.newslot && this.sentence) {
		if (taginfo.closetag) {
			if (taginfo.savehead) {
				var k=taginfo.tagname;
				if (!this.tags[k]) this.tags[k]={head:[]};
				if (typeof this.tags[k].head=='undefined') this.tags[k].head=[];
				var p=this.sentence.indexOf('>');
				var headline=this.sentence.substring(p+1);
				this.tags[k].head.push(headline);	
			}
			this.sentence+=taginfo.tag;
			hidetag=true; //remove closetag as already put into sentence
		}
		this.onsentence.call(this);
	}

	if (taginfo.savepos && taginfo.opentag) {
		if (!this.tags[k].slot) this.tags[k].slot=[];
		if (!this.tags[k].offset) this.tags[k].offset=[];
		this.tags[k].slot.push(this.totalsentencecount + this.sentences.length);
		this.tags[k].offset.push(offset);
	}

	if (taginfo.indexattributes && taginfo.opentag) for (var i in taginfo.indexattributes) {
		var attrkey=i+'=';
		if (!this.tags[k][attrkey]) this.tags[k][attrkey]={};
		var val=taginfo.tag.match( taginfo.indexattributes[i].regex);
		if (val) {
			val=val[1];
			var depth=taginfo.indexattributes[i].depth || 1;
			iddepth2tree(this.tags[k][attrkey], val, this.tags[k].slot.length -1,  depth, taginfo.indexattributes[i] , taginfo.tagname);
		} else {
			throw 'empty val '+taginfo.tag
		}
	}

	if (hidetag||taginfo.comment|| taginfo.remove) return '' ;else return taginfo.tag;	
}
var taghandlers = {
	pb: function(taginfo,offset) {
		if (taginfo.closetag && !taginfo.opentag) return;
		var k=taginfo.tagname;
		var ed=taginfo.tag.match(/ ed="(.*?)"/);
		if (ed) {	
			ed=ed[1]; 
			taginfo.append="."+ed; //with edition
		}
		if (typeof taginfo.remove =='undefined') taginfo.remove=true;
	}
}
var API={parsefile:parsefile,build:build,finalize:finalize,initialize:initialize};
module.exports=API;