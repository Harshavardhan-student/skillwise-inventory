const express = require('express');
const bodyParser = require('body-parser');
const productRoutes = require('./routes/products');

const app = express();

const cors = require('cors');
app.use(cors({
  origin: "*",
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// Simple login route - returns a fake token
app.post('/api/login', (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: 'username required' });
  const token = `fake-token-${username}-${Date.now()}`;
  res.json({ token });
});

// Auth middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.slice(7);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  req.user = { token };
  next();
}

// Protect product routes with auth middleware
app.use('/api/products', authMiddleware, productRoutes);

// Export app for testing; start server when run directly
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

module.exports = app;
