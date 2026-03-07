module.exports = (req, res) => {
  return res.status(200).json({ 
    status: 'ok',
    message: 'MoltJobs webhook endpoint',
    timestamp: new Date().toISOString()
  });
};
