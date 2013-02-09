// This file follows the AMD module format, so that curl.js can load it
// Good article about modular JS:  http://addyosmani.com/writing-modular-js/
define(

	// modules I depend on
	[
		'jquery',
		'backbone',
		'handlebars',
		'modules/fn'
	],
	
	// This function defines the module
	// The modules I depend on are passed in as parameters  
	// If it REALLY followed the AMD module format, everything in here 
	// would be wrapped in an object and that object would be returned, 
	// that's what makes it a module
	function ($, Backbone, Handlebars, fn) {
	
	/**
	 * Flag as to whether the system should be run offline.
	 * Only for development.
	 */
	gallery.mock = false;
	
	/**
 	 * The base of the URL for all JSON calls
 	 */
	gallery.baseAjaxUrl = "http://tacocat.com/pictures/main.php?g2_view=";

	//
	// MODELS
	//
	
	/**
	 * All the information about the currently logged in user, if any.
	 */
	gallery.backbone.models.Authentication = Backbone.Model.extend({
	
		/**
		 * Called when a new instance of this model is created
		 */
		initialize : function() {
			// Ensure that the 'this' variable is pointing to myself 
			// in the specified methods in all contexts
      	_.bindAll(this, "isSiteAdmin");
		},
	
		/**
		 * Return the URL that Backbone uses to fetch the model data.
		 */
		url : function() {
			//console.log('models.Authentication.url() called');
			
			// if we 
			if (gallery.mock) {
				return "mock/authentication.json.txt";	
			}
			// else return real URL
			else {
				return gallery.baseAjaxUrl + "json.Auth";
			}
		},
		
		/**
		 * Return true if the current user is logged in.
		 *
		 * This will return false until the authentication
		 * model is actually fetched from the server.
		 */
		isAuthenticated : function() {
			return this.get("isAuthenticated") == true;
		},
		
		/**
		 * Return true if the current user is logged in
		 * and a site admin.
		 *
		 * This will return false until the authentication
		 * model is actually fetched from the server.
		 */
		isSiteAdmin : function() {
			return this.get("isSiteAdmin") == true;
		}
	});
	 
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
				return "mock/album.json.txt";	
			}
			// else it's a year album
			else {
				return "mock/album-year.json.txt";	
			}
		},
		
		initialize: function() {
        	_.bindAll(this, "getPhotoByPathComponent", "getNextPhoto", "getPrevPhoto");
        },
		
		/**
		 * Find a photo by it's pathComponent, like 'flowers.jpg'
		 */
		getPhotoByPathComponent : function(pathComponent) {
			//console.log("getPhotoByPathComponent("+pathComponent+"): model: ", jQuery.extend(true, {}, this));
		
			var photo = _.find(this.attributes.children, function(child){
				//console.log("album.getPhotoByPathComponent("+pathComponent+"): looking at child.pathComponent: " + child.pathComponent);
				return child.pathComponent == pathComponent;
			});
			
			return photo;
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
    	
    	/**
    	 * Retrieve an album model by full path, like '2010/01_31'.
    	 *
    	 * This is asynchronous -- you have to register a callback via
    	 *  .then(), .always(), .done() and .fail()
    	 */
    	fetchAlbum : function(path) {

			// build a jQuery Deferred object
			var deferred = $.Deferred();
			
			// look for album in my cache of albums
			var album = gallery.albumStore.albums[path];
			
			// if album is in cache...
			if (album) {
				console.log("albumStore.fetchAlbum(): album " + path + " is in cache");
				
				// resolve the deferred immediately with success
				deferred.resolve(album);
			}
			// else the album is not in cache...
			else {
				console.log("albumStore.fetchAlbum(): album " + path + " isn't on client, fetching");
				album = new gallery.backbone.models.Album({fullPath : path});
				album.fetch({
					success : function(model, response, options) {
						//console.log("Success fetching album " + path);
						
						// Figure out path to parent album
						// if there's a slash, then it's a sub album
						if (path.indexOf("/") >=0) {
							var pathParts = path.split("/");
							pathParts.pop();
							album.attributes.parentAlbumPath = pathParts.join("/");
							album.attributes.albumType = "week";
						}
						// else if the album path is not "", it's a year album
						else if (path.length > 0) {
							album.attributes.parentAlbumPath = "";
							album.attributes.albumType = "year";
						}
						// else this is the root album
						else {
							album.attributes.parentAlbumPath = null;
							album.attributes.albumType = "root";
						}
						
						// cache the album
						gallery.albumStore.albums[path] = album;
						
						// tell the deferred object to call all done() listeners
						deferred.resolve(album);						
					},
					error : function(model, xhr, options) {
						console.log("Error fetching album " + path);
						
						// tell the deferred object to call all .fail() listeners
						deferred.reject();
					}
				});
			}

			// return the jQuery Promise so that the callers can use .then(), .always(), .done() and .fail()
			return deferred.promise();
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
	        	//console.log("AlbumPage.render() model: ", this.model);
	        	
	        	// Blank the page
	        	this.$el.empty();
	        	
				// We render different types of albums differently
				var albumType = this.model.attributes.albumType;
				var headerTemplateId = "#" + albumType + "_album_header_template";
				
				// Generate the header HTML
	        	var headerTemplate = Handlebars.compile( $(headerTemplateId).html() );
	        	this.$el.html(headerTemplate(this.model.attributes));
	        	
	        	// Generate the thumnails HTML -- handled differently for different album types
	         var html = "";
	         	
	        	// A year album
	        	if (albumType == "year") {
		        	// Group the child week albums of the year album by month
		        	var months = _.groupBy(this.model.get("children"), function(child) {
		        		// create a new javascript Date object based on the timestamp
						// multiplied by 1000 so that the argument is in milliseconds, not seconds
		        		var date = new Date(child.creationTimestamp * 1000);
		        		var month = date.getMonth();
		        		return month;
		        	});
		        	
					// Template to render an entire month's worth of thumbs
		        	var thumbnailTemplate = Handlebars.compile( $('#thumbnail_month_template').html() );
		        	var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		        	
		        	// Render the months in reverse chronological order
		        	// month[0] = January
		        	for (var i=11; i >= 0; i--) {
		        		if (months[i]) {
			        		var month = {
			        			name : monthNames[i],
			        			albums : months[i]
			        		};
			        		console.log("Month: ", month);
			        		html += thumbnailTemplate(month);
		        		}
		        	}
	        	}
	        	// ... else it's a week album, or the root album
	        	else {
	         	var thumbnailTemplate = Handlebars.compile( $('#thumbnail_template').html() );
	        		_.each(this.model.get("children"), function(subItem) {
		        		//console.log("AlbumPage.render() thumbnail child: " + subItem.title);
			        	html += thumbnailTemplate(subItem);
		        	});
				}
				
	        	// Insert the thumbnail HTML into the DOM
	        	this.$("#thumbnails").html(html);

	     		return this;
        }
    });
    
    /**
     * Display an individual photo
     */
    gallery.backbone.views.PhotoPage = Backbone.View.extend({
    
    	initialize: function() {
        	_.bindAll(this, "render", "renderCaptionEdit", "renderCaptionEditReal", "handleCaptionSubmit", "handleCaptionCancel");
        	//this.listenTo(this.model, "change", this.render);
        },
	    
        render: function() {
        	this.$el.empty();
        	var template = Handlebars.compile( $('#photo_template').html() );
	        this.$el.html(template(this.model));
	        var captionEditButton = this.$el.find('.admin-controls .caption-button');
	        captionEditButton.click(this.renderCaptionEdit);
	        
	        gallery.imageUtil.resizeImage(
				// image
				'.container-table.photo-page .container-table-row.image .container-table-cell .container-inner img', 
				// container to fit image into
				'.container-table.photo-page .container-table-row.image .container-table-cell .container-inner'
			);
		
	        return this;
        },
        
        /**
         * Show the photo caption edit UI
         */
        renderCaptionEdit : function() {
        	var _this = this;
        	
        	// The edit UI requires the wysihtml5 rich text editor JS to be loaded
        	require(
				[
					'wysihtml5'
				], 
				function(wysihtml5) {
					_this.renderCaptionEditReal(wysihtml5);
				}
			);
	        
	        return this;
        },
        
        /**
         * Actually show the photo caption edit, after the WYSIWYG rich text editor has loaded.
         */
        renderCaptionEditReal : function(wysihtml5) {
	        var template = Handlebars.compile( $('#photo_caption_edit_template').html() );
	        var photoInfoArea = this.$el.find('#photo-info');
	        photoInfoArea.html(template(this.model));
	        photoInfoArea.find('.button.submit').click(this.handleCaptionSubmit);
	        photoInfoArea.find('.button.cancel').click(this.handleCaptionCancel);
	        
	        // create the rich text editor
			var editor = new wysihtml5.Editor(
				// id of textarea element
				"caption",
				{ 
					// id of toolbar element
					toolbar:      "wysihtml5-editor-toolbar", 
					
					// stylesheets to display inside the editor iframe
					stylesheets: ["http://yui.yahooapis.com/2.9.0/build/reset/reset-min.css", "assets/styles/css/editor/editor.css"],
					parserRules:  wysihtml5ParserRules // defined in parser rules set 
				}
			);
			
			// Hack I found online to sort of make the editor expand as you type
			editor.observe("load", function() {
				editor.composer.element.addEventListener("mouseover", function() {
					editor.composer.iframe.style.height = editor.composer.element.scrollHeight + "px";
				});
				editor.composer.element.addEventListener("keyup", function() {
					editor.composer.iframe.style.height = editor.composer.element.scrollHeight + "px";
				});
			});

			return this;
        },
        
        handleCaptionSubmit : function() {
        	var _this = this;
	        var title = this.$el.find('.caption-edit-controls input[name="title"]').val();
	        var description = this.$el.find('.caption-edit-controls textarea#caption').val();
	        
	        // Update the server if the new title / description is actually different
	        if (this.model.title != title || this.model.description != description) {
		        //console.log('Submitting new title: ' + title + ' and description: ' + description);
		        
		        // Send info to server
				$.post(
					"http://tacocat.com/pictures/main.php?g2_view=json.SaveCaption", 
					{ id: this.model.id, title: title, description: description }
				)
				// On success
				.done(function(data) { 
					// Update the title and description on our internal model
			        _this.model.title = title;
				    _this.model.description = description;
					
					// Show the regular photo UI instead of the edit UI
					_this.render();
				})
				// On error
				.fail(function(data) { 
					alert("error: " + data);
					console.log("Error saving caption", data);
				})
		    }
		    else {
			    console.log("caption / title haven't changed");
		    }
        },
        
        handleCaptionCancel : function() {
        	// Show the regular photo UI instead of the edit UI
	        this.render();
        }
    });
    
	//
	// AUTHENTICATION
	//
	
	/**
	 * Create the single Authentication model this app will use.
	 * There will only ever be one Authentication model created
	 * in the system. 
	 *
	 * Whenever this model changes (call fetch() to update it),
	 * it will insert or remove various classes from the <body> tag:
	 * <body class="authenticated is-site-admin">
	 */
	gallery.authentication = new gallery.backbone.models.Authentication({});
	gallery.authentication.fetch({
		success : function(model, response, options) {
			//console.log("gallery.authentication.fetch() - success.  model: ", model);
			
			if (model.isAuthenticated()) {
				$("body").addClass('authenticated');
			}
			else {
				$("body").removeClass('authenticated');
			}
			
			if (model.isSiteAdmin()) {
				$("body").addClass('is-site-admin');
			}
			else {
				$("body").removeClass('is-site-admin');
			}
		},
		error : function(model, xhr, options) {
			console.log("gallery.authentication.fetch() - error.  xhr: ", xhr);
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
		
		viewPhoto: function(path) {			
			var pathParts = path.split("/");
			var photoId = pathParts.pop();
			var albumPath = pathParts.join("/");
			
			//console.log("Router.viewPhoto() photo " + photoId + " in album " + albumPath);
			
			// fetch the album, either from cache or from server
			gallery.albumStore.fetchAlbum(albumPath)
				.fail(function() {
					alert("Couldn't find album " + albumPath);
				})
				.done(function(album) {
					//console.log("URL router viewPhoto() got album " + albumPath + " for photo " + photoId + ".  Album: " , album);
			
					var photo = album.getPhotoByPathComponent(photoId);
					if (!photo) throw "No photo with ID " + photoId;
					//console.log("URL router got photo " + photoId, photo);
					
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
				});
			
		},
		
		viewAlbum: function(path) {
			//console.log("Router.viewAlbum() for album " + path);
			
			// strip any trailing slash
			path = path.replace(/\/$/, "");
			
			// Regularize path by getting rid of any preceding or trailing slashes
			var pathParts = path.split("/");
			var albumPath = pathParts.join("/");

			// fetch the album, either from cache or from server
			gallery.albumStore.fetchAlbum(albumPath)
				.fail(function() {
					alert("Couldn't find album " + albumPath);
				})
				.done(function(album) {
					//console.log("URL router viewAlbum() got album " + albumPath + ".  Album: " , album);
			
					// render the album
					var view = new gallery.backbone.views.AlbumPage({
						model: album,
						el: $('#page')
					});
					
					view.render(); 
				});
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
	 
	 gallery.imageUtil = {
			resizeImageOnce : function(image, container) {
			
				 // get image width and height
			    var img_w = image.width();
			    var img_h = image.height();
			    
			    if (img_w <= 0 || img_h <= 0) return;
			    
			    // get container width and height
			    var container_w = container.width();
			    var container_h = container.height();
			    
			    if (container_w <=0 || container_h <=0) return;
				
				// calculate image height if we resized to 100% width
				var img_h_new = Math.round(container_w * (img_h / img_w));
				
				// if new image height fits within container, we've got our dimensions
				if (img_h_new <= container_h) {
					//console.log('width based.  container w: ' + container_w + ' > ' + container.parent().width() + ' > ' + container.parent().width());
					image.width(container_w);
					image.height(img_h_new);
				}
				// else if new image height is too tall for container, 
				// make image height 100% of container
				else {
					//console.log('height based');
					image.height(container_h);
					image.width(Math.round(container_h * (img_w / img_h)));
				}
				
				image.css('display', 'block');

			    // update header width to match image
			    //$('.header-container header').width(image.width());
			},
			
			resizeImage : function(imageExpression, containerExpression) {
				var image = $(imageExpression);
				var container = $(containerExpression);
				var _this = this;
				
				image.load(function(){ 
					//console.log('imageUtil.resizeImage(): img loaded'); 
					_this.resizeImageOnce(image, container); 
				});  // on initial image load (won't be called if it's already loaded)
				//$(function(){ _this.resizeImageOnce(image, container); });  // on initial page load
				$(window).resize(function() { _this.resizeImageOnce(image, container); });  // on window resize
			}
		}
});