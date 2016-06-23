if (typeof define !== 'function') {var define = require('amdefine')(module); } 
define(['./base64'],
  function (base64) {

	var add_block=function(s,id,blockcount) {
		var splitted=this.splitter(s);
		var tokens=splitted.tokens;
		if ( tokens.length > this.blocksize ) {
			console.log('blocksize too small');
			console.log( 'blocksize too small('+this.blocksize+') ,'+
			'increase meta.blockshift to exceed '+ tokens.length +
			'id='+id);
			return;
		}
		
		
		this.voff=blockcount * this.blocksize ; 
		for (var i=0;i<tokens.length;i++) {
			var t=tokens[i];
			if (splitted.skips[i]) continue;
			this.voff++; // voff start from 1, 0 denote the block itself
			if (!this.postings[t]) {
			  this.postings[t] = [this.voff];
			  this.postingcount++;
			} else {
			  this.postings[t].push(this.voff);
			}			
		}
	}
    var packint = function (ar, token) { // pack ar into
      if (!ar || ar.length === 0)
        return []; // empty array
      var r = [],
      i = 0,
      j = 0,
      delta = 0,
      prev = 0;
      
      do {
        delta = ar[i] - prev;
        if (delta < 0) {
          console.error("negative delta " + delta + " at token: " + token);
          break;
        }
        
        r[j++] = delta & 0x7f;
        delta >>= 7;
        while (delta > 0) {
          r[j++] = (delta & 0x7f) | 0x80;
          delta >>= 7;
        }
        prev = ar[i];
        i++;
      } while (i < ar.length);
      return r;
    }
    
    var packpostings = function (postings) {
		var packed={};
		
		for (var i in postings) {
			var p = base64.encode(packint(postings[i]));
			//console.log(i,p.length);
			packed[i]={d:p};
			delete postings[i];
		}
		return packed;
    }
	var finalize=function(status) {
		this.packed=packpostings(this.postings);
	}

	var create=function(opts) {
		var handle={};
		handle.blockshift=opts.blockshift || 16 ; //default blocksize 65536 
		if (handle.blockshift>16) {
			console.warn('max block size is 65535, reduce your blockshift setting');
			handle.blockshift=16;
		}
		handle.blocksize=2 << (handle.blockshift - 1);//Math.pow(2,handle.blockshift);
		handle.postings =  {};
		handle.postingcount =  0;
		handle.voff =  1;
		handle.add_block=add_block;
		handle.finalize=finalize;
		handle.splitter=opts.splitter;
		return handle;
	}
	var exports = {};
	exports.create=create;
	
	return exports;
});
 