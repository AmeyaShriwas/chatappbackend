const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require('bcryptjs');
const User = require("../Models/UserModel");
const jwt = require('jsonwebtoken');
const Transporter = require('./../config')
const cron = require('node-cron')


//cron run to delete unverified user
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago

    const result = await User.deleteMany({
      isVerified: false, // Only unverified users
      createdAt: { $lte: tenMinutesAgo }, // Older than 10 minutes
    });

    if (result.deletedCount > 0) {
      console.log(`${result.deletedCount} unverified users deleted`);
    }
  } catch (error) {
    console.error('Error deleting unverified users:', error.message);
  }
});

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
  console.log('email', email)
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

const loginUser = async (email, password, secret, refreshSecret) => {
  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return { 
        status: false, 
        message: "Invalid login credentials" 
      };
    }

    // Check if the user's account is verified
    if (!user.isVerified) {
      return { 
        status: false, 
        message: "User is not verified" 
      };
    }

    // Validate the provided password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { 
        status: false, 
        message: "Invalid login credentials" 
      };
    }

    // Generate access and refresh tokens
    const accessToken = jwt.sign({ _id: user._id.toString() }, secret, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ _id: user._id.toString() }, refreshSecret, { expiresIn: '7d' });

    // Return successful response
    return {
      status: true,
      name: user.name,
      message: 'Login successful',
      accessToken,
      refreshToken,
    };
  } catch (error) {
    // Return error response
    return {
      status: false,
      message: error.message || "An error occurred during login",
    };
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
