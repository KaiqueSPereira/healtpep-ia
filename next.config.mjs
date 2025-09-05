/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    // Rule from original config for pdfreader
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /test\/data\/05-versions-space\.pdf/,
        (resource) => {
          resource.request = require.resolve('./empty-module.js');
        }
      )
    );

    // Rule from original config
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    // Rule from original config for pdfjs-dist
    config.externals.push('pdfjs-dist');

    // New rule to prevent bundling tesseract.js on the server
    if (isServer) {
      config.externals.push('tesseract.js');
    }

    return config;
  },
};

export default nextConfig;
