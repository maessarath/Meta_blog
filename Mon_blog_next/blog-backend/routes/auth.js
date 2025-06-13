import express from 'express';
import { register, login, logout, getMe } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// @route   POST api/register
// @desc    Register user
// @access  Public
router.post('/api/register', register);

// @route   POST api/login
// @desc    Login user
// @access  Public
router.post('/api/login', login);

// @route   POST api/logout
// @desc    Logout user
// @access  Private
router.post('/api/logout', logout);

// @route   GET api/me
// @desc    Get current user data
// @access  Private
// router.get('/me', authMiddleware, getMeController);
router.get('/api/me', getMe);

export default router;