exports.healthCheck = (req, res) => {
  res.status(200).json({
    ok: true,
    environment: req.app.locals.env.nodeEnv,
  });
};
