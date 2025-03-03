const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');



const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/docDB')
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Define schema for JavaScript methods
const methodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Array', 'String', 'Object', 'Number', 'Other']
  },
  description: {
    type: String,
    required: true
  },
  examples: [{
    code: String,
    output: String
  }]
}, { timestamps: true });

// Create model
const Method = mongoose.model('Method', methodSchema);

// API Routes

// Get all methods
app.get('/api/methods', async (req, res) => {
  try {
    const methods = await Method.find().sort({ category: 1, name: 1 });
    res.json(methods);
  } catch (err) {
    console.error("Error fetching methods:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get method by ID
app.get('/api/methods/:id', async (req, res) => {
  try {
    const method = await Method.findById(req.params.id);
    if (!method) {
      return res.status(404).json({ message: "Method not found" });
    }
    res.json(method);
  } catch (err) {
    console.error("Error fetching method:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create new method
app.post('/api/methods', async (req, res) => {
  try {
    const method = new Method(req.body);
    const savedMethod = await method.save();
    res.status(201).json(savedMethod);
  } catch (err) {
    console.error("Error creating method:", err);
    if (err.code === 11000) {
      // Duplicate key error
      res.status(400).json({ message: "A method with this name already exists" });
    } else {
      res.status(500).json({ message: "Server error" });
    }
  }
});

// Update method
app.put('/api/methods/:id', async (req, res) => {
  try {
    const method = await Method.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!method) {
      return res.status(404).json({ message: "Method not found" });
    }
    
    res.json(method);
  } catch (err) {
    console.error("Error updating method:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete method
app.delete('/api/methods/:id', async (req, res) => {
  try {
    const method = await Method.findByIdAndDelete(req.params.id);
    
    if (!method) {
      return res.status(404).json({ message: "Method not found" });
    }
    
    res.json({ message: "Method deleted successfully" });
  } catch (err) {
    console.error("Error deleting method:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});