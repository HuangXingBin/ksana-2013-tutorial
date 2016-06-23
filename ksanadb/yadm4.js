/*
ya data mining

yadb for supporting full text search
*/

var Yadb3=require('./yadb3.js');
var plist=require('./plist.js');
var binarysearch=require('./binarysearch')

var getPostingById=function(id) {
	if (this.customfunc.token2tree) {
		var idarr=this.customfunc.token2tree(id);
	} else {
		var idarr=[id];
	}
	idarr.unshift('postings');
	var r=this.getdb().get(idarr);
	return r;
}
var highlight=function(opts) {
	
	var res=opts.splitter(opts.text);
	var i=0,j=0,last=0,voff=0;
	var off=res.offsets;
	var output='';
	
	while (i<res.tokens.length) {
		if (!res.skips[i]) voff++;
		if (j<off.length && voff==opts.hits[j]) {
			output+= opts.text.substring(last, off[i-1]+1);
			output+= '<hl>';
			var len=opts.phraselength;
			var till=0;
			while (len) {
				if (!res.skips[i+till]) { len--}
				till++;
			}

			output+= opts.text.substring(off[i-1]+1,off[i-1+till]+1);
			last=off[i-1+till]+1;

			output+='</hl>';
			j++;
		}
		i++;
	}
	output+=opts.text.substring(last);
	return output;
}

var highlightresult=function(dm,R,phraselength) {
	var rescount=0;
	var blocksize = 2 << (dm.meta.blockshift -1);	
	//console.log('highlightresult',R)
	var lasttext='', lasti='', hits=[],addition=0;
	var output={};
	/* TODO , same sentence in multiple slot render once */
	for (var i in R) {
		var nslot=parseInt(i);
		var text=dm.getText(nslot);
		var hits=R[i];
		addition=0;
		while (!text && nslot) {
			nslot--;
			text=dm.getText(nslot);
			addition+=blocksize;
		}
		if (addition) hits=hits.map( function(j) {return addition+j});

		var h=highlight({
			splitter:dm.customfunc.splitter,
			hits:hits,
			text:text,
			phraselength:phraselength
		});
		output[nslot]=h;
	}
	if (lasttext) dohighlight();
	return output;
}
var profile=false;
var phraseSearch=function(tofind,opts) {
	var splitter=this.customfunc.splitter;
	var postings=[];
	opts=opts||{ungroup:true};
	var tokens=splitter(tofind).tokens;
	var g=null,raw=null;

	if (this.phrasecache_raw && this.phrasecache_raw[tofind]) {
		raw=this.phrasecache_raw[tofind];
	}

	if (this.phrasecache&& this.phrasecache[tofind]) {
		g=this.phrasecache[tofind];
	} else {
		if (profile) console.time('get posting');
		for (var i in tokens) {
			var posting=this.getPostingById(tokens[i]);
			postings.push(posting);
		}
		if (profile) console.timeEnd('get posting');
		if (profile) console.time('phrase merge')
		if (!raw) raw=plist.plphrase(postings);
		if (profile) console.timeEnd('phrase merge')
		if (profile) console.time('group block')
		if (opts.ungroup) return raw;
		//console.log(raw)
		var g=plist.groupbyblock(raw, this.meta.blockshift);
		if (profile) console.timeEnd('group block')		
		if (this.phrasecache) this.phrasecache[tofind]=g;
		if (this.phrasecache_raw) this.phrasecache_raw[tofind]=raw;
	}

	//trim output
	if (opts.start!=undefined) {
		opts.maxcount=opts.maxcount||10;
		var o={};
		var count=0;
		for (var i in g) {
			if (opts.start==0) {
				if (count>=opts.maxcount) break;
				o[i]=g[i];
				count++;
			} else {
				opts.start--;
			}
		}
		g=o;
	}

	if (opts.raw) return g;
	if (profile) console.time('highlight')
	var R="";
	if (opts.showtext) {
		R=highlightresult(this,g,tokens.length);
	}
	if (profile) console.timeEnd('highlight')
	return R;
}
var getKeys=function(id) {
	throw 'not implemented'
}
//return range of id given start and end
var getRange=function(start,end,opts) {
	throw 'not implemented'
}
var getText=function(seq) {
	 return this.customfunc.getText(this.getdb(),seq);
}

