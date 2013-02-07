//
// BACKBONE ROUTING MODULE
//

define(function() {

    
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

	
	var initialize = function() {
		var app_router = new AppRouter;
		Backbone.history.start();	
	}
	
	return {
		initialize : initialize
	};
}






);