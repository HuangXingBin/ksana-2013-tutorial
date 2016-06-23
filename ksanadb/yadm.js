/*
ya data mining

yadb for supporting full text search
*/

require('./yadbr.js');
var plist=require('./plist');

Yadm = function(fn) { 
	var db = new Yadb();
	this.cache={};
	this.cache.postings={};
	this.cache.texts={};
	var dmload=function(instance) {
		instance.meta=db.getJSON(['meta'], true);
		if (instance.meta.idseq) {
			instance.meta.idseq=JSON.parse(instance.meta.idseq);
		}
		instance.customfunc=db.getJSON(['customfunc'], true);
		for (var i in instance.customfunc) {
			//compile the custom function
			var r=new Function(instance.customfunc[i]);
			instance.customfunc[i]=r();
		}
	}
	//get the n key ( waiting yakov to store natural order
	var getnkey=function(f,n) {
		var k=null;
		for (var i=0;i<f.KEY.id.length;i++) {
			if (f.KEY.id[i]==n) {
				k=f.KEY.key[i];
				break;
			}
		}
		return k;
	}
	this.seq2id_flat=function(seq,section) {
		if (!db.flatmap) { // build flat map
			db.flatmap=[];
			
			var f=db.cd(section); //CD is very slow
			for (var i in f.KEY.id) {
				db.flatmap[f.KEY.id[i]]=f.KEY.key[i];
			}
		}
		return db.flatmap[seq];
	}
	
	this.seq2id_internal=function(seq,section) {
		if (this.meta.iddepth==2) {
			return this.seq2id_internal2(seq,section);
		} else {
			return this.seq2id_internal3(seq,section);
		}
	}

	this.seq2id_internal2=function(seq,section) {
		section=section||'texts';
		var idseq=this.meta.idseq;
		if (!idseq) return this.seq2id_flat(seq,section);
		
		var output=[];
		var f=db;
		if (!db.cache) db.cache={};
		
		if (section) f=db.cd(section)||db.cache[section];
		db.cache[section]=f;
		
		if (seq<1) return ""; //invalid key
		for (var i=0;i<idseq.length;i++ ) { //first level
			if (idseq[i]>seq) break;
		}
		output.push(getnkey(f,i-1));
		
		var diff=seq-idseq[i-1];
		f=f.cd(getnkey(f,i-1));
		output.push(getnkey(f,diff));
		
		if (this.meta.version>=0x20130128)
			for (var i in output) if(output[i][0]=='.') output[i]=output[i].substring(1);
		return output.join('.');
	}

	this.seq2id_internal3=function(seq,section) {
		section=section||'texts';
		var idseq=this.meta.idseq;
		if (!idseq) return this.seq2id_flat(seq,section);
		
		var output=[];
		var f=db;
		if (!db.cache) db.cache={};
		
		if (section) f=db.cd(section)||db.cache[section];
		db.cache[section]=f;
		
		if (seq<1) return ""; //invalid key
		for (var i=0;i<idseq.length;i++ ) { //first level
			if (idseq[i][0]>seq) break;
		}
		output.push(getnkey(f,i-1));
		
		f=f.cd(getnkey(f,i-1));
		for (var j=0;j<idseq[i-1].length;j++) {
			if (idseq[i-1][j]>seq) break;
		}
		
		output.push(getnkey(f,j-1));
		var diff=seq-idseq[i-1][j-1];
		
		f=f.cd(getnkey(f,j-1));
		var last=getnkey(f,diff)||'0';
		output.push(last);
		
		if (this.meta.version>=0x20130128)
			for (var i in output) if(output[i] && output[i][0]=='.') output[i]=output[i].substring(1);		
		return output.join('.');
	}	
	this.id2seq_internal=function(id) {
		var idarr=id.split('.');
		
		var iddepth=3; //default 3
		while (idarr.length<iddepth+1) idarr.push('0');
		
		var f=db;
		var posarr=[];
		//find out the natural order of each level of keys
		for ( var i=0;i<iddepth+1;i++) {
			var key=idarr[i];
			if (!isNaN(key)) key='.'+key;
			//console.log(key);
			var p=f.find(key);
			
			if (i>0) posarr.push(p);
			f=f.cd(key);
			if (!f) return -1;
		}
		return this.meta.idseq[posarr[0]][posarr[1]]+posarr[2];
	}
	
	if (fn) {
		db.open(fn);		
		dmload(this);
	} else throw 'missing filename';
	
	this.getdb=function() {return db;}
	return this;
}


