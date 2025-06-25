/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, {webpack }) => {
    
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /test\/data\/05-versions-space\.pdf/, 
        (resource) => {
          resource.request = require.resolve('./empty-module.js');
        }
      )
    );

    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    config.externals.push('pdfjs-dist');
    
    return config;
  },
};

export default nextConfig;
