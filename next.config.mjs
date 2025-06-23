/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, {webpack }) => {
    console.log('Configuração do Webpack está sendo executada');

    // Substitui o arquivo de teste por um módulo vazio
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /test\/data\/05-versions-space\.pdf/, // Regex para o arquivo problemático
        (resource) => {
          resource.request = require.resolve('./empty-module.js'); // Substitui pelo caminho para um módulo vazio
        }
      )
    );

    return config;
  },
};

export default nextConfig;