Yadm.prototype.getPostingById=function(id) {
	var r=this.cache.postings[id];
	if (r) return r;
	if (this.customfunc.token2tree) {
		var idarr=this.customfunc.token2tree(id);
	} else {
		var idarr=[id];
	}
	idarr.unshift('postings');
	idarr.push('d');
	var r=plist.loadfrombase64(this.getdb().getJSON(idarr));
	if (r) this.cache.postings[id]=r;
	return r;
}
/* phrase search, simple phrase only,
caller to remove tag*/
Yadm.prototype.seq2id=function(seq) {

	if (seq.constructor.name==='Array') {
		var r=[];
		for (var i=0;i<seq.length;i++) {
			r.push( this.seq2id_internal( parseInt(seq[i])));
		}
		return r;
	} else if (seq.constructor.name==='Object') {
		var r={};
		for (var i in seq) {
			var id=this.seq2id_internal( parseInt(i));
			r[id]=seq[i];
		}
		return r;
	} else if (seq.constructor.name==='String') {
		seq=parseInt(seq);
	}
	return this.seq2id_internal(seq);
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
			last=off[i-1+till];

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
	
	for (var i in R) {
		var hits=R[i];
		R[i]=highlight({
			splitter:dm.customfunc.splitter,
			hits:hits,
			text:dm.getTextById(i),
			phraselength:phraselength
		});
		rescount++;
		if (rescount>50) break;
	}
	return R;
}
Yadm.prototype.phrasesearch=function(tofind,opts) {
	var splitter=this.customfunc.splitter;
	var postings=[];
	opts=opts||{};
	var tokens=splitter(tofind).tokens;
	
	for (var i in tokens) {
		var posting=this.getPostingById(tokens[i]);
		
		postings.push(posting);
	}
	var raw=plist.plphrase(postings);

	var g=plist.groupbyblock(raw, this.meta.blockshift);
	if (opts.raw) return g;
	
	var R=this.seq2id(g);
	
	if (opts.showtext) {
		R=highlightresult(this,R,tokens.length);
	}
	return R;
}

Yadm.prototype.getTextById=function(id) {
	var r=this.cache.texts[id];
	if (r) return r;
	var idarr=id.split('.');
	
	if (this.meta.version>=0x20130128)
		for (var i in idarr) if(!isNaN(idarr[i])) idarr[i]='.'+idarr[i];
	
	while (idarr.length<this.meta.iddepth) {
		idarr.push('.0');
	}
	
	idarr.unshift('texts');
	idarr.push('text');
	r=this.getdb().getJSON(idarr);
	this.cache.texts[id]=r;
	return r;
}
//return range of id given start and end
Yadm.prototype.getRange=function(start,end,opts) {
	opts=opts||{};
	var limit=opts.limit||100;
	console.time('getRange');
	var startseq=this.id2seq_internal('texts.'+start);
	var endseq=this.id2seq_internal('texts.'+end);
	//console.log(startseq,endseq);
	//console.log(start,end,startseq,endseq);
	var output=[];
	for (var i=startseq;i<=endseq;i++) {
		output.push(this.seq2id_internal(i));
		if (output.length>=limit) break;
	}
	console.timeEnd('getRange');
	return output;
}

module.exports=Yadm;