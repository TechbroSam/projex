// postcss.config.mjs

const config = {
  plugins: [
    '@tailwindcss/postcss', // Use the new package name
    'autoprefixer',
  ],
};

export default config;