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

    // Adiciona regra para lidar com arquivos .mjs
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    // Adiciona pdfjs-dist como external para evitar problemas de compilação
    config.externals.push('pdfjs-dist');


    return config;
  },
};

export default nextConfig;
