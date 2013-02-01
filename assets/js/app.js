define(['modules/fn'], function (fn) {
	
	//
	// MODELS
	//
	
	/**
	 * Represents a photo.
	 */
	gallery.backbone.models.Photo = Backbone.Model.extend({
	
	
	});
	 
	/**
	 * Represents an album.
	 *
	 * Includes all data about child photos.
	 * Includes child albums, but not the child album's photos.
	 */
	gallery.backbone.models.Album = Backbone.Model.extend({
	
		idAttribute: 'fullPath',
		
/*
		relations: [{
	        type: Backbone.HasMany,
	        key: 'children',
	        relatedModel: 'gallery.backbone.models.Photo',
	        reverseRelation: {
	            key: 'thread',
	            includeInJSON: '_id',
	        },
	    }],
*/
    
		url : function() {
			//console.log('album url() called');
			return "http://tacocat.com/pictures/main.php?g2_view=json.Album&album=" + this.id;
		},
		
		getPhotoByPathComponent : function(pathComponent) {
			console.log("getPhotoByPathComponent("+pathComponent+")");
			return _.find(this.attributes.children, function(child){
				console.log("getPhotoByPathComponent("+pathComponent+"): looking at child.pathComponent: " + child.pathComponent);
				return child.pathComponent == pathComponent;
			});
		}
	});
	
	/**
	 * TODO:  This SHOULD be a store of all the albums that have been 
	 * downloaded, but it wasn't storing new models correctly.
	 * 
	 * So this isn't being used yet.
	 */
/*
	var Albums = Backbone.Collection.extend({
		model : Album
	});
	gallery.app.models.albums = new Albums();
*/
	
	/**
     * Store of albums.
     *
     * TODO:  I thought this would be simply a Collection,
     * but the Collection isn't downloading and saving
     * albums like I thought it would.
     */
    gallery.albumStore = {
    	// hash of albumPath, like '2010/01_31' to album Model
    	albums : [],
    	
    	// retrieve an album model by full path, like '2010/01_31'
    	getAlbum : function(path) {
	    	//var album = gallery.app.models.albums.get(path);
			var album = this.albums[path];
			if (!album) {
				console.log("album " + path + " isn't on client, fetching");
				album = new gallery.backbone.models.Album({fullPath : path});
				album.fetch();
				//gallery.app.models.albums.update([album]);
				this.albums[path] = album;
			}
			console.log("retrieved album " + path, album);
			return album;
    	}
    };
    
	//
	// VIEWS
	//

	/**
	 * Display an album
	 */
    gallery.backbone.views.Album = Backbone.View.extend({

        initialize: function() {
        	_.bindAll(this);
            this.listenTo(this.model, "change", this.render);
        },
        
        render: function() {
        	//console.log("Main render");
        	this.$el.empty();
        	var template = Handlebars.compile( $('#thumbnail_template').html() );
        	var html = "";
        	_.each(this.model.get("children"), function(subItem) {
        		//console.log("child", subItem);
	        	html += template(subItem);
        	});
        	
        	this.$el.html(html);

	        return this;
        }
    });
    
    /**
     * Display an individual photo
     */
    gallery.backbone.views.Photo = Backbone.View.extend({
	    
        render: function() {
        	this.$el.empty();
        	var template = Handlebars.compile( $('#photo_template').html() );
	        this.$el.html(template(this.model));
	        return this;
        }
    });
    
    //
    // ROUTING
    //
    
    gallery.backbone.Router = Backbone.Router.extend({

		routes: {
			"v/*path.html" : "viewPhoto",
			"v/*path" : "viewAlbum",
			"*path" : "notFound"
		},
		
		editPhoto: function(path) {
			console.log("URL wants to edit photo " + path);
		},
		
		viewPhoto: function(path) {			
			var pathParts = path.split("/");
			var photoId = pathParts.pop();
			var albumPath = pathParts.join("/");
			
			console.log("URL router viewPhoto() photo " + photoId + " in album " + albumPath);
			
			var album = gallery.albumStore.getAlbum(albumPath);
			console.log("URL router got album " + albumPath + " for photo " + photoId, album);
			
			var photo = album.getPhotoByPathComponent(photoId);
			console.log("URL router got photo " + photoId, photo);
			if (!photo) throw "No photo with ID " + photoId;
			
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
			var album = gallery.albumStore.getAlbum(path);
			
			var view = new gallery.backbone.views.Album({
				model: album,
				el: $('#albums')
			});
			view.render();

		},
		
		notFound: function(path) {
			// retrieve the root album
			this.viewAlbum("");
		}
		
	});
    
    new gallery.backbone.Router();
    Backbone.history.start();
    
    
    $(".header h1").click(function() {
    	Backbone.history.navigate("v/", true)
	});
});