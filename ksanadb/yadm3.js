/*
ya data mining

yadb for supporting full text search
*/

var Yadb3=require('./yadb3.js');
var plist=require('./plist.js');

Yadm = function(fn) { 
	var db = null;
	var phrasecache={};
	var dmload=function(instance) {
		instance.meta=db.get(['meta'],true);
		instance.customfunc=db.get(['customfunc'],true);
		for (var i in instance.customfunc) {
			//compile the custom function
			var r = new Function(instance.customfunc[i])
			instance.customfunc[i]=r();
		}
		
	}

	this.seq2id_flat=function(seq,section) {
		throw 'not support flat';
		if (!db.flatmap) { // build flat map
			db.flatmap=[];
			
			var f=db.cd(section); //CD is very slow
			for (var i in f.KEY.id) {
				db.flatmap[f.KEY.id[i]]=f.KEY.key[i];
			}
		}
		return db.flatmap[seq];
	}
	
	this.seq2id_internal=function(seq) {
		if (this.meta.iddepth==2) {
			return this.seq2id_internal2(seq);
		} else {
			return this.seq2id_internal3(seq);
		}
	}

	this.seq2id_internal2=function(seq) {
		section='texts';
		var idseq=this.meta.idseq;
		if (!idseq) return this.seq2id_flat(seq,section);
		
		var output=[];
		
		if (seq<1) return ""; //invalid key
		for (var i=0;i<idseq.length;i++ ) { //first level
			if (idseq[i]>seq) break;
		}
		var k1=this.getdb().keys([section])[i-1];
		output.push( k1 );
		
		var diff=seq-idseq[i-1];
		var k2=this.getdb().keys([section,k1])[diff] ||'0';
		output.push(k2);
			
		//for (var i in output) if(output[i][0]=='.') output[i]=output[i].substring(1);
		return output.join('.');
	}

	this.seq2id_internal3=function(seq) {
		
		section='texts';
		var idseq=this.meta.idseq;
		if (!idseq) return this.seq2id_flat(seq,section);
		
		var output=[];
		var f=db;
		var db=this.getdb();
	
		
		if (seq<1) return ""; //invalid key
		for (var i=0;i<idseq.length;i++ ) { //first level
			if (idseq[i][0]>seq) break;
		}
		var k1=db.keys([section])[i-1];
		output.push( k1 );
		
		for (var j=0;j<idseq[i-1].length;j++) {
			if (idseq[i-1][j]>seq) break;
		}
		
		var k2=db.keys([section,k1])[j-1];
		output.push(k2);
		
		var diff=seq-idseq[i-1][j-1];
		
		var k3=db.keys([section,k1,k2])[diff] ||'0';
		output.push(k3);
			
		//for (var i in output) if(output[i] && output[i][0]=='.') output[i]=output[i].substring(1);		
		return output.join('.');
	}	
	this.id2seq=function(id,section) {
		var idarr=id.split('.');
		
		var iddepth=3; //default 3
		while (idarr.length<iddepth+1) idarr.push('0');

		var posarr=[];
		section=section||'texts';
		var path=[section];
		//find out the natural order of each level of keys
		for ( var i=0;i<iddepth;i++) {
			var key=idarr[i];
			//if (!isNaN(key)) key='.'+key;
			var keys=this.getdb().keys(path);
			if (!keys) return -1;
			var p= keys.indexOf(key);
			if (p<0) return -1;
			path.push(key);
			posarr.push(p);
		}
		return this.meta.idseq[posarr[0]][posarr[1]]+posarr[2];
	}
	
	if (fn) {
		//console.log(fn);
		var db = new Yadb3(fn);	
		dmload(this);
	} else throw 'missing filename';
	
	this.getdb=function() {return db;}
	this.phrasecache={};
	return this;
}


