define(['underscore','backbone'],
	function(_,Backbone) {
	 var FullTextView=Backbone.View.extend({
	 	loadText:function(data) {
	 		var tofind=this.model.get('tofind');
	 		var that=this;
	 		$(".ftcandidates").html('');
	 		if (this.grouptag) {
		 		var slots=Object.keys(data);
		 		this.rpc.closestTag({db:this.dbname,tag:this.grouptag,slots:slots},function(err,tags) {
		 			var j=0;
			 		for (var i in data) {
		 				var d={head:tags[j].head,nslot:i,ntag:tags[j].ntag,exp:data[i]};
	 					$(".ftcandidates").append(_.template(that.fulltexttemplate, d).trim());
	 					j++;
			 		}	 			
		 		});
	 		} else {
		 		for (var i in data) {
	 				var d={nslot:i,exp:data[i]};
 					$(".ftcandidates").append(_.template(that.fulltexttemplate, d).trim());
		 		}		
		 	}
	 	},
	 	search:function(m) {
	 		var that=this;
	 		var tofind=m.get('tofind');
			this.rpc.phraseSearch( {db:this.dbname, tofind:tofind, showtext:true},
			function(err,data) {
				that.loadText(data);
			});
	 	},
	 	render:function() {
	 		var candidates=this.model.get("ftcandidates");
	 		var tofind=this.model.get("tofind");
	 	},
	 	initialize:function() {
	 		this.fulltexttemplate=$("#fulltexttemplate").html();
	 		this.model.on('change:tofind',this.search,this)
	 		this.model.on('change:ftcandidates',this.render,this)
	 	}
	 });
	return FullTextView;
});