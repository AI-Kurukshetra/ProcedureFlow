const { AuditLog } = require('../models');

const auditLog = (action, entityType) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      if (req.user && res.statusCode < 400) {
        try {
          const entityId =
            req.params.id ||
            (body && body.data && body.data.id) ||
            null;
          await AuditLog.create({
            userId: req.user.id,
            action,
            entityType,
            entityId,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            details: {
              method: req.method,
              path: req.path,
              body: req.method !== 'GET' ? req.body : undefined,
            },
          });
        } catch (err) {
          console.error('Audit log error:', err.message);
        }
      }
      return originalJson(body);
    };
    next();
  };
};

module.exports = auditLog;
