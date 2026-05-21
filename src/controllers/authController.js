const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

// ✅ Resend setup
const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Generate OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ✅ OTP expiry (5 mins)
function getOtpExpiry() {
  return new Date(Date.now() + 5 * 60 * 1000);
}

// ✅ Send OTP email using Resend API
async function sendOtpEmail(recipient, otp) {

  const response = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: recipient,
    subject: 'Civic Solver OTP Verification',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Civic Solver OTP Verification</h2>
        <p>Your OTP code is:</p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 5px;
          margin: 20px 0;
          color: #2563eb;
        ">
          ${otp}
        </div>

        <p>This OTP expires in 5 minutes.</p>
      </div>
    `
  });

  console.log("EMAIL SENT:", response);
}

// ✅ Register
const register = async (req, res) => {
  try {

    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email and password are required'
      });
    }

    // Existing user
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {

      if (!existingUser.isVerified) {
        return res.status(400).json({
          message: 'Email already registered. Please verify OTP.'
        });
      }

      return res.status(400).json({
        message: 'User already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOtp();

    const otpExpiresAt = getOtpExpiry();

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isVerified: false,
        otp,
        otpExpiresAt
      }
    });

    // Send OTP email
    try {

      await sendOtpEmail(email, otp);

    } catch (emailError) {

      console.log('OTP EMAIL ERROR:', emailError);

      return res.status(500).json({
        message: 'Failed to send OTP email',
        error: emailError.message
      });
    }

    res.status(201).json({
      message: 'OTP sent successfully',
      email: user.email
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: error.message
    });
  }
};

// ✅ Verify OTP
const verifyOtp = async (req, res) => {
  try {

    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email and OTP are required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid email'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: 'Email already verified'
      });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({
        message: 'Invalid OTP'
      });
    }

    if (!user.otpExpiresAt || new Date(user.otpExpiresAt) < new Date()) {
      return res.status(400).json({
        message: 'OTP expired'
      });
    }

    // Verify user
    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otp: null,
        otpExpiresAt: null
      }
    });

    res.json({
      message: 'Email verified successfully'
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: error.message
    });
  }
};

// ✅ Resend OTP
const resendOtp = async (req, res) => {
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: 'Email already verified'
      });
    }

    // Generate new OTP
    const otp = generateOtp();

    const otpExpiresAt = getOtpExpiry();

    await prisma.user.update({
      where: { email },
      data: {
        otp,
        otpExpiresAt
      }
    });

    // Send OTP email
    try {

      await sendOtpEmail(email, otp);

    } catch (emailError) {

      console.log('RESEND OTP ERROR:', emailError);

      return res.status(500).json({
        message: 'Failed to resend OTP',
        error: emailError.message
      });
    }

    res.json({
      message: 'OTP resent successfully'
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: error.message
    });
  }
};

// ✅ Login
const login = async (req, res) => {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid credentials'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email first'
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid credentials'
      });
    }

    // JWT
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d'
      }
    );

    res.json({
      message: 'Login successful',
      token
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  verifyOtp,
  resendOtp
};