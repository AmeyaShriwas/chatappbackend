const authService = require("../Services/authService");

const signUpUser = async (req, res) => {
  const {name,  email, password, number } = req.body;
  
  try {
    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
      console.log('existing user', existingUser)
      return res.status(400).json({ success: false, message: "User already exists" });
    }
    console.log('user not found we can proceed')

    const result = await authService.createUser(name, email, password, number);
    res.status(201).json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const isValid = await authService.verifyUserOtp(email, otp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    } else {
      res.status(200).json({ message: "OTP verified successfully" });
    }
  } catch (error) {
    console.log('Error in verifyOtp:', error.message);
    res.status(500).json({ message: error.message });
  }
};


const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, accessToken, refreshToken, error } = await authService.loginUser(email, password, process.env.JWT_SECRET, process.env.REFRESH_TOKEN, "1h");

    if (error) {
      return res.status(400).json({ error });
    }

    res.status(200).json({ message: 'login successful', accessToken, refreshToken, data });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await authService.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "User with this email does not exist" });
    }

    const otp = authService.generateOTP();
    await authService.updateOtpForUser(user, otp);

    res.send({ message: "OTP sent to email" });
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
      return res.status(400).json({ message: "User with this email does not exist" });
    }

    const isValidOtp = await authService.verifyUserOtp(email, otp);
    if (!isValidOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await authService.updateUserPassword(user, newPassword);
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).send(error);
  }
};

const refreshToken = async (req, res) => {
  try {
    const { token } = req.body; // Get the refresh token from the request body
    if (!token) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    const newAccessToken = await authService.generateNewAccessToken(token);
    res.status(200).json({ message: "New access token generated", accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

module.exports = { signUpUser, verifyOtp, loginUser, forgotPassword, resetPassword, refreshToken };
