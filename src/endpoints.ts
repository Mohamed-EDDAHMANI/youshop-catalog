// List of endpoints and allowed roles for catalog-service
export const CATALOG_ENDPOINTS = {
  '/catalog/list': ['user', 'admin'],
  '/catalog/item': ['user', 'admin'],
  '/catalog/admin': ['admin']
};
