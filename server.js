const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'admin-products.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

async function readProducts() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeProducts(products) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(products, null, 2), 'utf8');
}

function normalizeProduct(product) {
  return {
    id: product.id || Date.now(),
    name: String(product.name || 'New Product'),
    price: Number(product.price) || 0,
    category: String(product.category || 'living'),
    description: String(product.description || ''),
    images: Array.isArray(product.images) ? product.images : (product.image ? [product.image] : ['img/hero.jpg']),
    image: Array.isArray(product.images) && product.images.length ? product.images[0] : (product.image || 'img/hero.jpg'),
    inStock: product.inStock !== false,
  };
}

app.get('/api/products', async (req, res) => {
  try {
    const products = await readProducts();
    res.json(products.map(normalizeProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = normalizeProduct(req.body);
    const products = await readProducts();
    if (products.some(p => p.id === product.id)) {
      product.id = Date.now();
    }
    products.push(product);
    await writeProducts(products);
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const products = await readProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'Product not found' });

    const updated = normalizeProduct({ ...products[index], ...req.body, id });
    products[index] = updated;
    await writeProducts(products);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    let products = await readProducts();
    products = products.filter(p => p.id !== id);
    await writeProducts(products);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.delete('/api/products', async (req, res) => {
  try {
    await writeProducts([]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to clear products' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
