define(['jquery','backbone','main'],
function($,Backbone,Viewer){
  var view=null;
  var m=new Backbone.Model();
  var AppRouter = Backbone.Router.extend({
    routes: {
      '*actions': 'defaultAction'
    },
    defaultAction: function(actions){
	if (view) return;
	m.set({rpc:"../ksanadb/rpc_yadm4"});
		view=new Viewer({el:$(".mainview"), model: m});
	}
  });
  
  var initialize = function(){
	var app_router = new AppRouter();
	Backbone.history.start();
  };
   return {
    initialize: initialize
  };
});
  


