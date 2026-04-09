// Mock database for ecommerce app

export const db = {
  products: [
    {
      id: 1,
      name: 'Producto de ejemplo',
      price: 99.99,
      description: 'Descripción del producto',
      category: 'Electrónicos',
      stock: 10,
      image: '/images/products/example.jpg'
    }
  ],
  categories: [
    {
      id: 1,
      name: 'Electrónicos',
      slug: 'electronics'
    }
  ],
  orders: [],
  customers: []
}

export default db