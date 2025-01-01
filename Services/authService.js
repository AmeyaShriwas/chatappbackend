const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require('bcryptjs');
const User = require("../Models/UserModel");
const jwt = require('jsonwebtoken');
const Transporter = require('./../config')

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};



const sendOtpEmail = async(email, otp)=> {
  console.log('')
  const mailOption = {
     from : process.env.EMAIL_USER,
     to: email,
     subject :'Your One Time Password (otp) Code',
     text :`Dear User,\n\nThank you for choosing Chatapp. Your One-Time-Password(OTP) code for account verification is: ${otp}\n\nThis OTP is valid for the next 10 minutes. Please use it to complete the verification process.\n\nIf you didn't request this OTP, please ignore this email.\n\nBest regards,\nThe Chatapp Team`
  }
  await Transporter.sendMail(mailOption)
}

// Find user by email
const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

const createUser = async (name, email, password, number) => {
 
  try {
    console.log('goind to create or not')
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const newUser = new User({ name, email, password: hashedPassword, number, otp });
    console.log('new user created')
    await newUser.save();
    await sendOtpEmail(email, otp);
    
    return { success: true, message: "User registered, OTP sent to email", newUser };
  } catch (error) {
    console.log('show errror', error)
    throw new Error("Failed to create user: " + error.message);
  }
};


// Verify user OTP
const verifyUserOtp = async (email, otp) => {
  const user = await User.findOne({ email });
  if (user && user.otp === otp) {
    user.isVerified = true;
    await user.save();
    return true;
  }
  return false;
};

// Log in user
const loginUser = async (email, password, secret,refreshSecret, expiresIn) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return { error: "Invalid login credentials" };
    }
    if (!user.isVerified) {
      throw new Error('User is not verified');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { error: "Invalid login credentials" };
    }

    const accessToken = jwt.sign({ _id: user._id.toString() }, secret, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ _id: user._id.toString() }, refreshSecret, { expiresIn: '7d' });
    const data = {name: user.name}
    return {message: 'login successful', accessToken, refreshToken, data};
  } catch (error) {
    throw new Error(error.message);
  }
};

// Update OTP for user
const updateOtpForUser = async (user, otp) => {
  user.otp = otp;
  await user.save();
  await sendOtpEmail(user.email, otp);
};

// Update user password
const updateUserPassword = async (user, newPassword) => {
  user.password = await bcrypt.hash(newPassword, 10);
  user.otp = "";
  await user.save();
};

const generateNewAccessToken = async (refreshToken) => {
  try {
    const refreshSecret = process.env.REFRESH_TOKEN; // Store this in your .env file
    const secret = process.env.JWT_SECRET; // Store this in your .env file

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, refreshSecret);

    // Ensure the user exists in the database
    const user = await User.findById(decoded._id);
    if (!user) {
      throw new Error("User not found");
    }

    // Generate a new access token
    const newAccessToken = jwt.sign({ _id: user._id.toString() }, secret, { expiresIn: "15m" });

    return newAccessToken;
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};


module.exports = {
  generateOTP,
  sendOtpEmail,
  findUserByEmail,
  createUser,
  verifyUserOtp,
  loginUser,
  updateOtpForUser,
  updateUserPassword,
  generateNewAccessToken
};
