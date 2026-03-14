const jwt = require('jsonwebtoken');
const { User, Organization } = require('../models');
const config = require('../config/app');

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role, orgId: user.organizationId };
  const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  const refreshToken = jwt.sign({ id: user.id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, organizationId, specialtyId } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const user = await User.create({
      firstName, lastName, email,
      passwordHash: password,
      role: role || 'physician',
      organizationId,
      specialtyId: specialtyId || null,
    });

    const { accessToken, refreshToken } = generateTokens(user);
    await user.update({ refreshToken });

    res.status(201).json({
      success: true,
      data: { user, accessToken, refreshToken, expiresIn: 86400 },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const user = await User.findOne({
      where: { email },
      attributes: { include: ['passwordHash', 'refreshToken'] },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const valid = await user.validatePassword(password);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    await user.update({ refreshToken, lastLogin: new Date() });

    res.json({
      success: true,
      data: { user, accessToken, refreshToken, expiresIn: 86400 },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    await req.user.update({ refreshToken: null });
    res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const user = await User.findOne({
      where: { id: decoded.id, refreshToken },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user);
    await user.update({ refreshToken: tokens.refreshToken });

    res.json({
      success: true,
      data: {
        user,
        ...tokens,
        expiresIn: 86400,
      },
    });
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
  }
};

exports.getProfile = async (req, res) => {
  res.json({ success: true, data: req.user });
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    await req.user.update({ firstName, lastName });
    res.json({ success: true, data: req.user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id, {
      attributes: { include: ['passwordHash'] },
    });

    const valid = await user.validatePassword(currentPassword);
    if (!valid) {
      return res.status(400).json({ success: false, error: 'Current password incorrect' });
    }

    await user.update({ passwordHash: newPassword });
    res.json({ success: true, data: { message: 'Password updated successfully' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
