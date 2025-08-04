import React from 'react';

const DocsSidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-gray-100 p-4 border-r border-gray-200">
      <nav>
        <h2 className="text-xl font-semibold mb-4">Documentation</h2>
        <ul>
          <li><a href="/docs" className="block py-2 text-gray-700 hover:text-blue-600">Início</a></li>
          <li><a href="/docs/exames" className="block py-2 text-gray-700 hover:text-blue-600">Exames</a></li>
          <li><a href="/docs/medicos" className="block py-2 text-gray-700 hover:text-blue-600">Médicos</a></li>
          <li><a href="/docs/tratamentos" className="block py-2 text-gray-700 hover:text-blue-600">Tratamentos</a></li>
          <li><a href="/docs/unidade-de-saude" className="block py-2 text-gray-700 hover:text-blue-600">Unidade de Saúde</a></li>
        </ul>
      </nav>
    </aside>
  );
};

export default DocsSidebar;