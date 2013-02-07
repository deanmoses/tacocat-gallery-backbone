//
// Main application javascript file
//
// require.js loads this, and this determines everything else to load
//

require(
	[
		'jquery',
		'backbone'
	], 
	function($, Backbone) {
 
		var Router = Backbone.Router.extend({
			routes: {
				"": "main"
			},
			
			main: function(){
				alert("something happened");
			}
		});
	}
);