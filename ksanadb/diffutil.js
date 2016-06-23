if (typeof define !== 'function') {  var define = require('amdefine')(module); } //for node.js

define(['./diff'],function(Diff) {
	var groupdiff=function(d) {
		var i=0;
		var out=[];
		var offset=0;
		while (i<d.length) {
			if (d[i][0]==0) {
				offset+=d[i][1].length;
				i++;
				continue;
			}
			if (d[i][0]==-1 && (i+1)<d.length && d[i+1][0]==1) { //modify
				out.push( [offset,'"'+d[i][1]+'">>"'+d[i+1][1]+'"']);
				offset+=d[i][1].length;
				i++;
			} else if (d[i][0]==1) { //insert
				out.push( [offset,'"">>"'+d[i][1]+'"']);
			} else if (d[i][0]==-1) { //delete
				out.push( [offset,'"'+d[i][1]+'">>""'] );
				offset+=d[i][1].length;
			}				
			i++;
		}
		return out;
	}
	var diff=function(from,to) {
		var dmp=new Diff();
		return dmp.diff_main( from,to);
	}
	var group=function(from,to) {
		var df=diff(from,to)
		return groupdiff(df);
	}
	var diffutil={};
	diffutil.group=group;
	diffutil.diff=diff;
	return diffutil;
});