define(['modules/fn'], function (fn) {
	
	//
	// MODELS
	//
	 
	/**
	 * Represents an album.
	 *
	 * Includes all data about child photos.
	 * Includes child albums, but not the child album's photos.
	 */
	gallery.backbone.models.Album = Backbone.Model.extend({
	
		idAttribute: 'fullPath',
    
		url : function() {
			//console.log('album url() called');
			
			var mock = false;
			// if not mock, return real URL
			if (!mock) {
				return "http://tacocat.com/pictures/main.php?g2_view=json.Album&album=" + this.id;
			}
			// else if it's a sub album with photos
			else if (this.id.indexOf("/") >= 0) {
				return "file:///Users/dmoses/Sites/p/mock/album.json.txt";	
			}
			// else it's a year album
			else {
				return "file:///Users/dmoses/Sites/p/mock/album-year.json.txt";	
			}
		},
		
		getPhotoByPathComponent : function(pathComponent) {
			console.log("getPhotoByPathComponent("+pathComponent+")");
			return _.find(this.attributes.children, function(child){
				console.log("album.getPhotoByPathComponent("+pathComponent+"): looking at child.pathComponent: " + child.pathComponent);
				return child.pathComponent == pathComponent;
			});
		},
		
		getNextPhoto : function(pathComponent) {
			//console.log("album.getNextPhoto("+pathComponent+")");
			var foundCurrentPhoto = false;
			return _.find(this.attributes.children, function(child) {
				//console.log("album.getNextPhoto("+pathComponent+"): looking at child.pathComponent: " + child.pathComponent);
				if (foundCurrentPhoto) {
					//console.log("album.getNextPhoto("+pathComponent+"): " + child.pathComponent + " is the next photo!");
					return true;
				}
				else if (child.pathComponent == pathComponent) {
					foundCurrentPhoto = true;
				}
			});
		},
		
		getPrevPhoto : function(pathComponent) {
			var prevPhoto;
			_.find(this.attributes.children, function(child) {
				if (child.pathComponent == pathComponent) {
					return true;
				}
				prevPhoto = child;
			});
			
			return prevPhoto;
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
	 * Display an album page
	 */
    gallery.backbone.views.AlbumPage = Backbone.View.extend({

        initialize: function() {
        	_.bindAll(this, "render");
            this.listenTo(this.model, "change", this.render);
        },
        
        render: function() {
        	//console.log("Main render");
        	
        	// Blank the page
        	this.$el.empty();
        		
        	// Generate the album header HTML
        	// We use a different template for different types of albums
        	var headerTemplateId;
        	if (this.model.attributes.albumType == "root") {
	        	headerTemplateId = "#root_album_header_template";
        	}
        	else if (this.model.attributes.albumType == "year") {
	        	headerTemplateId = "#year_album_header_template";
        	}
        	else {
	        	headerTemplateId = "#week_album_header_template";
        	}
        	var headerTemplate = Handlebars.compile( $(headerTemplateId).html() );
        	this.$el.html(headerTemplate(this.model.attributes));
        	
            // Generate the thumnails HTML
        	var html = "";
        	var thumbnailTemplate = Handlebars.compile( $('#thumbnail_template').html() );
        	_.each(this.model.get("children"), function(subItem) {
        		//console.log("child", subItem);
	        	html += thumbnailTemplate(subItem);
        	});	
        	this.$("#thumbnails").html(html);

	        return this;
        }
    });
    
    /**
     * Display an individual photo
     */
    gallery.backbone.views.PhotoPage = Backbone.View.extend({
    
    	initialize: function() {
        	_.bindAll(this, "render", "renderCaptionEdit");
        },
	    
        render: function() {
        	this.$el.empty();
        	var template = Handlebars.compile( $('#photo_template').html() );
	        this.$el.html(template(this.model));
	        var captionEditButton = this.$el.find('.admin-controls .caption-button');
	        captionEditButton.click(this.renderCaptionEdit);
	        return this;
        },
        
        renderCaptionEdit : function() {
	        var template = Handlebars.compile( $('#photo_caption_edit_template').html() );
	        var photoInfoArea = this.$el.find('.photo-info');
	        photoInfoArea.html(template(this.model));
	        var submitButton = photoInfoArea.find('.caption-edit-controls button');
	        submitButton.click(this.handleCaptionSubmit);
	        return this;
        },
        
        handleCaptionSubmit : function() {
	        alert('I should really submit');
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
			if (!photo) throw "No photo with ID " + photoId;
			console.log("URL router got photo " + photoId, photo);
			
			// set the photo's album on the photo so the view can use that info
			photo.album = album.attributes;
			photo.nextPhoto = album.getNextPhoto(photoId);
			photo.prevPhoto = album.getPrevPhoto(photoId);
			photo.orientation = (photo.height > photo.width) ? "portrait" : "landscape";
			var view = new gallery.backbone.views.PhotoPage({
				model : photo,
				el: $('#page')
			});
			view.render();
		},
		
		editAlbum: function(path) {
			console.log("URL wants to edit album " + path);
		},
		
		viewAlbum: function(path) {
			//console.log("Router.viewAlbum() for album " + path);
			
			// strip any trailing slash
			path = path.replace(/\/$/, "");
			
			// Regularize path by getting rid of any preceding or trailing slashes
			var pathParts = path.split("/");
			var albumPath = pathParts.join("/");
			
			var album = gallery.albumStore.getAlbum(path);
			if (!album) throw "No photo with ID " + photoId;
			
			// Figure out path to parent album
			// if there's a slash, then it's a sub album
			if (albumPath.indexOf("/") >=0) {
				pathParts.pop();
				album.attributes.parentAlbumPath = pathParts.join("/");
				album.attributes.albumType = "week";
			}
			// else if the album path is not "", it's a year album
			else if (albumPath.length > 0) {
				album.attributes.parentAlbumPath = "";
				album.attributes.albumType = "year";
			}
			// else this is the root album
			else {
				album.attributes.parentAlbumPath = null;
				album.attributes.albumType = "root";
			}
			
			// render the album
			var view = new gallery.backbone.views.AlbumPage({
				model: album,
				el: $('#page')
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
    
    Handlebars.registerHelper("addSome", function(num) {
		return num + 2;
	});
});