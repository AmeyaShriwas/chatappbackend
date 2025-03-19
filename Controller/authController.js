const { response } = require("express");
const authService = require("../Services/authService");
const User  = require('./../Models/UserModel')

const signUpUser = async (req, res) => {
  const {name,  email, password, number } = req.body;
  
  try {
    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
      console.log('existing user', existingUser)
      return res.status(400).json({ status: false, success: false, message: "User already exists" });
    }
    console.log('user not found we can proceed')

    const result = await authService.createUser(name, email, password, number);
    res.status(201).json({ status: true, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const isValid = await authService.verifyUserOtp(email, otp);
    if (!isValid) {
      return res.status(400).json({ status: false, message: "Invalid OTP" });
    } else {
      res.status(200).json({status: true,  message: "OTP verified successfully" });
    }
  } catch (error) {
    console.log('Error in verifyOtp:', error.message);
    res.status(500).json({ message: error.message });
  }
};


const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Call the auth service for login
    const response = await authService.loginUser(
      email,
      password,
      process.env.JWT_SECRET,
      process.env.REFRESH_TOKEN
    );

    // Check if login was unsuccessful
    if (!response.status) {
      return res.status(400).json({ status: false, error: response.message });
    }

    // Successful login
    return res.status(200).json(response);
  } catch (error) {
    // Handle unexpected errors
    console.error('Login error:', error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};


const uploadImage = async (req, res) => {
  try {
    const { id } = req.body;  // Get user ID from request body

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const imagePath = `/upload/${req.file.filename}`;  // Relative path
    console.log('User ID:', id);
    console.log('Uploaded Image Path:', imagePath);

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find user by ID and update the profilePicture field
    const user = await User.findByIdAndUpdate(
      id,
      { profilePicture: imagePath },   // ✅ Save relative path only
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Image uploaded successfully",
      profilePicture: user.profilePicture,  // ✅ Return only image path
    });

  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: "Failed to upload image" });
  }
};




const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await authService.findUserByEmail(email);
     console.log('user', user)
    if (!user) {
      return res.status(400).json({ status: false, message: "User with this email does not exist" });
    }

    const otp = authService.generateOTP();
    await authService.updateOtpForUser(user, otp);

    res.send({ status: true, message: "OTP sent to email" });
  } catch (error) {
    res.status(500).send(error);
  }
};

const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  console.log('email', email)
  console.log('otp', otp)
  console.log('password', newPassword)



  try {
    const user = await authService.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ status: false, message: "User with this email does not exist" });
    }

    const isValidOtp = await authService.verifyUserOtp(email, otp);
    if (!isValidOtp) {
      return res.status(400).json({ status: false, message: "Invalid OTP" });
    }

    await authService.updateUserPassword(user, newPassword);
    res.status(200).json({ status: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).send(error);
  }
};

const refreshToken = async (req, res) => {
  try {
    const { token } = req.body; // Get the refresh token from the request body
    if (!token) {
      return res.status(400).json({status: false, error: "Refresh token is required" });
    }

    const newAccessToken = await authService.generateNewAccessToken(token);
    res.status(200).json({stutus: true,  message: "New access token generated", accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

module.exports = { signUpUser,uploadImage, verifyOtp, loginUser, forgotPassword, resetPassword, refreshToken };
