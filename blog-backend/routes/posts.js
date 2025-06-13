import express from 'express';
import multer from 'multer';
import path from 'path';
import { auth, checkAuthor } from '../middleware/auth.js';
import {
  getAllPosts,
  getPostById,
  updatePost,
  deletePost
} from '../controllers/postController.js';
import Post from '../models/Post.js';

const router = express.Router();

// Configuration de Multer pour le stockage des images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, gif, webp)'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Route pour créer un article (version améliorée)
router.post('/api/posts', auth, async (req, res) => {
  try {
    console.log('Données reçues:', req.body);
    
    // Validation minimale
    if (!req.body.title || !req.body.content) {
      return res.status(400).json({ 
        success: false,
        error: 'Titre et contenu requis' 
      });
    }

    const post = new Post({
      ...req.body,
      author: req.user.id,
      // Valeurs par défaut si non spécifiées
      imageUrl: req.body.imageUrl || null,
      isAdvertisement: req.body.category === 'advertisement',
      status: req.body.category === 'advertisement' ? 'pending' : 'draft'
    });

    await post.save();
    console.log('Article enregistré:', post);

    // Réponse enrichie
    res.status(201).json({
      success: true,
      message: 'Article créé avec succès',
      post: {
        id: post._id,
        title: post.title,
        content: post.content,
        category: post.category,
        isAdvertisement: post.isAdvertisement,
        status: post.status,
        author: post.author,
        imageUrl: post.imageUrl,
        createdAt: post.createdAt
      }
    });
    
  } catch (err) {
    console.error('Erreur serveur:', err);
    res.status(500).json({ 
      success: false,
      error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur serveur'
    });
  }
});

// Route de test simplifiée (sans auth pour le debug)
router.post('/api/posts/test', (req, res) => {
  console.log('Requête de test reçue ! Body :', req.body);
  res.status(201).json({ 
    success: true,
    message: 'Route de test fonctionnelle',
    receivedData: req.body 
  });
});

// @route   POST api/posts/upload
// @desc    Upload post image
// @access  Private
router.post('/upload', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Aucun fichier uploadé' 
      });
    }

    res.json({ 
      success: true,
      message: 'Image uploadée avec succès',
      url: `/uploads/${req.file.filename}`
    });
  } catch (err) {
    console.error('Erreur upload image:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de l\'upload',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Ancienne route POST /api/posts (conservée pour compatibilité)
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, category, imageUrl } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ 
        success: false,
        message: 'Titre, contenu et catégorie sont requis' 
      });
    }

    const post = new Post({
      title,
      content,
      category,
      imageUrl: imageUrl || null,
      author: req.user.id,
      isAdvertisement: category === 'advertisement',
      status: category === 'advertisement' ? 'pending' : 'draft'
    });

    await post.save();

    res.status(201).json({
      success: true,
      message: 'Article créé avec succès',
      post: {
        id: post._id,
        title: post.title,
        content: post.content,
        category: post.category,
        isAdvertisement: post.isAdvertisement,
        status: post.status,
        author: post.author,
        imageUrl: post.imageUrl,
        createdAt: post.createdAt
      }
    });
  } catch (err) {
    console.error('Erreur création article:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Routes existantes conservées
router.get('/', getAllPosts);
router.get('/:id', getPostById);
router.put('/:id', auth, checkAuthor, updatePost);
router.delete('/:id', auth, checkAuthor, deletePost);

// @route   GET api/posts/advertisements
// @desc    Get all published advertisements
// @access  Public
router.get('/advertisements', async (req, res) => {
  try {
    const ads = await Post.find({ 
      isAdvertisement: true,
      status: 'published'
    }).sort('-createdAt');

    res.json({
      success: true,
      count: ads.length,
      advertisements: ads
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router;