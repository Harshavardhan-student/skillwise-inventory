const request = require('supertest');

// Ensure we use in-memory DB for tests
process.env.DB_FILE = ':memory:';

const app = require('../server');
const db = require('../db');

describe('Products API', () => {
  let token;

  beforeAll(async () => {
    // login to get token
    const res = await request(app).post('/api/login').send({ username: 'test' });
    token = res.body.token;
  });

  afterAll((done) => {
    // close db
    db.close(done);
  });

  test('POST /api/products creates a product', async () => {
    const product = { name: 'Test Product', unit: 'pcs', category: 'cat', brand: 'brand', stock: 10, status: 'In Stock', image: '' };
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(product);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe(product.name);
  });

  test('GET /api/products returns paginated list', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('products');
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  test('PUT /api/products/:id updates a product', async () => {
    // create product
    const product = { name: 'Update Product', unit: 'pcs', category: 'cat', brand: 'brand', stock: 5, status: 'In Stock', image: '' };
    const create = await request(app).post('/api/products').set('Authorization', `Bearer ${token}`).send(product);
    const id = create.body.id;

    const updated = { ...product, name: 'Updated Name', stock: 7 };
    const res = await request(app)
      .put(`/api/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updated);

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Updated Name');
  });

  test('DELETE /api/products/:id deletes a product', async () => {
    const product = { name: 'Delete Product', unit: 'pcs', category: 'cat', brand: 'brand', stock: 2, status: 'Out of Stock', image: '' };
    const create = await request(app).post('/api/products').set('Authorization', `Bearer ${token}`).send(product);
    const id = create.body.id;

    const res = await request(app).delete(`/api/products/${id}`).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  test('POST /api/products/import imports CSV', async () => {
    const csv = 'name,unit,category,brand,stock,status,image\nCSV Product,pcs,cat,brand,3,In Stock,\n';
    const res = await request(app)
      .post('/api/products/import')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(csv), 'sample.csv');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('added');
    expect(typeof res.body.added).toBe('number');
  });
});
