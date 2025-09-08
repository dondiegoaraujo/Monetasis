const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs'); // <-- MUDANÇA AQUI
const jwt = require('jsonwebtoken');

// REGISTER
router.post('/register', async (req, res) => {
  try {
    // Check if user already exists
    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist) return res.status(400).json({ message: 'Este e-mail já está em uso.' });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create a new user
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });

    const savedUser = await user.save();
    
    // Create and assign a token
    const token = jwt.sign({ _id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.status(201).json({ token });

  } catch (err) {
    console.error("ERRO NO REGISTRO:", err); // Log de erro mais detalhado
    res.status(500).json({ message: 'Erro interno no servidor ao registrar.' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    // Check if email exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ message: 'Email ou senha inválidos.' });

    // Check if password is correct
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).json({ message: 'Email ou senha inválidos.' });

    // Create and assign a token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.header('auth-token', token).json({ token });

  } catch (err) {
    console.error("ERRO NO LOGIN:", err); // Log de erro mais detalhado
    res.status(500).json({ message: 'Erro interno no servidor ao fazer login.' });
  }
});

module.exports = router;
