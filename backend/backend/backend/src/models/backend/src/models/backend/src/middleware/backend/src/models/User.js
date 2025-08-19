const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 50
  },
  email: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  monthlyIncome: { 
    type: Number, 
    default: 0
  },
  monthlyExpenses: { 
    type: Number, 
    default: 0
  },
  savingsGoal: { 
    type: Number, 
    default: 0
  },
  notifications: { 
    type: Boolean, 
    default: true 
  },
  theme: { 
    type: String, 
    default: 'light' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastLogin: { 
    type: Date 
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
