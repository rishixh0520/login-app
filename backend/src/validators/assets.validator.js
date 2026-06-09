const Joi = require('joi');

const assetSchema = Joi.object({
  asset_code: Joi.string().required().min(3).max(50),
  asset_name: Joi.string().required().min(3).max(200),
  asset_type: Joi.string().required().max(100),
  purchase_date: Joi.date().required(),
  purchase_cost: Joi.number().required().min(0),
  status: Joi.string().valid('Available', 'Allocated', 'Damaged', 'Lost').optional()
});

const validateAsset = (req, res, next) => {
  const { error } = assetSchema.validate(req.body);
  if (error) {
    const err = new Error(error.details[0].message);
    err.statusCode = 400;
    err.isOperational = true;
    return next(err);
  }
  next();
};

const allocationSchema = Joi.object({
  employee_id: Joi.number().required(),
  allocated_date: Joi.date().required()
});

const validateAllocation = (req, res, next) => {
  const { error } = allocationSchema.validate(req.body);
  if (error) {
    const err = new Error(error.details[0].message);
    err.statusCode = 400;
    err.isOperational = true;
    return next(err);
  }
  next();
};

module.exports = {
  validateAsset,
  validateAllocation
};
