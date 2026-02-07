const Footer = () => {
  const currentYear = new Date().getFullYear();
  const appVersion = process.env.npm_package_version || '0.1.0'; // Fallback para a versão que lemos

  return (
    <footer className="w-full p-5 text-center border-t border-solid mt-auto bg-background">
      <p className="text-sm text-gray-500">
        © 2024 - {currentYear} HealtPep - v{appVersion}
      </p>
    </footer>
  );
};

export default Footer;
