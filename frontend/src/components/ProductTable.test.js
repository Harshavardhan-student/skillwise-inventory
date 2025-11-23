import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

jest.mock('../api/products', () => ({
  getProducts: jest.fn(),
  updateProduct: jest.fn(),
  importCSV: jest.fn(),
  downloadCSV: jest.fn(),
}));

import { getProducts, updateProduct, importCSV } from '../api/products';
import ProductTable from './ProductTable';

describe('ProductTable UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders table with products', async () => {
    getProducts.mockResolvedValue({ products: [ { id: 1, name: 'A', unit: 'pcs', category: 'c1', brand: 'b', stock: 1, status: 'In Stock' } ], page:1, pages:1, total:1, limit:10 });
    render(<ProductTable />);

    expect(await screen.findByText('Products')).toBeInTheDocument();
    expect(await screen.findByText('A')).toBeInTheDocument();
  });

  test('search filters rows', async () => {
    getProducts.mockResolvedValue({ products: [ { id: 1, name: 'Apple', unit: 'pcs', category: 'c1', brand: 'b', stock: 1, status: 'In Stock' }, { id:2, name: 'Banana', unit:'pcs', category:'c1', brand:'b', stock:2, status:'In Stock' } ], page:1, pages:1, total:2, limit:10 });
    render(<ProductTable />);
    expect(await screen.findByText('Apple')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Search products...');
    fireEvent.change(input, { target: { value: 'Apple' } });
    await waitFor(() => expect(screen.queryByText('Banana')).not.toBeInTheDocument());
  });

  test('edit/save updates row', async () => {
    getProducts.mockResolvedValueOnce({ products: [ { id: 1, name: 'Old', unit: 'pcs', category: 'c1', brand: 'b', stock: 1, status: 'In Stock' } ], page:1, pages:1, total:1, limit:10 });
    getProducts.mockResolvedValueOnce({ products: [ { id: 1, name: 'New', unit: 'pcs', category: 'c1', brand: 'b', stock: 1, status: 'In Stock' } ], page:1, pages:1, total:1, limit:10 });
    updateProduct.mockResolvedValue({});

    render(<ProductTable />);
    expect(await screen.findByText('Old')).toBeInTheDocument();
    const editBtn = await screen.findByText('Edit');
    fireEvent.click(editBtn);
    const nameInput = screen.getByDisplayValue('Old');
    fireEvent.change(nameInput, { target: { value: 'New' } });
    const saveBtn = screen.getByText('Save');
    fireEvent.click(saveBtn);
    // after save, fetchData is called and table shows updated name
    expect(await screen.findByText('New')).toBeInTheDocument();
  });

  test('CSV import triggers refresh', async () => {
    getProducts.mockResolvedValue({ products: [ { id: 1, name: 'A', unit: 'pcs', category: 'c1', brand: 'b', stock: 1, status: 'In Stock' } ], page:1, pages:1, total:1, limit:10 });
    importCSV.mockResolvedValue({ added: 1 });
    render(<ProductTable />);
    const fileInput = screen.getByRole('textbox', { hidden: true }) || screen.getByLabelText(/file/i) || document.querySelector('input[type=file]');
    // simulate file change
    const file = new File(['name,unit,category,brand,stock,status,image\nA,pcs,c1,b,1,In Stock,'], 'sample.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type=file]');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(importCSV).toHaveBeenCalled());
  });
});
