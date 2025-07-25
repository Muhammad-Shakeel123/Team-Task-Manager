import { body, param, query, validationResult } from 'express-validator';

export const validateUserRegistration = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateUserLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateTeamCreation = [
  body('name').trim().notEmpty().withMessage('Team name is required'),
  body('description').optional().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateAddMember = [
  param('id').isInt().withMessage('Team ID must be an integer'),
  body('userIdToAdd').isInt().withMessage('User ID to add must be an integer'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateTaskCreation = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('team_id').isInt().withMessage('Team ID must be an integer'),
  body('description').optional().trim(),
  body('assigned_to')
    .optional()
    .isInt()
    .withMessage('Assigned to must be an integer'),
  body('due_date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Due date must be a valid date'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed'])
    .withMessage('Invalid status'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateTaskUpdate = [
  param('id').isInt().withMessage('Task ID must be an integer'),
  body('title').optional().trim(),
  body('description').optional().trim(),
  body('assigned_to')
    .optional()
    .isInt()
    .withMessage('Assigned to must be an integer'),
  body('due_date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Due date must be a valid date'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed'])
    .withMessage('Invalid status'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
