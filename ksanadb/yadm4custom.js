/*
  these functions will be part
*/
var dmversion=function() { return 0x20130618};

var getText=function(db,seq) {
	var slotperbatch=db.get(['meta','slotperbatch']);
	if (typeof seq=='number') {
		var batch=Math.floor(seq / slotperbatch);
		return db.get(['texts',batch, seq % slotperbatch]);
	} else {
		var r="";
		for (var i in seq) {
			var batch=Math.floor(seq[i] / slotperbatch);
			r+=db.get(['texts',batch, seq[i] % slotperbatch]);
		}
		return r;
	}
}	
var getTag=function(db,tagname,seq) {
	var slot= db.get(['tags',tagname,'slot',seq]);
	var offset= db.get(['tags',tagname,'offset',seq]);
	var head= db.get(['tags',tagname,'head',seq]);
	var r={};
	if (typeof slot!=='undefined') r.slot=slot;
	if (typeof offset!=='undefined') r.offset=offset;
	if (typeof head!=='undefined') r.head=head;
	return r;
}
var findTag=function(db,tagname,attributename,value) {
	var par=['tags',tagname,attributename+'='].concat(value.split('.'));
	return  db.get(par) ;
}
module.exports={
	dmversion:dmversion,
	getText:getText,
	getTag:getTag,
	findTag:findTag
	//getCrlf:getCrlf,
	//getCrlfByRange:getCrlfByRange,
	//findCrlf:findCrlf
}