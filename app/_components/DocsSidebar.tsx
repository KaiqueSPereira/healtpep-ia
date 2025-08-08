import React from 'react';
import Link from 'next/link';

const DocsSidebar: React.FC = () => {
  return (
    <aside className="w-64  p-4 border-r border-gray-200">
      <nav>
        <h2 className="text-xl font-semibold mb-4">Sobre</h2>
        <ul>
          <li>
            <Link href="/docs" className="block py-2  hover:text-blue-600">
              Início
            </Link>
          </li>
          <li>
            <Link href="/docs/exames" className="block py-2  hover:text-blue-600">
              Exames
            </Link>
          </li>
          <li>
            <Link href="/docs/medicos" className="block py-2  hover:text-blue-600">
              Médicos
            </Link>
          </li>
          <li>
            <Link href="/docs/tratamentos" className="block py-2 hover:text-blue-600">Tratamentos</Link>
          </li>
          <li>
            <Link href="/docs/unidades-saude" className="block py-2  hover:text-blue-600">Unidade de Saúde</Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default DocsSidebar;