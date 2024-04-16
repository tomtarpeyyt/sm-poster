const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

mongoose.connect('mongodb://localhost:27017/your_database_name', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

const UserModel = mongoose.model('User', UserSchema);

const PostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  scheduledAt: { type: Date, required: true },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

const PostModel = mongoose.model('Post', PostSchema);

const SocialMediaAccountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  platform: { type: String, required: true },
  accessToken: { type: String, required: true },
}, { timestamps: true });

const SocialMediaAccountModel = mongoose.model('SocialMediaAccount', SocialMediaAccountSchema);

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).send({ auth: false, message: 'No token provided.' });
  }

  jwt.verify(token, 'your_secret_key', (err, decoded) => {
    if (err) {
      return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    }

    req.userId = decoded.id;
    next();
  });
};

// Signup endpoint
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await UserModel.create({ username, email, passwordHash: hashedPassword });
    
    const token = jwt.sign({ id: user._id }, 'your_secret_key', {
      expiresIn: 86400, // 24 hours
    });

    res.status(200).send({ auth: true, token });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error signing up user.');
  }
});

// Signin endpoint
app.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).send({ auth: false, token: null, message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id }, 'your_secret_key', {
      expiresIn: 86400, // 24 hours
    });

    res.status(200).send({ auth: true, token });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error signing in user.');
  }
});

// CRUD endpoints for users

// Get all users
app.get('/users', async (req, res) => {
    try {
      const users = await UserModel.find();
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching users.');
    }
  });
  
  // Get user by ID
  app.get('/users/:id', async (req, res) => {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) {
        return res.status(404).send('User not found.');
      }
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching user.');
    }
  });
  
  // Create new user
  app.post('/users', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const user = new UserModel({ username, email, passwordHash: hashedPassword });
      await user.save();
  
      const token = jwt.sign({ id: user._id }, 'your_secret_key', {
        expiresIn: 86400, // 24 hours
      });
  
      res.status(201).send({ auth: true, token });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error creating user.');
    }
  });
  
  // Update user by ID
  app.put('/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { username, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const updatedUser = await UserModel.findByIdAndUpdate(id, {
        username,
        email,
        passwordHash: hashedPassword,
      }, { new: true });
  
      if (!updatedUser) {
        return res.status(404).send('User not found.');
      }
  
      res.json(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error updating user.');
    }
  });
  
  // Delete user by ID
  app.delete('/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deletedUser = await UserModel.findByIdAndDelete(id);
      
      if (!deletedUser) {
        return res.status(404).send('User not found.');
      }
      
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).send('Error deleting user.');
    }
  });
  
// CRUD endpoints for posts

// Get all posts
app.get('/posts', verifyToken, async (req, res) => {
    try {
      const posts = await PostModel.find({ user: req.userId });
      res.json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching posts.');
    }
  });
  
  // Get post by ID
  app.get('/posts/:id', verifyToken, async (req, res) => {
    try {
      const post = await PostModel.findOne({ _id: req.params.id, user: req.userId });
      if (!post) {
        return res.status(404).send('Post not found.');
      }
      res.json(post);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching post.');
    }
  });
  
  // Create new post
  app.post('/posts', verifyToken, async (req, res) => {
    try {
      const { content, scheduledAt } = req.body;
  
      const post = new PostModel({ user: req.userId, content, scheduledAt });
      await post.save();
  
      res.status(201).json(post);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error creating post.');
    }
  });
  
  // Update post by ID
  app.put('/posts/:id', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { content, scheduledAt } = req.body;
  
      const updatedPost = await PostModel.findOneAndUpdate({ _id: id, user: req.userId }, {
        content,
        scheduledAt,
      }, { new: true });
  
      if (!updatedPost) {
        return res.status(404).send('Post not found.');
      }
  
      res.json(updatedPost);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error updating post.');
    }
  });
  
  // Delete post by ID
  app.delete('/posts/:id', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const deletedPost = await PostModel.findOneAndDelete({ _id: id, user: req.userId });
      
      if (!deletedPost) {
        return res.status(404).send('Post not found.');
      }
      
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).send('Error deleting post.');
    }
  });
  
// CRUD endpoints for social media accounts

// Get all social media accounts
app.get('/social_media_accounts', verifyToken, async (req, res) => {
    try {
      const socialMediaAccounts = await SocialMediaAccountModel.find({ user: req.userId });
      res.json(socialMediaAccounts);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching social media accounts.');
    }
  });
  
  // Get social media account by ID
  app.get('/social_media_accounts/:id', verifyToken, async (req, res) => {
    try {
      const socialMediaAccount = await SocialMediaAccountModel.findOne({ _id: req.params.id, user: req.userId });
      if (!socialMediaAccount) {
        return res.status(404).send('Social media account not found.');
      }
      res.json(socialMediaAccount);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching social media account.');
    }
  });
  
  // Create new social media account
  app.post('/social_media_accounts', verifyToken, async (req, res) => {
    try {
      const { platform, accessToken } = req.body;
  
      const socialMediaAccount = new SocialMediaAccountModel({ user: req.userId, platform, accessToken });
      await socialMediaAccount.save();
  
      res.status(201).json(socialMediaAccount);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error adding social media account.');
    }
  });
  
  // Update social media account by ID
  app.put('/social_media_accounts/:id', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { platform, accessToken } = req.body;
  
      const updatedSocialMediaAccount = await SocialMediaAccountModel.findOneAndUpdate(
        { _id: id, user: req.userId },
        { platform, accessToken },
        { new: true }
      );
  
      if (!updatedSocialMediaAccount) {
        return res.status(404).send('Social media account not found.');
      }
  
      res.json(updatedSocialMediaAccount);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error updating social media account.');
    }
  });
  
  // Delete social media account by ID
  app.delete('/social_media_accounts/:id', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const deletedSocialMediaAccount = await SocialMediaAccountModel.findOneAndDelete({ _id: id, user: req.userId });
      
      if (!deletedSocialMediaAccount) {
        return res.status(404).send('Social media account not found.');
      }
      
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).send('Error deleting social media account.');
    }
  });
  
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
