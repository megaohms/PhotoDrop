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
    User.findOne({ _id: mongoose.mongo.ObjectID(req.query.userId) }, function(err, user) {
      if (err) next(err);
      if (!user) {
        console.error('User was not found');
      } else {
        if (user.streams.indexOf(url) === -1) {
          user.streams.push(url);
        } else {
          user.streams.splice(user.streams.indexOf(url), 1);
        }
        user.save(function(err, savedUser) {
          res.json();
        });
      }
    });
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

    var currentUserId = req.query.userId;
    var friendsArr = [];
    
/* Work in progress
    User.findOne({ _id: currentUserId })
      .populate('friends')
      .exec(function (err, friends) {
        if (err) {
          next(err);
        } else {
          console.log('friends inside fetchFriends', friends);
          for (var i = 0; i < friends.length; i++) {
            var friend = {};
            friend._id = friends[i]._id;
            friend.username = friends[i].username;
            friendsArr.push[friend];
          }
          res.json(friendsArr);
        }
      });
      */
      res.json(friendsArr);
  }
};
