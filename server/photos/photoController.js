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
      userId: mongoose.mongo.ObjectID(req.body.userId),
      userIdString: req.body.userId
    })
    .save()
    .then(function(data) {
      Photo.ensureIndexes({ loc: '2dsphere' });
      res.json();
    }).catch(function(err) {
      console.error('could not save to db', err.message);
    });
  },
  
  getPhotosInRange: function(maxRadius, lat, lon, userObj) {
    maxRadius = Number(maxRadius);
    var coords = [lon, lat];

    //Find where location is within radius AND the user has access to the photo
    return Photo.find(filterVisibleUserPicturesInVicinity(coords, maxRadius, userObj));
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

    return User.findOne({_id: req.query.userId}, '_id username friendIdsString')
    .then(user => module.exports.getAllUserPhotosInArea(lat, lon, latdelta, londelta, radius, user))
    .then(data => {
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
    
    return User.findOne({_id: req.query.userId}, '_id username')
    .then(user => module.exports.getPhotosInRange(maxDistance, req.query.lat, req.query.lon, user))
    .then(data => res.json(data));
  }
};

var filterUserPicturesInRectangularRegion = function(coords, user) {
  var x = {
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
      filterPhotosUserHasAccessTo(user)
    ]  
  };

  return x;
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
      filterPhotosUserHasAccessTo(user)
    ]
  };
};

var filterPhotosUserHasAccessTo = function(user) {
  return {
    $or: [
          {visibility: 2},
          {$and: [{visibility: 0}, {userId: user.id}]},
          {$and: [{visibility: 1}, {userIdString: {$in: user.friendIdsString}}]}
    ]
  };
};
