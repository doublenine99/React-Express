const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const Dishes = require('../models/dishes');
const FavoriteDishes = require('../models/favorite');
const favoriteRouter = express.Router();
const authenticate = require('../authenticate');
const cors = require('./cors');
favoriteRouter.use(bodyParser.json());


favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        FavoriteDishes.findOne({ user: req.user._id })
            .populate('user')   // TODO 
            .populate('dishes')
            .then((userFavorites) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(userFavorites);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Dishes.findById(req.body._id)
            .then((dish) => {
                if (dish) { // if the we can find the dish on the database
                    FavoriteDishes.findOne({ user: req.user._id }) // finding the user's favorite list
                        .then((userFavorites) => {
                            if (userFavorites == null) { // if the user hasn't had any fav dish yet
                                req.body.user = req.user._id;
                                req.body.dishes = [];
                                req.body.dishes.push(mongoose.Types.ObjectId(req.body._id));
                                FavoriteDishes.create(req.body)
                                    .then((dish) => {
                                        console.log('Your first fav dish added!!', dish);
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.json(dish);
                                    }, (err) => next(err))
                                    .catch((err) => next(err));
                            } else { // directly push the dish to the list 
                                if (userFavorites.dishes == null) {
                                    console.log('bbb');
                                    userFavorites.dishes = [];
                                }
                                var exists = userFavorites.dishes.some((dishId) => {
                                    return dishId._id.toString() == (req.body._id.toString());
                                });
                                console.log("exists?: " + !exists);
                                if (!exists) {
                                    userFavorites.dishes.push(mongoose.Types.ObjectId(req.body._id));
                                    console.log("fav dish: " + userFavorites.dishes);
                                    userFavorites.save()
                                        .then((userFavorites) => {
                                            res.statusCode = 200;
                                            res.setHeader('Content-Type', 'application/json');
                                            res.json(userFavorites);
                                        }, (err) => next(err));
                                } else {
                                    err = new Error('Dish ' + req.body._id + '  has already in your favorite list!');
                                    err.status = 404;
                                    return next(err);
                                }
                            }

                        })
                }
                else {
                    err = new Error('Dish ' + req.params.dishId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));

    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        FavoriteDishes.remove({ user: req.user._id })
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp);
            }, (err) => next(err))
            .catch((err) => next(err));
    })

favoriteRouter.route('/:dishId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, (req, res, next) => {
        res.statusCode = 403;
        res.end('GET operation not supported on /favorites/:dishId');
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Dishes.findById(mongoose.Types.ObjectId(req.params.dishId))
            .then((dish) => {
                if (dish) { // if the we can find the dish on the database
                    FavoriteDishes.findOne({ user: req.user._id }) // finding the user's favorite list
                        .then((userFavorites) => {
                            if (userFavorites == null) { // if the user hasn't had any fav dish yet
                                var newDish = new Object();
                                newDish.user = req.user._id;
                                newDish.dishes = [mongoose.Types.ObjectId(req.params.dishId)];
                                FavoriteDishes.create(newDish)
                                    .then((dish) => {
                                        console.log('Your first fav dish added!!', dish);
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.json(dish);
                                    }, (err) => next(err))
                                    .catch((err) => next(err));
                            } else { // directly push the dish to the list 
                                if (userFavorites.dishes == null) {
                                    console.log('bbb');
                                    userFavorites.dishes = [];
                                }
                                var exists = userFavorites.dishes.some((dishId) => {
                                    return dishId._id.toString() == (req.params.dishId.toString());
                                });
                                console.log("exists?: " + !exists);
                                if (!exists) {
                                    userFavorites.dishes.push(mongoose.Types.ObjectId((req.params.dishId)));
                                    console.log("fav dish: " + userFavorites.dishes);
                                    userFavorites.save()
                                        .then((userFavorites) => {
                                            res.statusCode = 200;
                                            res.setHeader('Content-Type', 'application/json');
                                            res.json(userFavorites);
                                        }, (err) => next(err));
                                } else {
                                    err = new Error('Dish ' + req.params.dishId + '  has already in your favorite list!');
                                    err.status = 404;
                                    return next(err);
                                }
                            }
                        })
                }
                else {
                    err = new Error('Dish ' + req.params.dishId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));

    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites/:dishId');
    })
    // remove the specified dish from the list of the user's list of favorite dishes
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        FavoriteDishes.findOne({ user: req.user._id })
            .then((userFavorites) => {
                var exists = userFavorites.dishes.some((dishId) => {
                    return dishId._id.toString() == (req.params.dishId.toString());
                });
                if (userFavorites != null && exists) {
                    userFavorites.dishes.remove(mongoose.Types.ObjectId((req.params.dishId)));
                    userFavorites.save()
                        .then((dish) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(dish);
                        }, (err) => next(err));
                }
                else {
                    err = new Error('Dish ' + req.params.dishId + ' not found in user\'s favorite lists');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });


module.exports = favoriteRouter;