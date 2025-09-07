// Ce fichier doit être renommé en postcss.config.cjs pour fonctionner avec "type": "module" dans package.json
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {
      config: './tailwind.config.js'
    },
    autoprefixer: {},
  },
} 