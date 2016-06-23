/*
	YADB version 3.0 GPL
	yapcheahshen@gmail.com
	2013/2/14
*/

if (typeof yaui_platform=="undefined") {
	var Yfs=require('./yadb3_fs');
} else {
	var Yfs=require('./yaui_fs');
}

var DT={
	uint8:'1', //unsigned 1 byte integer
	int32:'4', // signed 4 bytes integer
	utf8:'8',  
	ucs2:'2',
	utf8arr:'*', //shift of 8
	ucs2arr:'@', //shift of 2
	uint8arr:'!', //shift of 1
	int32arr:'$', //shift of 4
	vint:'`',
	pint:'~',		
	array:'\u001b',
	object:'\u001a' 
	//ydb start with object signature,
	//type a ydb in command prompt shows nothing
}

var Create=function(path,opts) {
	var yfs=new Yfs(path,opts);
	this.fs=yfs
	var cur=0;
	/* loadxxx functions move file pointer */
	// load variable length int
	var loadVInt =function(blocksize,count) {
		if (count==0) return [];
		var o=yfs.readBuf_packedint(cur,blocksize,count,true);
		cur+=o.adv;
		return o.data;
	}
	var loadVInt1=function() {
		return loadVInt(6,1)[0];
	}
	//for postings
	var loadPInt =function(blocksize,count) {
		var o=yfs.readBuf_packedint(cur,blocksize,count,false);
		cur+=o.adv;
		return o.data;
	}
	// item can be any type (variable length)
	// maximum size of array is 1TB 2^40
	// structure:
	// signature,5 bytes offset, payload, itemlengths
	var loadArray = function(blocksize,lazy) {
		var lengthoffset=yfs.readUI8(cur)*4294967296;
		lengthoffset+=yfs.readUI32(cur+1);
		cur+=5;
		var dataoffset=cur;
		cur+=lengthoffset;
		var count=loadVInt1();
		var sz=loadVInt(count*6,count);
		var o=[];
		var endcur=cur;
		cur=dataoffset; 
		for (var i=0;i<count;i++) {
			if (lazy) { 
				//store the offset instead of loading from disk
				var offset=dataoffset;
				for (var i=0;i<sz.length;i++) {
				//prefix with a \0, impossible for normal string
					o.push("\0"+offset.toString(16)
						   +"\0"+sz[i].toString(16));
					offset+=sz[i];
				}
			} else {			
				o.push(load({blocksize:sz[i]}));
			}
		}
		cur=endcur;
		return o;
	}		
	// item can be any type (variable length)
	// support lazy load
	// structure:
	// signature,5 bytes offset, payload, itemlengths, 
	//                    stringarray_signature, keys
	var loadObject = function(blocksize,lazy, keys) {
		var start=cur;
		var lengthoffset=yfs.readUI8(cur)*4294967296;
		lengthoffset+=yfs.readUI32(cur+1);cur+=5;
		var dataoffset=cur;
		cur+=lengthoffset;
		var count=loadVInt1();
		var lengths=loadVInt(count*6,count);
		var keyssize=blocksize-cur+start;	
		var K=load({blocksize:keyssize});
		var o={};
		var endcur=cur;
		
		if (lazy) { 
			//store the offset instead of loading from disk
			var offset=dataoffset;
			for (var i=0;i<lengths.length;i++) {
				//prefix with a \0, impossible for normal string
				o[K[i]]="\0"+offset.toString(16)
					   +"\0"+lengths[i].toString(16);
				offset+=lengths[i];
			}
		} else {
			cur=dataoffset; 
			for (var i=0;i<count;i++) {
				o[K[i]]=(load({blocksize:lengths[i]}));
			}
		}
		if (keys) K.map(function(r) { keys.push(r)});
		cur=endcur;
		return o;
	}		
	//item is same known type
	var loadStringArray=function(blocksize,encoding) {
		var o=yfs.readStringArray(cur,blocksize,encoding);
		cur+=blocksize;
		return o;
	}
	var loadIntegerArray=function(blocksize,unitsize) {
		var count=loadVInt1();
		var o=yfs.readFixedArray(cur,count,unitsize);
		cur+=count*unitsize;
		return o;
	}	
	
	var load=function(opts) {
		opts=opts||{};
		var blocksize=opts.blocksize||yfs.size; 
		var signature=yfs.readSignature(cur);
		cur+=yfs.signature_size;
		var datasize=blocksize-yfs.signature_size;
		//basic types
		if (signature===DT.int32) {
			cur+=4;
			return yfs.readI32(cur-4);
		} else if (signature===DT.uint8) {
			cur++;
			return yfs.readUI8(cur-1);
		} else if (signature===DT.utf8) {
			var c=cur;cur+=datasize;
			return yfs.readString(c,datasize,'utf8');	
		} else if (signature===DT.ucs2) {
			var c=cur;cur+=datasize;
			return yfs.readString(c,datasize,'ucs2');	
		} 
		//variable length integers
		else if (signature===DT.vint) return loadVInt(datasize);
		else if (signature===DT.pint) return loadPInt(datasize);
		//simple array
		else if (signature===DT.utf8arr) return loadStringArray(datasize,'utf8');
		else if (signature===DT.ucs2arr) return loadStringArray(datasize,'ucs2');
		else if (signature===DT.uint8arr) return loadIntegerArray(datasize,1);
		else if (signature===DT.int32arr) return loadIntegerArray(datasize,4);
		//nested structure
		else if (signature===DT.array) return loadArray(datasize,opts.lazy);
		else if (signature===DT.object) {
			return loadObject(datasize,opts.lazy,opts.keys);
		}
		else throw 'unsupported type '+signature;
	}
	var CACHE=null;
	var KEYS={};
	var reset=function() {
		cur=0;
		CACHE=load({lazy:true});
	}

	var get=function(path,recursive) {
		recursive=recursive||false;
		if (!CACHE) reset();	
		var o=CACHE;

		var pathnow="";
		for (var i in path) {
			var r=o[path[i]] ;
			if (parseInt(i)) pathnow+="\0";
			pathnow+=path[i];
			if (r===undefined) return undefined;
			if (r[0]=="\0") { //offset of data to be loaded
				var keys=[];
				var p=r.substring(1).split("\0").map(
					function(item){return parseInt(item,16)});
				cur=p[0];
				o[path[i]]=load({lazy:!recursive,blocksize:p[1],keys:keys});
				KEYS[pathnow]=keys;
				o=o[path[i]];
			} else {
				o=r; //already in cache
			}
		}
		return o;
	}
	// get all keys in given path
	var getkeys=function(path) {
		if (!path) path=[]
		get(path); // make sure it is loaded
		if (path && path.length) {
			return KEYS[path.join("\0")];
		} else {
			return Object.keys(CACHE); 
			//top level, normally it is very small
		}
		
	}

	this.free=yfs.free;
	this.load=load;
	this.cache=function() {return CACHE};
	this.keys=getkeys;
	this.get=get;   // get a field, load if needed
	this.getJSON=get; //compatible with yadb2
	this.size=yfs.size;
}

Create.datatypes=DT;
if (module) module.exports=Create;
return Create;
