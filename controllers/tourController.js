const Tour = require('./../models/tourModel');
const factoryController = require('./factoryController');

exports.getAllTours = factoryController.getAll(Tour);
exports.createTour = factoryController.createOne(Tour);
exports.getTour = factoryController.getOne(Tour);
exports.updateTour = factoryController.updateOne(Tour);
exports.deleteTour = factoryController.deleteOne(Tour);
