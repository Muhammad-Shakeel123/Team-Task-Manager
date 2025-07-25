export function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
}

export function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    req.user = req.session.user;
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Admins only' });
}

export function setUserSession(req, user) {
  req.session.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
  };
}
