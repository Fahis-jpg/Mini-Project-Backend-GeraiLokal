const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// 1. GET: Dapatkan semua data
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. GET: Dapatkan data berdasarkan nama produk (Pencarian)
app.get('/api/products/search', async (req, res) => {
    try {
        const { name } = req.query; 
        
        if (!name) {
            return res.status(400).json({ message: "Parameter pencarian 'name' harus diisi" });
        }

        const result = await pool.query('SELECT * FROM products WHERE name ILIKE $1', [`%${name}%`]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Produk tidak ditemukan" });
        }
        
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. GET: Dapatkan data berdasarkan ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Data tidak ditemukan" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. POST: Membuat data baru
app.post('/api/products', async (req, res) => {
    try {
        const { shop_id, category_id, name, description, price, stock } = req.body;
                const result = await pool.query(
            'INSERT INTO products (shop_id, category_id, name, description, price, stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [shop_id, category_id, name, description, price, stock]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. PUT: Memperbarui data
app.put('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, stock } = req.body;
        const result = await pool.query(
            'UPDATE products SET name = $1, price = $2, stock = $3 WHERE id = $4 RETURNING *',
            [name, price, stock, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: "Data tidak ditemukan" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. DELETE: Menghapus data
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Data tidak ditemukan" });
        res.json({ message: "Data berhasil dihapus", data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});