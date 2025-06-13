import mongoose from 'mongoose';

const { Schema } = mongoose;

const PostSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Le titre est obligatoire'],
    trim: true,
    minlength: [3, 'Le titre doit contenir au moins 3 caractères'],
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  content: {
    type: String,
    required: [true, 'Le contenu est obligatoire'],
    minlength: [10, 'Le contenu doit contenir au moins 10 caractères']
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'auteur est obligatoire']
  },
  imageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(url) {
        if (!url) return true;
        return /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
      },
      message: props => `${props.value} n'est pas une URL d'image valide`
    }
  },
  isAdvertisement: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    required: [true, 'La catégorie est obligatoire'],
    enum: {
      values: ['technology', 'medicine', 'business', 'education', 'lifestyle', 'advertisement'],
      message: 'Catégorie non valide'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'published', 'archived', 'pending'],
      message: 'Statut non valide'
    },
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Un tag ne peut pas dépasser 20 caractères']
  }]
}, {
  timestamps: false, // Désactive les timestamps automatiques car nous gérons updatedAt manuellement
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware pour mettre à jour la date de modification avant sauvegarde
PostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Validation supplémentaire pour les publicités
  if (this.isAdvertisement && this.category !== 'advertisement') {
    this.category = 'advertisement';
  }

  // Définir le statut 'pending' pour les nouvelles publicités
  if (this.isAdvertisement && this.isNew) {
    this.status = 'pending';
  }
  
  next();
});

// Index pour améliorer les performances de recherche
PostSchema.index({ author: 1 });
PostSchema.index({ category: 1 });
PostSchema.index({ status: 1 });
PostSchema.index({ isAdvertisement: 1 });
PostSchema.index({ createdAt: -1 }); // Index pour le tri chronologique inverse

// Gestion des modèles existants pour le rechargement à chaud
const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

export default Post;