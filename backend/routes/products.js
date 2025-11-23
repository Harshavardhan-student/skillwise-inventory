const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

// ADD NEW PRODUCT
router.post('/', (req, res) => {
  const { name, unit, category, brand, stock, status, image } = req.body;

  if (!name || stock == null) {
    return res.status(400).json({ error: "Name and stock are required" });
  }

  db.run(
    `INSERT INTO products (name, unit, category, brand, stock, status, image)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, unit, category, brand, stock, status, image],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        id: this.lastID,
        name,
        unit,
        category,
        brand,
        stock,
        status,
        image
      });
    }
  );
});


// GET ALL PRODUCTS
router.get('/', (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// SEARCH PRODUCTS BY NAME
router.get('/search', (req, res) => {
  const nameQuery = `%${req.query.name || ''}%`;

  db.all(
    "SELECT * FROM products WHERE LOWER(name) LIKE LOWER(?)",
    [nameQuery],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// UPDATE PRODUCT
router.put('/:id', (req, res) => {
  const productId = req.params.id;
  const { name, unit, category, brand, stock, status, image } = req.body;

  if (stock < 0) {
    return res.status(400).json({ error: "Stock cannot be negative" });
  }

  db.get("SELECT * FROM products WHERE id = ?", [productId], (err, existingProduct) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    db.get(
      "SELECT * FROM products WHERE LOWER(name) = LOWER(?) AND id != ?",
      [name, productId],
      (err, duplicate) => {
        if (duplicate) {
          return res.status(400).json({ error: "Product name already exists" });
        }

        const updateQuery = `
          UPDATE products 
          SET name=?, unit=?, category=?, brand=?, stock=?, status=?, image=?
          WHERE id=?
        `;

        db.run(
          updateQuery,
          [name, unit, category, brand, stock, status, image, productId],
          function (err) {
            if (err) return res.status(500).json({ error: err.message });

            if (existingProduct.stock !== stock) {
              const logQuery = `
                INSERT INTO inventory_history (product_id, old_quantity, new_quantity, changed_by, timestamp)
                VALUES (?, ?, ?, ?, ?)
              `;

              db.run(
                logQuery,
                [
                  productId,
                  existingProduct.stock,
                  stock,
                  "admin",
                  new Date().toISOString()
                ]
              );
            }

            db.get("SELECT * FROM products WHERE id = ?", [productId], (err, updated) => {
              if (err) return res.status(500).json({ error: err.message });
              res.json(updated);
            });
          }
        );
      }
    );
  });
});

// IMPORT PRODUCTS FROM CSV
router.post('/import', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  const duplicates = [];
  let addedCount = 0;
  let skippedCount = 0;
  const filePath = req.file.path;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        for (const row of results) {
          const { name, unit, category, brand, stock, status, image } = row;

          const existingProduct = await new Promise((resolve, reject) => {
              db.get('SELECT id FROM products WHERE LOWER(name) = LOWER(?)', [name], (err, row) => {
                  if (err) return reject(err);
                  resolve(row);
              });
          });

          if (existingProduct) {
            skippedCount++;
            duplicates.push({ name, existingId: existingProduct.id });
          } else {
            await new Promise((resolve, reject) => {
              db.run(
                'INSERT INTO products (name, unit, category, brand, stock, status, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [name, unit, category, brand, stock, status, image],
                function (err) {
                  if (err) return reject(err);
                  addedCount++;
                  resolve();
                }
              );
            });
          }
        }

        res.json({
          added: addedCount,
          skipped: skippedCount,
          duplicates,
        });

      } catch (err) {
        res.status(500).json({ error: err.message });
      } finally {
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Error removing uploaded file:', unlinkErr);
        });
      }
    });
});



const { stringify } = require('csv-stringify');

// EXPORT CSV
router.get('/export', (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');

    const columns = [
      { key: 'name', header: 'name' },
      { key: 'unit', header: 'unit' },
      { key: 'category', header: 'category' },
      { key: 'brand', header: 'brand' },
      { key: 'stock', header: 'stock' },
      { key: 'status', header: 'status' },
      { key: 'image', header: 'image' }
    ];

    stringify(rows, { header: true, columns }).pipe(res);
  });
});



// GET INVENTORY HISTORY
router.get('/:id/history', (req, res) => {
  const productId = req.params.id;

  db.all(
    "SELECT * FROM inventory_history WHERE product_id = ? ORDER BY timestamp DESC",
    [productId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});


// DELETE PRODUCT
router.delete('/:id', (req, res) => {
  const productId = req.params.id;

  db.run(
    "DELETE FROM products WHERE id=?",
    [productId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.json({ success: true });
    }
  );
});



module.exports = router;
