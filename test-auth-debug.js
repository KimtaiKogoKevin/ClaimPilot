// Debug authentication structure
console.log("=== AUTH DEBUG ===");

// Test endpoint to debug req.user structure
const testAuth = (req, res) => {
  console.log("Full req.user:", JSON.stringify(req.user, null, 2));
  console.log("req.isAuthenticated():", req.isAuthenticated());
  console.log("req.user.claims:", req.user?.claims);
  console.log("req.user.claims.sub:", req.user?.claims?.sub);
  
  res.json({
    isAuthenticated: req.isAuthenticated(),
    userExists: !!req.user,
    hasUserClaims: !!req.user?.claims,
    userClaimsSub: req.user?.claims?.sub,
    fullUser: req.user
  });
};

module.exports = { testAuth };