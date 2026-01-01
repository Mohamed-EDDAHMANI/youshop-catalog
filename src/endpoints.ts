// List of endpoints and allowed roles for catalog-service (Regex based)
export const CATALOG_ENDPOINTS = [
  {
    pattern: /^\/products\/post$/,
    roles: ['admin'],
  },
  {
    pattern: /^\/products\/[^\/]+\/put$/,
    roles: ['admin'],
  },
  {
    pattern: /^\/products\/[^\/]+\/delete$/,
    roles: ['admin'],
  },
];
