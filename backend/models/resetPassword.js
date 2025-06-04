// backend/controllers/authController.js
const bcrypt = require('bcrypt');

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  let user = await Resident.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } })
          || await Security.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } })
          || await Official.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });

  try {
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error(' Reset Password Error:', err.message);
    res.status(500).json({ error: 'Error resetting password.' });
  }
};
