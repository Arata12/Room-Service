# Menu Structure & Customization

Guide to customizing the room service menu.

## Overview

The menu is stored in two locations:
- `client/src/menu.json` - Frontend menu display
- `server/data/menu.json` - Server-side copy (for API)

**Important:** Keep both files synchronized when making changes.

## Menu Structure

```json
{
  "categories": [
    {
      "id": "food",
      "name": {
        "en": "Food",
        "es": "Comida"
      },
      "subcategories": [
        {
          "id": "starters",
          "name": {
            "en": "Starters",
            "es": "Entradas"
          },
          "items": [
            {
              "id": "garden-salad",
              "name": {
                "en": "Garden Salad",
                "es": "Ensalada de la Casa"
              },
              "description": {
                "en": "Fresh mixed greens...",
                "es": "Mix de hojas verdes..."
              },
              "price": 8.00
            }
          ]
        }
      ]
    }
  ]
}
```

## Categories

Categories are top-level menu sections (e.g., Food, Drinks).

```json
{
  "id": "food",
  "name": {
    "en": "Food",
    "es": "Comida"
  },
  "subcategories": []
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier (lowercase, no spaces) |
| `name` | Yes | Translated category name |
| `subcategories` | Yes | Array of subcategories |

## Subcategories

Subcategories group items within a category (e.g., Starters, Main Course).

```json
{
  "id": "starters",
  "name": {
    "en": "Starters",
    "es": "Entradas"
  },
  "items": []
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier |
| `name` | Yes | Translated subcategory name |
| `items` | Yes | Array of menu items |

## Menu Items

Individual dishes or drinks.

```json
{
  "id": "garden-salad",
  "name": {
    "en": "Garden Salad",
    "es": "Ensalada de la Casa"
  },
  "description": {
    "en": "Fresh mixed greens with cherry tomatoes, cucumbers, and house dressing",
    "es": "Mix de hojas verdes frescas con tomates cherry, pepino y aderezo de la casa"
  },
  "price": 8.00
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier (kebab-case) |
| `name` | Yes | Translated item name |
| `description` | Yes | Translated description |
| `price` | Yes | Price as number (no currency symbol) |

## Adding a New Item

1. Edit `client/src/menu.json`
2. Find the appropriate category and subcategory
3. Add the new item to the `items` array:

```json
{
  "id": "chocolate-cake",
  "name": {
    "en": "Chocolate Cake",
    "es": "Pastel de Chocolate"
  },
  "description": {
    "en": "Rich chocolate layer cake with ganache",
    "es": "Pastel de chocolate con ganache"
  },
  "price": 7.50
}
```

4. Copy the same change to `server/data/menu.json`
5. Restart the containers or refresh the page

## Adding a New Subcategory

1. Add a new subcategory object to a category:

```json
{
  "id": "beverages",
  "name": {
    "en": "Beverages",
    "es": "Bebidas"
  },
  "items": [
    // Add items here
  ]
}
```

## Adding a New Category

1. Add a new category to the `categories` array:

```json
{
  "id": "specials",
  "name": {
    "en": "Today's Specials",
    "es": "Especiales del Día"
  },
  "subcategories": [
    {
      "id": "chef-specials",
      "name": {
        "en": "Chef's Specials",
        "es": "Especiales del Chef"
      },
      "items": []
    }
  ]
}
```

## Pricing

- Use decimal numbers (e.g., `10.50` not `10.5`)
- Store prices in USD (database stores USD, conversion happens at display)
- The currency symbol is added by the frontend

## Adding More Languages

To add a new language (e.g., French):

1. Add translations to all `name` and `description` fields:

```json
{
  "id": "garden-salad",
  "name": {
    "en": "Garden Salad",
    "es": "Ensalada de la Casa",
    "fr": "Salade du Jardin"
  },
  "description": {
    "en": "Fresh mixed greens...",
    "es": "Mix de hojas verdes...",
    "fr": "Mélange de verts frais..."
  },
  "price": 8.00
}
```

2. Create a new translation file: `client/src/i18n/fr.json`

3. Register the language in `client/src/i18n/index.js`:

```javascript
import fr from './fr.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
  },
  // ...
});
```

4. Update the language switcher in the Navbar component

## Menu Sync Script

Create a script to keep menu files in sync:

```bash
#!/bin/bash
# sync-menu.sh

cp client/src/menu.json server/data/menu.json
echo "Menu synced!"
```

Make it executable:
```bash
chmod +x sync-menu.sh
```

## Validation

Validate your menu JSON before deploying:

```javascript
// validate-menu.js
const menu = require('./client/src/menu.json');

function validateMenu(menu) {
  if (!menu.categories) {
    throw new Error('Missing categories array');
  }
  
  menu.categories.forEach((cat, i) => {
    if (!cat.id) throw new Error(`Category ${i} missing id`);
    if (!cat.name?.en) throw new Error(`Category ${cat.id} missing English name`);
    if (!cat.name?.es) throw new Error(`Category ${cat.id} missing Spanish name`);
  });
  
  console.log('✓ Menu is valid');
}

validateMenu(menu);
```

Run with:
```bash
node validate-menu.js
```

## Best Practices

1. **Use descriptive IDs**: `grilled-salmon` not `item-1`
2. **Keep descriptions concise**: 1-2 sentences max
3. **Sync files**: Always update both client and server menu.json
4. **Test changes**: Verify both languages display correctly
5. **Backup**: Keep a backup of working menu.json before major changes

## Example: Complete Menu Addition

Adding a new breakfast category:

**client/src/menu.json** and **server/data/menu.json**:
```json
{
  "categories": [
    // ... existing categories ...
    {
      "id": "breakfast",
      "name": {
        "en": "Breakfast",
        "es": "Desayuno"
      },
      "subcategories": [
        {
          "id": "continental",
          "name": {
            "en": "Continental",
            "es": "Continental"
          },
          "items": [
            {
              "id": "continental-breakfast",
              "name": {
                "en": "Continental Breakfast",
                "es": "Desayuno Continental"
              },
              "description": {
                "en": "Pastries, fruit, and coffee",
                "es": "Panadería, fruta y café"
              },
              "price": 12.00
            }
          ]
        }
      ]
    }
  ]
}
```

**client/src/i18n/en.json** and **es.json**:
```json
{
  "menu": {
    "breakfast": "Breakfast",
    "continental": "Continental"
  }
}
```
