import asyncHandler from '../utils/asyncHandler.js';
import bcrypt from 'bcryptjs';
import ApiError from '../utils/ApiErrors.js';
import ApiResponse from '../utils/ApiResponse.js';
import pool from '../db/index.js';
import { setUserSession } from '../middlewares/auth.js';

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, first_name, last_name } = req.body;

  if (
    [username, email, password, first_name, last_name].some(
      field => !field || field.trim() === '',
    )
  ) {
    throw new ApiError(400, 'All fields are required');
  }

  // Check if user exists
  const userExists = await pool.query(
    'SELECT * FROM users WHERE username = $1 OR email = $2',
    [username, email],
  );

  if (userExists.rows.length > 0) {
    throw new ApiError(400, 'Username or Email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  // Set role to 'user' by default
  const defaultRole = 'user';

  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, first_name, last_name, role) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING id, username, email, first_name, last_name, role, created_at`,
    [username, email, password_hash, first_name, last_name, defaultRole],
  );

  return res
    .status(201)
    .json(new ApiResponse(201, result.rows[0], 'User registered successfully'));
});

const userLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'Email and Password are required');
  }
  const user = await pool.query('SELECT * FROM users WHERE email = $1', [
    email,
  ]);
  if (user.rows.length === 0) {
    throw new ApiError(404, 'User not found');
  }
  const isPasswordValid = await bcrypt.compare(
    password,
    user.rows[0].password_hash,
  );
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid password');
  }

  const { id, username, first_name, last_name, role } = user.rows[0];
  setUserSession(req, { id, username, email, first_name, last_name, role });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { id, username, email, first_name, last_name, role },
        'Login successful',
      ),
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    throw new ApiError(400, 'Email and New Password are required');
  }
  const user = await pool.query('SELECT * FROM users WHERE email = $1', [
    email,
  ]);
  if (user.rows.length === 0) {
    throw new ApiError(404, 'User not found');
  }
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(newPassword, salt);
  await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [
    password_hash,
    email,
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Password updated successfully'));
});

const getAllUsers = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Forbidden: Admins only');
  }
  const result = await pool.query(
    'SELECT id, username, email, first_name, last_name, role, created_at FROM users',
  );
  res
    .status(200)
    .json(new ApiResponse(200, result.rows, 'Users fetched successfully'));
});

const logoutUser = asyncHandler(async (req, res) => {
  req.session.destroy(err => {
    if (err) {
      throw new ApiError(500, 'Failed to logout');
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logout successful' });
  });
});

export { registerUser, userLogin, forgotPassword, getAllUsers, logoutUser };
