// List of endpoints and allowed roles for catalog-service (Regex based)
export const CATALOG_ENDPOINTS = [
  {
    pattern: /^\/product\/create\/post$/,
    roles: ['admin'],
  },
  {
    pattern: /^\/product\/update\/[^\/]+\/put$/,
    roles: ['admin'],
  },
  {
    pattern: /^\/product\/delete\/[^\/]+\/delete$/,
    roles: ['admin'],
  },
];
