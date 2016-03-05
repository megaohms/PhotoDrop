var Q = require('q');
var User = require('./userModel');
var jwt = require('jsonwebtoken');
var mongoose = require('mongoose');
var Photo = require('./../photos/photoModel');

var findUser = Q.nbind(User.findOne, User);
var findUsers = Q.nbind(User.find, User);
var createUser = Q.nbind(User.create, User);

module.exports = {
  login: function(req, res, next) {
    var user = JSON.parse(Object.keys(req.body)[0]);
    var username = user.username;
    var password = user.password;

    findUser({ username: username })
      .then(function(user) {
        if (!user) {
          next(new Error('User does not exist'));
        } else {
          return user.comparePasswords(password)
            .then(function(foundUser) {
              if (foundUser) {
                var token = jwt.sign({ username: username, userId: user._id }, 'FRANKJOEVANMAX');
                res.json({ userId: user._id, token: token });
              } else {
                return next(new Error('Incorrect password'));
              }
            });
        }
      })
      .fail(function(error) {
        next(error);
      });
  },

  signup: function(req, res, next) {
    var user = JSON.parse(Object.keys(req.body)[0]);
    var username = user.username;
    var password = user.password;

    findUser({ username: username })
      .then(function(user) {
        if (user) {
          next(new Error('User already exist!'));
        } else {
          return createUser({
            username: username,
            password: password
          }).then(function(user) {
            console.log('Created user', user)
              // Generate JWT for user here
              // params: payload, secret key, encryption, callback
            var token = jwt.sign({ username: user.username, userId: user._id }, 'FRANKJOEVANMAX');
            console.log('token created', token)
            res.json({ token: token, userId: user._id, username: user.username })
            next()
          }).catch(function(err) {
            console.error('problem creating user', err);
          });
        }
      })
      .fail(function(error) {
        next(error);
      });
  },

  checkJWT: function(req, res, next) {
    console.log('imcomming GET for JWT', req.params.JWT)
    var decoded = jwt.verify(req.params.JWT, 'FRANKJOEVANMAX', function(err, decoded) {
      if (err) console.log('problem decoding', err);
      else {
        // send back decoded.userId and decoded.username
        res.json({ username: decoded.username, userId: decoded.userId });
        next();
      }
    });
    // send back user id
  },

  changePassword: function(req, res, next) {
    var user = JSON.parse(Object.keys(req.body)[0]);
    var username = user.username;
    var password = user.password;
    var newPassword = user.newPassword;

    findUser({ username: username })
      .then(function(user) {
        if (!user) {
          next(new Error('User does not exist!'));
        } else {
          return user.comparePasswords(password)
            .then(function(foundUser) {
              user.password = newPassword;
              user.save(function(err, savedUser) {
                if (err) next(err);
                res.json();
              })
            }).catch(function(err) {
              console.error('problem changing user info', err);
            });
        }
      })
      .fail(function(error) {
        next(error);
      });
  },

  changeUsername: function(req, res, next) {
    var user = JSON.parse(Object.keys(req.body)[0]);
    var username = user.username;
    var newUsername = user.newUsername;

    findUser({ username: username })
      .then(function(user) {
        if (!user) {
          next(new Error('User does not exist!'));
        } else {
          user.username = newUsername;
          user.save(function(err, savedUser) {
            if (err) next(err);
            res.json({ username: savedUser.username });
          })
        }
      })
      .fail(function(error) {
        next(error);
      });
  },

  toggleFavorite: function(req, res, next) {
    var url = req.query.url;
    User.findOne({ _id: mongoose.mongo.ObjectID(req.query.userId) }, function(err, user) {
      if (err) next(err);
      if (!user) {
        console.error('User was not found');
      } else {
        if (user.favorites.indexOf(url) === -1) {
          user.favorites.push(url);
        } else {
          user.favorites.splice(user.favorites.indexOf(url), 1);
        }
        user.save(function(err, savedUser) {
          res.json();
        });
      }
    });
  },

  toggleStream: function(req, res, next) {
    var url = req.query.url;
    Photo.findOne({url: url})
      .then((photo) => {
        console.log('found Photo object; photo: ', photo);
        User.findOne({ _id: photo.userId})
          .then((foundUser) => {
          // if adding to stream
            if(foundUser.streams.indexOf(url) === -1) {
              console.log('foundUser has streams but not photo');
              foundUser.streams.push(photo.url);
              foundUser.streamsObjects.push(photo._id);
              foundUser.save((err, savedUser) => {
                console.log('foundUser has updated streams and streamsObject props');
                if (err) {
                  next(err);
                }
                res.send(savedUser);
              });
            } else {
              foundUser.streams.splice(foundUser.streams.indexOf(photo.url), 1);
              foundUser.streamsObjects.splice(foundUser.streamsObjects.indexOf(photo._id), 1);
              foundUser.save((err, savedUser) => {
                if (err) {
                  next(err);
                }
                res.send(savedUser);
              });
            }
          })
          .catch((err) => {
            console.log('error finding user', err);
          });
/*        if(){
          //push photo id to photo object
          User.findOneAndUpdate(
            { _id: mongoose.mongo.ObjectID(req.query.userId)}, // conditions of find/search
            { streams: streams.push(photo.url),                // properties to update
              streamsObject: streamsObject.push(photo._id)
            },
            { new: true,                     // options object, will return updated object
            },
            (err, newObj) => {                                 // callback for executing on new object
              if (err) {
                next(err);
              }
              console.log('saved photo_id on userModel; doubleSavedUser: ', doubleSavedUser);
              res.json(doubleSavedUser);
              
            }
          );
        } else {       
        // untoggle from streams/streamsObject
          User.findOneAndUpdate(
            { _id: mongoose.mongo.ObjectID(req.query.userId)},              // conditions of find/search
            { streams: streams.splice(user.streams.indexOf(photo.url), 1),  // properties to update
              streamsObject: streamsObject.splice(savedUser.streamsObject.indexOf(photo._id), 1),
            },
            { new: true,                                  // options object, will return
              upsert: true                                                  // updated object, creates new object if doesn't exist
            },
            (err, savedUser) => {                                           // callback for executing on new object
              if (err) {
                next(err);
              }
              console.log('saved photo_id on userModel; doubleSavedUser: ', savedUser);
              res.json(savedUser);
            }
          );
        }
      user.streamsObject.push(photo._id);
          user.save((err, doubleSavedUser) => {
            console.log('saved photo_id on userModel; doubleSavedUser: ', doubleSavedUser);
            res.json(doubleSavedUser);
          })
          .catch((err) => {
            console.log('error saving photo_id on userModel', err);
            next(err);
          }); 
*/
      }
    )
    .catch( (err) => {
      console.log('error finding photo', err);
    });
/*    // .catch((err) => {
      //   console.log('error finding photo; photo: ', err);
      //   next(err);
      // });
    User.findOne({ _id: mongoose.mongo.ObjectID(req.query.userId) })
      .then((user) => {
        console.log('found user; user: ', user);
        //push url to user streams
        if (user.streams.indexOf(url) === -1) {
          console.log('push url to userStreams array; url: ', url);
          //add url to streams array in userModel object
          user.streams.push(url);
          user.save((err, savedUser) => {
            var user = savedUser
            console.log('saved url to userStreams array; savedUser: ', savedUser);
            Photo.findOne({url: url})
            .then((photo) => {
              console.log('found Photo object; photo: ', photo);
              //push photo id to photo object
              //error: cannot read property 'push' of undefined
              user.streamsObject.push(photo._id);
              user.save((err, doubleSavedUser) => {
                console.log('saved photo_id on userModel; doubleSavedUser: ', doubleSavedUser);
                res.json(doubleSavedUser);
              })
              .catch((err) => {
                console.log('error saving photo_id on userModel', err);
                next(err);
              });  
            })
            .catch((err) => {
              console.log('error finding photo; photo: ', err);
              next(err);
            });
          })
          .catch((err) => {
            console.log('error saving userStreams url', err);
            next(err);
          });
        } else {
          user.streams.splice(user.streams.indexOf(url), 1);
          user.save((err, savedUser) => {
            Photo.findOne({url: url})
            .then((photo) => {
              //splice photo id to photo object
              savedUser.streamsObject.splice(savedUser.streamsObject.indexOf(photo._id), 1);
              savedUser.save((err, doubleSavedUser) => {
                res.json(doubleSavedUser);
              })
              .catch((err) => {
                next(err);
              });  
            })
            .catch((err) => {
              next(err);
            });
          });
        }
      })
      .catch((err) => {
        if (err) {
          next(err);
        }
        if (!user) {
          console.error('User was not found');
        }
      });
*/
  },

  getPhotoData: function(req, res, next) {
    var currentUserId = req.query.userId;
    Photo.findOne({ url: req.query.url }, function(err, photo) {
      if (err) next(err);
      if (photo) {
        User.findOne({ _id: mongoose.mongo.ObjectID(photo.userId) }, function(err, user) {
          if (err) next(err);
          if (!user) {
            console.error('User was not found');
          } else {
            User.findOne({ _id: mongoose.mongo.ObjectID(currentUserId) }, function(err, user) {
              if (err) next(err);
              if (!user) {
                console.error('User was not found 2');
              } else {
                var favorited = (user.favorites.indexOf(req.query.url) === -1);
                var streamed = (user.streams.indexOf(req.query.url) === -1);
                res.json({ username: user.username, views: photo.views, favorited: !favorited, streamed: !streamed });
              }
            });
          }
        });
      }
    });
  },

  fetchFavorites: function(req, res, next) {
    User.findOne({ _id: mongoose.mongo.ObjectID(req.query.userId) }, function(err, user) {
      if (err) next(err);
      if (!user) {
        console.error('User was not found');
      } else {
        res.json(user.favorites);
      }
    });
  },

  fetchStreams: function(req, res, next) {
    User.findOne({ _id: mongoose.mongo.ObjectID(req.query.userId) }, function(err, user) {
      if (err) next(err);
      if (!user) {
        console.error('User was not found');
      } else {
        res.json(user.streams);
      }
    });
  },

  fetchStreamsObject: function(req, res, next){
    //fetch streamsObject with photo_id and .populate method, see fetch friends below
  },
  
  fetchUsersBySearchInput: function(req, res, next) {
    var username = req.query.search;
    findUsers({ username: username }, function (err, foundUsers) {
      if (err) {
        next(err);
      }
      if (!foundUsers) {
        res.statusCode(404).res('Couldn\'t find any matching users');
      } else {
        res.send(foundUsers);
      }
    });
  },

  addFriend: function(req, res, next) {
    var friendRequest = JSON.parse(Object.keys(req.body)[0]);

    findUser({ _id: friendRequest.userId })
      .then(function(user) {
        if (!user) {
          next(new Error('User does not exist'));
        } else {
          user.friends.push(mongoose.mongo.ObjectID(friendRequest.friendId));
          user.friendIdsString.push(friendRequest.friendId);
          user.save(function(err, savedUser) {
            if (err) { 
              next(new Error(err));
            } else {
              findUser({ _id: friendRequest.friendId })
                .then(function(user) {
                  if (!user) {
                    next(new Error('User does not exist'));
                  } else {
                    user.friends.push(mongoose.mongo.ObjectID(friendRequest.userId));
                    user.save(function(err, savedUser) {
                      if (err) { 
                        next(new Error(err));  
                      } else {
                        res.send('Friend added!');
                      }
                    });
                  }    
                });
            }
          });
        }
      })
      .fail(function(error) {
        next(error);
      });
  },

  fetchFriends: function(req, res, next) {
    var friendsArr = [];
    
    User.findOne({ _id: mongoose.mongo.ObjectID(req.query.userId) })
      .populate('friends', '_id username')
      .exec(function (err, user) {
        if (err) {
          next(err);
        } else {
          for (var i = 0; i < user.friends.length; i++) {
            friendsArr.push(user.friends[i]);
          }
          res.json(friendsArr);
        }
      });
  }
};
