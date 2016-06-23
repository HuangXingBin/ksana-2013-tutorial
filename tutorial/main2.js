define(['jquery','underscore','backbone','fulltextview'],
function($,_,Backbone,Fulltextview){
 var DBNAME='daodejin';
 var Viewer=Backbone.View.extend({
	events : {
		"click #btntofind":"tofindclick",
		"keypress #tofind":"tofindenter",
		"click .destroy":"deletedefination",
		"click .candidate":"showtext"
	},
	showtext:function(e) {
		var btn=$(e.target);
		this.loadtext(btn.attr("n"));
	},
	deletedefination:function(e) {
		var btn=$(e.target);
		btn.parent().animate({	opacity: 0,height: '1px'}
					, 300, function(){$(this).remove()} ) ;
	},
	loadtext:function(n) {
		var that=this;
		this.rpc.getTextByTag( {db:DBNAME, tag:"chapter", ntag:n},
		function(err,data) {
			that.definations.add({wordhead: data.head, def:data.text});
		});
	},

	tofindenter:function(e) {
		if (e.keyCode==13) this.tofindclick();
	},
	tofindclick:function() {
		this.model.set({tofind:$("#tofind").val()});
	},
	newdefination:function(data) {
		var o={ wordhead: data.attributes["wordhead"], data: data.attributes["def"]}
		var ele=$(_.template( this.definationtemplate , o ));
		ele.css({'opacity':0});
		$("#definations").prepend(ele);
		ele.animate({opacity:1},500);
	},
	createsession:function() {
		var that=this;
		this.rpc.initialize(null,function(err,sessionid) {
			that.sessionid=sessionid;
			that.started=true;
			$("#btntofind").removeClass('disabled');
			that.fulltextview.rpc=that.rpc;
			that.render.call(that);
		});				
	},
	sessionalive:function() {
		return (new Date()-this.lastaccess < 5000) ;
	},
	heartbeat :function() {
		if (!this.sessionid) return;
		var opts={sessionid:this.sessionid};
		var that=this;
		this.rpc.heartbeat(opts,function(err,data) {
			if (data==-1) window.location.reload();
			that.lastaccess=new Date();
		});
	},		
	render:function() {
		$("#btntofind").css('visibility','visible');
	},
	initrpc:function() {
		var that=this;
		var rpcname=this.model.get("rpc");
		require([rpcname], function(w) {
			if (w) {
				that.rpc=w;
				setTimeout(function() {that.createsession()},200);
			}
		});
	},
	readtemplates:function() {
		this.definationtemplate=$("#definationtemplate").html();
	},
	initialize:function() {
		var that=this;
		this.started=false;
		setInterval(function() {that.heartbeat()},2000);
		setTimeout(function() {that.initrpc()},500);
		this.definations=new Backbone.Collection();
		this.definations.on("add",this.newdefination,this);
		this.readtemplates();
		//this.model.on("change:tofind",this.loaddefination,this);
		this.fulltextview=new Fulltextview({el:$(".ftcandidates"), model: this.model});
		this.fulltextview.dbname=DBNAME;
		$("#tofind").focus();

	}
	});
	return Viewer;
});
	