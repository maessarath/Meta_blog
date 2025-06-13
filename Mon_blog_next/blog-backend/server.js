import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import User from './models/User.js';
import jwt from 'jsonwebtoken';

// Import des routes
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import userRoutes from './routes/users.js';

// Config DB
import connectDB from './config/db.js';

// Initialisation
const app = express();
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json({ limit: '10mb' }));

// Middleware d'authentification
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    next();
  } catch (error) {
    console.error('Erreur auth middleware:', error);
    res.status(401).json({ success: false, error: 'Non autorisé' });
  }
};

// Route GET /api/me
app.get('/me', auth, async (req, res) => {
  try {
    const user = req.user.toObject();
    delete user.password;

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur /me:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// Routes existantes
app.use('/', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);

// Gestion des 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Endpoint non trouvé' 
  });
});

// Démarrage serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  =================================
  Serveur démarré sur le port ${PORT}
  Mode: ${process.env.NODE_ENV || 'development'}
  =================================
  `);
});