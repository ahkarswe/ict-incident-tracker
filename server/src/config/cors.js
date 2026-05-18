const DEFAULT_CLIENT_URLS = [
  'http://localhost',
  'http://127.0.0.1',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

export const getCorsOrigins = () => {
  const configuredOrigins = process.env.CLIENT_URL || DEFAULT_CLIENT_URLS.join(',');

  return configuredOrigins
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
};
