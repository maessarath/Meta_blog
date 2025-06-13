import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Post from '../models/Post.js';
import dotenv from 'dotenv';

dotenv.config();

// Middleware d'authentification (export nommé)
export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token manquant. Authentification requise.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id });

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé.' });
    }

    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ 
      error: 'Authentification échouée.',
      details: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  }
};

// Middleware de vérification d'auteur (export nommé)
export const checkAuthor = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).select('author');
    
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Article non trouvé' 
      });
    }

    if (post.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'Action non autorisée' 
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};