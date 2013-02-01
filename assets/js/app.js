define(['modules/fn', 'modules/context-menu', 'modules/component'], function (fn, ContextMenu, Component) {
	
	//
	// MODELS
	//
	
	var Album = Backbone.Model.extend({
		
		url : function() {
			//console.log('album url() called');
			return "http://tacocat.com/pictures/main.php?g2_view=json.Album&album=" + this.id;
		},
		
		getPhotoByPathComponent : function(pathComponent) {
			return _.find(this.attributes.children, function(child){ 
				return child.pathComponent == pathComponent;
			});
		}
	});
	
	var Albums = Backbone.Collection.extend({
		model : Album
	});
	
	/**
	 * Store of all the albums
	 */
	gallery.app.models.albums = new Albums();
	
	//
	// VIEWS
	//

    gallery.backbone.views.Main = Backbone.View.extend({

        initialize: function() {
        	_.bindAll(this);
            this.listenTo(this.model, "change", this.render);
        },
        
        render: function() {
        	//console.log("Main render");
        	this.$el.empty();
        	var template = Handlebars.compile( $('#thumbnail_template').html() );
        	var _this = this;
        	_.each(this.model.get("children"), function(subItem) {
        		//console.log("child", subItem);
	        	_this.$el.append(template(subItem));
        	});

	        return this;
        }
    });
    
    gallery.backbone.views.Photo = Backbone.View.extend({
	    
        render: function() {
        	this.$el.empty();
        	var template = Handlebars.compile( $('#photo_template').html() );
	        this.$el.html(template(this.model));
	        return this;
        }
    });

    gallery.backbone.views.Sidebar = Backbone.View.extend({

        initialize: function() {

            var _this = this;

            _.bindAll(this);

            this.setElement($('#page-layout-sidebar'));

            // Vars
            this.components = new Backbone.Collection();
        }

    });
    
    var albumStore = Array();
    
    /**
     * ROUTING
     */
    var AppRouter = Backbone.Router.extend({

		routes: {
			"v/*path.html" : "viewPhoto",
			"v/*path" : "viewAlbum",
			"*path" : "notFound"
		},
		
		editPhoto: function(path) {
			console.log("URL wants to edit photo " + path);
		},
		
		viewPhoto: function(path) {
			console.log("URL wants to view photo " + path);
			
			var pathParts = path.split("/");
			var photoId = pathParts.pop();
			var albumPath = pathParts.join("/");
			
			console.log("URL wants to view photo " + photoId + " in album " + albumPath);
			
			var album = albumStore[albumPath];
			var photo = album.getPhotoByPathComponent(photoId);
			console.log("Got album for photo", album);
			console.log("Got photo", photo);
			
			var view = new gallery.backbone.views.Photo({
				model : photo,
				el: $('#albums')
			});
			view.render();
		},
		
		editAlbum: function(path) {
			console.log("URL wants to edit album " + path);
		},
		
		viewAlbum: function(path) {
			// strip any trailing slash
			path = path.replace(/\/$/, "");
			//console.log("URL wants to view album " + path);
			//var album = gallery.app.models.albums.get(path);
			var album = albumStore[path];
			if (!album) {
				console.log("album " + path + " isn't on client, fetching");
				album = new Album({id : path});
				album.fetch();
				//gallery.app.models.albums.update([album]);
				albumStore[path] = album;
			}
			//console.log("retrieved album", album);

			var view = new gallery.backbone.views.Main({
				model: album,
				el: $('#albums')
			});
			view.render();

		},
		
		notFound: function(path) {
			console.log("Unknown path: " + path);
		}
		
	});
    
    new AppRouter();
    Backbone.history.start();
    
    
    $(".header h1").click(function() {
    	Backbone.history.navigate("v/", true)
	});
});