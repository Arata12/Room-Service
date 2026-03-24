const express = require('express');
const router = express.Router();

// Serve menu from JSON file
const menu = require('../data/menu.json');

router.get('/', (req, res) => {
  res.json(menu);
});

module.exports = router;