var getTextByTag=function(opts) {
	var db=this.getdb();
	var maxslot=opts.maxslot || 1000;

	if (opts.ntag) {
		tagseq=parseInt(opts.ntag);
	} else {
		var par=['tags',opts.tag,opts.attribute+'='].concat(opts.value);
		var tagseq=db.get(par) ;
	}

	var t=this.getTag(opts.tag,tagseq);
	var t2=this.getTag(opts.tag,1+tagseq);


	var seqarr=[];
	for (var i=t.slot;i<t2.slot;i++) {
		seqarr.push(i); 
		if (seqarr.length>maxslot) break; 
	}
	return {slot:t.slot, ntag: tagseq, starttag:t, endtag:t2, head:t.head, text:this.getText(seqarr)};
}	

var getTag=function(tagname,seq) {
	return this.customfunc.getTag(this.getdb(),tagname,seq);
}
var findTag=function(tagname,attributename,value) {
	return this.customfunc.findTag(this.getdb(),tagname,attributename,value);
}
var closestTag=function(tagname,nslot) {
	//100 times faster, 0.015 ms per search
	var slots= this.getdb().get(['tags',tagname,'slot'],true);
	return binarysearch.closest( slots,nslot );
	/*
	var slots= this.getdb().get(['tags',tagname,'slot'],true);
	for (var i=0;i<slots.length;i++) {
		if (slots[i]>nslot) return i-1;
	}
	return slots.length-1;
	*/
}
var genToc=function(toctree,opts) {
	var db=this.getdb();
	var start=opts.start || 0;
	var end=opts.end || db.meta.slotcount;

	var output=[];
	for (var i in toctree) {
		var slots=db.get(['tags',toctree[i],'slot']);
		for (var j in slots) {
			output.push( [ 1+parseInt(i), slots[j]])	
		}
		
	}
	output.sort( function(a,b) {return a[1]-b[1]});
	return output;
}
/*
Yadm.prototype.findCrlf=function(nslot) {
	var db=this.getdb();
	return this.customfunc.findCrlf(this.getdb(),nslot);
}
Yadm.prototype.getCrlfByRange=function(start,end) {
	return this.customfunc.getCrlfByRange(this.getdb(),start,end);
}
var addcrlf=function(ctx,db,start,end,nslot) {
	if (Object.keys(ctx).length==0) {
		ctx.crlfcount=0;
		ctx.startadv=0;
		ctx.endadv=0;
		ctx.n=0;
	}
	if (!ctx.startcrlf) ctx.startcrlf=db.findCrlf(start.slot);
	if (!ctx.endcrlf) ctx.endcrlf=db.findCrlf(end.slot+1);
	if (!ctx.crlf)      ctx.crlf=db.getCrlfByRange(ctx.startcrlf,ctx.endcrlf);

	while (nslot==ctx.crlf.slot[ctx.n] && ctx.n<ctx.crlf.slot.length) {
		var insert=ctx.crlf.offset[ctx.n]+ctx.crlfcount;
		t=t.substr(0,insert)+'\n'+t.substring(insert);
		if (nslot==start.slot && ctx.crlf.offset[ctx.n]<start.offset) ctx.startadv++;
		if (nslot==end.slot&&ctx.crlf.offset[ctx.n]<end.offset) ctx.endadv++;
		ctx.n++;ctx.crlfcount++;
	}
}
*/
var getToc=function(tagname,seq) {
	return this.getTag(tagname,seq).head;
}
var fetchPage=function(tagname,seq,opts) {
	opts=opts||{};
	var start=this.getTag(tagname,seq);
	var end=this.getTag(tagname,seq+1);

	var r=""
	for (var i=start.slot;i<=end.slot;i++) {
		t=this.getText(i);
		if (i==end.slot) t=t.substr(0,end.offset);
		if (i==start.slot) t=t.substr(start.offset);
		r+=t;
	}
	return r;
}


Yadm = function(fn) { 
	var db = null;
	var dmload=function(instance) {
		instance.meta=db.get(['meta'],true);
		instance.customfunc=db.get(['customfunc'],true);
		for (var i in instance.customfunc) {
			//compile the custom function
			var r = new Function(instance.customfunc[i])
			instance.customfunc[i]=r();
		}
		
	}

	if (fn) {
		//console.log(fn);
		var db = new Yadb3(fn);	
		dmload(this);
	} else throw 'missing filename';
	
	this.getdb=function() {return db;}
	this.getToc=getToc;
	this.getText=getText;
	this.getTag=getTag;
	this.findTag=findTag;
	this.fetchPage=fetchPage;
	this.getTextByTag=getTextByTag;
	this.phraseSearch=phraseSearch;
	this.getPostingById=getPostingById;
	this.closestTag=closestTag;
	this.genToc=genToc;
	this.phrasecache={};
	this.phrasecache_raw={};
	return this;
}

module.exports=Yadm;
return Yadm;