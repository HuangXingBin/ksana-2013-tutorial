/* OS dependent file operation */

var fs=require('fs');
var DT=require('./yadb3').datatypes;

var Create=function(path,opts) {
	var handle=null;
	var writeSignature=function(value,pos) {
		var buffer=new Buffer(value,'utf8');
		return fs.writeSync(handle,buffer,0,buffer.length,pos);
	}
	var writeOffset=function(value,pos) {
		var buffer=new Buffer(5);
		buffer.writeUInt8(Math.floor(value / (65536*65536)),0);
		buffer.writeUInt32BE( value & 0xFFFFFFFF,1);
		return fs.writeSync(handle,buffer,0,buffer.length,pos);
	}
	var writeString= function(value,pos,encoding) {
		encoding=encoding||'ucs2';
		if (encoding==='utf8') {
			var buffer=new Buffer(DT.utf8+value,'utf8');
		} else if (encoding==='ucs2'){
			var buffer=new Buffer(value.length*2+1);
			buffer.write(DT.ucs2,0,1,'utf8');
			buffer.write(value,1, value.length*2,'ucs2');
		} else {
			throw 'unsupported encoding '+encoding;
		}		
		return fs.writeSync(handle,buffer,0,buffer.length,pos);
	}
	var writeStringArray = function(value,pos,encoding) {
		encoding=encoding||'ucs2';
		if (encoding==='utf8') {
			var buffer=new Buffer(DT.utf8arr+value.join('\0'),'utf8');
		} else if (encoding==='ucs2'){
			var v=value.join('\0');
			var buffer=new Buffer(v.length*2+1);
			buffer.write(DT.ucs2arr,0,1,'utf8');
			buffer.write(v,1, v.length*2,'ucs2');
		} else {
			throw 'unsupported encoding '+encoding;
		}
		return fs.writeSync(handle,buffer,0,buffer.length,pos);
	}
	var writeI32=function(value,pos) {
		var buffer=new Buffer(5);
		buffer.write(DT.int32,0,1);
		buffer.writeInt32BE(value,1);
		return fs.writeSync(handle,buffer,0,5,pos);
	}
	var writeUI8=function(value,pos) {
		var buffer=new Buffer(2);
		buffer.write(DT.uint8,0,1);
		buffer.writeUInt8(value,1);
		return fs.writeSync(handle,buffer,0,2,pos);
	}
	/* no signature */
	var writeFixedArray = function(value,pos,unitsize) {
		var items=new Buffer(unitsize* value.length);
		//console.log('v.len',value.length,items.length,unitsize);
		if (unitsize===1) var func=items.writeUInt8;
		else if (unitsize===4) var func=items.writeInt32BE;
		else throw 'unsupported integer size';
		
		for (var i = 0; i < value.length ; i++) {
			func.apply(items,[value[i],i*unitsize])
		}
		return fs.writeSync(handle,items,0,items.length,pos);
	}
	var free=function() {
		fs.fsync(handle, function() {
			fs.closeSync(handle);
		});
	}
	this.writeI32=writeI32;
	this.writeUI8=writeUI8;
	this.writeString=writeString;
	this.writeSignature=writeSignature;
	this.writeOffset=writeOffset; //5 bytes offset
	this.writeStringArray=writeStringArray;
	this.writeFixedArray=writeFixedArray;
	this.free=free;
	
	handle=fs.openSync(path,'w');
	return this;
}
module.exports=Create;