Yadm.prototype.getPostingById=function(id) {
	if (this.customfunc.token2tree) {
		var idarr=this.customfunc.token2tree(id);
	} else {
		var idarr=[id];
	}
	idarr.unshift('postings');
	var r=this.getdb().get(idarr);
	return r;
}
/* phrase search, simple phrase only,
caller to remove tag*/
Yadm.prototype.seq2id=function(seq) {

	if (seq.constructor.name==='Array') { // return seq in an array
		var r=[];
		for (var i=0;i<seq.length;i++) {
			r.push( this.seq2id_internal( parseInt(seq[i])));
		}
		return r;
	} else if (seq.constructor.name==='Object') { // object key as id,attach the seq in the value
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
	
	for (var i in R) {
		var hits=R[i];
		R[i]=highlight({
			splitter:dm.customfunc.splitter,
			hits:hits,
			text:dm.getTextById(i),
			phraselength:phraselength
		});
		rescount++;
		//if (rescount>50) break;
	}
	return R;
}
var profile=true;
Yadm.prototype.phrasesearch=function(tofind,opts) {
	var splitter=this.customfunc.splitter;
	var postings=[];
	opts=opts||{};
	var tokens=splitter(tofind).tokens;
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
		var raw=plist.plphrase(postings);
		if (profile) console.timeEnd('phrase merge')
		if (profile) console.time('group block')
		
		var g=plist.groupbyblock(raw, this.meta.blockshift);
		if (profile) console.timeEnd('group block')		
		if (this.phrasecache) this.phrasecache[tofind]=g;
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
	if (profile) console.time('seq2id');
	var R=this.seq2id(g);
	if (profile) console.timeEnd('seq2id')
	if (profile) console.time('highlight')
	if (opts.showtext) {
		R=highlightresult(this,R,tokens.length);
	}
	if (profile) console.timeEnd('highlight')
	
	return R;
}
Yadm.prototype.getKeys=function(id) {
	if (id) 	var r= this.getdb().keys(['texts',id]);
	else 	var r= this.getdb().keys(['texts']); //list all keys

	var out=[];
	var idsplitter=this.meta.idsplitter||".";
	for (var i in r) {
		if (id)	out.push( id + idsplitter+r[i]);
		else out.push(r[i]);
	}
	return out;
}
Yadm.prototype.getTextById=function(id) {
	var idarr=id.split('.');
	
	//for (var i in idarr) 
	//	if(!isNaN(idarr[i])) idarr[i]='.'+idarr[i];
	
	while (idarr.length<this.meta.iddepth) idarr.push('0');
	
	idarr.unshift('texts');
	r=this.getdb().get(idarr);

	return r;
}
//return range of id given start and end
Yadm.prototype.getRange=function(start,end,opts) {
	opts=opts||{};
	var limit=opts.limit||100;
	//console.time('getRange');
	var startseq=this.id2seq(start);
	var endseq=this.id2seq(end);
	//console.log(startseq,endseq);
	//console.log(start,end,startseq,endseq,endseq-startseq);
	var output=[];
	for (var i=startseq;i<endseq;i++) {
		var id=this.seq2id_internal(i);
		//console.log(id);
		output.push(id);
		if (output.length>=limit) break;
	}
	//console.timeEnd('getRange');
	return output;
}
var findsuggestion=function(db,path,level,out) {
	var nor=db.customfunc.findnormalizetoken;
	var P=[];
	for (var i=0;i<level;i++) {
		P.push(path[i]);
	}
	db.getdb().get(P);
	var keys=db.getdb().keys(P);

	if (path.length==level) {
		for (var i in keys) {
			var top=path.shift();
			out.push( path.join('')+keys[i]);
			path.unshift(top);
		}
		return;
	}
	var tf=path[level];
	
	for (var i=0;i<keys.length;i++) {
		var N=nor(keys[i]);
		if (N.substring(0,tf.length)==tf) { 
			if (N==tf) { //full match
				if (level==path.length || level==db.meta.iddepth+1) {
					var top=path.shift();
					out.push( path.join(''));
					path.unshift(top);
					return;
				} else {
					path[level]=keys[i];
					findsuggestion(db,path,level+1,out);
				}
			} else {
				if (level+1==path.length) {
					var top=path.shift();
					var pop=path.pop();			
					var k=path.join('')+keys[i];
					if (path.length<db.meta.iddepth) k+='...';
					out.push(k);
					path.unshift(top);
					path.push(pop);
				}
			}
		}
	}
}
Yadm.prototype.suggest=function(tofind) {
	var tokentree=this.customfunc.token2tree(tofind);
	while (!tokentree[tokentree.length-1].trim()) {
		tokentree.pop();
	}
	tokentree.unshift('postings');
	var out=[];
	
	findsuggestion(this,tokentree,1,out);
	return out;
}
module.exports=Yadm;
return Yadm;