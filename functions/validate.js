const { check } = require('express-validator');
exports.validSignUp = [
  check('email').isEmail().withMessage('Must be a valid email address'),
  check('password', 'password is required').notEmpty(),
  check('password')
    .isLength({
      min: 6,
      max: 32,
    })
    .withMessage('Password must be between 6 to 32 characters')
    .matches(/\d/)
    .withMessage('password must contain a number'),
];

exports.validLogin = [
  check('email').isEmail().withMessage('Must be a valid email address'),
  check('password', 'password is required').notEmpty(),
  check('password')
    .isLength({
      min: 6,
    })
    .withMessage('Password must contain at least 6 characters')
    .matches(/\d/)
    .withMessage('password must contain a number'),
];
