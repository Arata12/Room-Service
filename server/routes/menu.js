const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const MENU_PATH = path.join(__dirname, '../data/menu.json');

function readMenu() {
  return JSON.parse(fs.readFileSync(MENU_PATH, 'utf8'));
}

function writeMenu(data) {
  fs.writeFileSync(MENU_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// GET /api/menu — returns full menu
router.get('/', (req, res) => {
  try {
    const menu = readMenu();
    res.json(menu);
  } catch (err) {
    console.error('Error reading menu:', err);
    res.status(500).json({ error: 'Failed to read menu' });
  }
});

// PUT /api/menu — replaces entire menu (admin only)
router.put('/', (req, res) => {
  try {
    const menu = req.body;

    // Basic structural validation
    if (!menu || !Array.isArray(menu.categories)) {
      return res.status(400).json({ error: 'Invalid menu structure: missing categories array' });
    }

    for (const cat of menu.categories) {
      if (!cat.id || !cat.name || !Array.isArray(cat.subcategories)) {
        return res.status(400).json({ error: `Invalid category: missing id, name, or subcategories` });
      }
      for (const sub of cat.subcategories) {
        if (!sub.id || !sub.name || !Array.isArray(sub.items)) {
          return res.status(400).json({ error: `Invalid subcategory "${sub.id}": missing id, name, or items` });
        }
        for (const item of sub.items) {
          if (!item.id || !item.name || typeof item.price !== 'number') {
            return res.status(400).json({ error: `Invalid item "${item.id}": missing id, name, or valid price` });
          }
        }
      }
    }

    writeMenu(menu);
    res.json({ success: true, categories: menu.categories.length });
  } catch (err) {
    console.error('Error writing menu:', err);
    res.status(500).json({ error: 'Failed to save menu' });
  }
});

module.exports = router;
