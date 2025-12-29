const schemas = require("../utils/validationSchemas");

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
        value: detail.context?.value
      }));

      console.error('Validation Error:', {
        body: req.body,
        errors: errors
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
        message: `Validation failed: ${errors.map(e => e.message).join(', ')}`
      });
    }

    next();
  };
};

module.exports = validate;
