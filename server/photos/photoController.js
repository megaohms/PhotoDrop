var imgur = require('imgur');
var mongoose = require('mongoose');

var Photo = require('./photoModel');
var User = require('../users/userModel');

module.exports = {
  // recieve base64 bit image in two POST request packets
  // send that file to imgur
  uploadPhoto: function(req, res, next) {
    imgur.uploadBase64(req.body.imageData)
      .then(function(json) {
        req.imgurLink = json.data.link;
        next();
      })
      .catch(function(err) {
        console.error(err.message);
      });
  },

  // save that photo as  a model in db
  savePhotoModelToDB: function(req, res, next) {
    new Photo({
      url: req.imgurLink,
      loc: {
        type: 'Point',
        coordinates: [req.body.longitude, req.body.latitude]
      },
      visibility: req.body.visibility,
      userId: mongoose.mongo.ObjectID(req.body.userId)
    })
    .save()
    .then(function(data) {
      Photo.ensureIndexes({ loc: '2dsphere' });
      res.json();
    }).catch(function(err) {
      console.error('could not save to db', err.message);
    });
  },
  
  getPhotosInRange: function(maxRadius, lat, lon, userId) {
    maxRadius = Number(maxRadius);
    var coords = [lon, lat];

    //TODO - use real user
    var user = {};
    user.id = '56d5efa4c13476226210daa1';
    user.friends = ['56d77a3f953a6d9746d13115'];
    //Find where location is within radius AND the user has access to the photo
    return Photo.find(filterVisibleUserPicturesInVicinity(coords, maxRadius, user));
  },

  /**
   * Grabs all files that the given user has access to in the area provided (rectangular area)
   */
  getAllUserPhotosInArea: function(lat, lon, latdelta, londelta, maxRadius, userObj) {
    var coords = [
      [
        [lon - londelta, lat + latdelta],
        [lon + londelta, lat + latdelta],
        [lon + londelta, lat - latdelta],
        [lon - londelta, lat - latdelta],
        [lon - londelta, lat + latdelta]
      ]
    ];
    maxRadius = maxRadius || 0;
    
    return module.exports.getPhotosInRange(maxRadius, lat, lon, userObj)
      .then(visiblePhotos => {
        console.log(visiblePhotos);
        return Photo.collection.aggregate([
          { $match: filterUserPicturesInRectangularRegion(coords, userObj) },
          { $project:
            {
              url: 1,
              views: 1,
              visibility: 1,
              userId: 1,
              loc: 1,
              photoIsVisible: 
                {
                  $cond: { if: {$setIsSubset: [["$_id"], visiblePhotos.map(p => p._id)]}
                    , then: 1, else: 0 }
                }
            }
         }
        ])
      })
      //aggregate returns a mongo cursor - toArray converts it to the actual result set
      .then(aggCursor => aggCursor.toArray());
  },
  
  fetchLocations: function(req, res, next) {
    var lat = Number(req.query.lat);
    var lon = Number(req.query.lon);
    var latdelta = Number(req.query.latdelta);
    var londelta = Number(req.query.londelta);
    var radius = Number(req.query.radius) || 50;
    //TODO - grab User and friends.  We'll spoof them for now
    var user = {};
    user.friends = ['56d77a3f953a6d9746d13115'];
    user.id = '56d5efa4c13476226210daa1';
    
    //Hardcoding maxRadius=50
    module.exports.getAllUserPhotosInArea(lat, lon, latdelta, londelta, radius, user)
    .then(data => {
      //TODO - make radius 50 below not hardcoded
      res.json(data);
    });
  },

  fetchUserPhotos: function(req, res, next) {
    Photo.find({ userId: mongoose.mongo.ObjectID(req.query.userId) }, function(err, photos) {
      if (err) {
        next(err);
      }
      res.json(photos);
    });
  },

  incrementViews: function(req, res, next) {
    Photo.findOne({ url: req.query.url }, function(err, photo) {
      if (err) {
        next(err);
      }
      if (!photo) {
        return next(new Error('Link not added yet'));
      }
      photo.views++;
      photo.save(function(err, savedPhoto) {
        if (err) {
          next(err);
        }
        res.json({views: savedPhoto.views});
      });
    });
  },
  
  fetchPhotos: function(req, res, next) {
    var maxDistance = Number(req.query.radius);
    var coords = [req.query.lon, req.query.lat];

    Photo.find({
      loc: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coords
          },
          $maxDistance: maxDistance
        }
      }
    }, function(err, photos) {
      if (err) {
        next(err);
      }
      if (photos) { 
        photos = photos.sort(function(a, b) {
          return b.views - a.views;
        });
      }
      res.json(photos);
    });
  }
};

var filterUserPicturesInRectangularRegion = function(coords, user) {
  return {
    $and: [
      {
        loc: {
          $geoWithin: {
            $geometry: {
              type: 'Polygon',
              coordinates: coords
            }
          }
        }
      }, 
      {$or: [
        {visibility: 2},
        {$and: [{visibility: 0}, {userId: user.id}]}, // <--the current User object ID
        {$and: [{visibility: 1}, {userId: {$in: user.friends}}]}// <--Array of object IDs of current user's friends
      ]}
    ]  
  };
};

var filterVisibleUserPicturesInVicinity = function(coords, maxRadius, user) {
  return {
    $and: [
      {
        loc: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: coords
            },
            $maxDistance: maxRadius
          }
        }
      }, 
      {$or: [
        {visibility: 2},
        {$and: [{visibility: 0}, {userId: user.id}]},// <--the current User object ID
        {$and: [{visibility: 1}, {userId: {$in: user.friends}}]}// <--Array of object IDs of current user's friends
      ]}
    ]
  }
};
  // db.getCollection('photos').find({$or: [
  //   {visibility: 2},
  //   {$and: [{visibility: 0}, {userId: ObjectId("56d5efa4c13476226210daa1")}]}, <--the current User object ID
  //   {$and: [{visibility: 1}, {userId: {$in: [ObjectId("56d77a3f953a6d9746d13115")]}}]} <--Array of object IDs of current user's friends
  //   ]})
  // fetch all photos from DB