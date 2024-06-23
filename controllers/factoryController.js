const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/api-features');
const AppError = require('./../utils/app-error');

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    const { query } = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .fields()
      .pagination();
    const documents = await query;
    res.status(200).json({
      status: 'success',
      counts: documents.length,
      data: {
        documents,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const ducument = await Model.create(req.body);
    res.status(200).json({
      status: 'success',
      data: {
        ducument,
      },
    });
  });

exports.getOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findById(req.params.id);
    console.log(document);
    res.status(200).json({
      status: 'success',
      data: {
        document,
      },
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: 'success',
      data: {
        document,
      },
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);
    if (!document)
      return next(new AppError('No document with the given id exists', 400));
    res.status(204).json({
      status: 'success',
      message: 'Tour has been deleted.',
    });
  });
