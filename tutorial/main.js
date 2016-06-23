define(['jquery','underscore','backbone','fulltextview'],
function($,_,Backbone,Fulltextview){
 
 var Viewer=Backbone.View.extend({
	events : {
		"click #btntofind":"tofindclick",
		"keypress #tofind":"tofindenter",
	},
	tofindenter:function(e) {
		if (e.keyCode==13) this.tofindclick();
	},
	tofindclick:function() {
		this.model.set({tofind:$("#tofind").val()});
	},
	createsession:function() {
		var that=this;
		this.rpc.initialize(null,function(err,sessionid) {
			that.sessionid=sessionid;
			that.started=true;
			$("#btntofind").removeClass('disabled');
			that.fulltextview.rpc=that.rpc;
			that.fulltextview.grouptag=$("#settings").attr('grouptag');
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
	initialize:function() {
		var that=this;
		this.started=false;
		setInterval(function() {that.heartbeat()},2000);
		setTimeout(function() {that.initrpc()},500);
		this.definations=new Backbone.Collection();
		this.definations.on("add",this.newdefination,this);
		this.definationtemplate=$("#definationtemplate").html();
		this.fulltextview=new Fulltextview({el:$(".ftcandidates"), model: this.model});
		this.fulltextview.dbname=$("#settings").attr('dbname');
		$("#tofind").focus();
	}
});
return Viewer;
});
	