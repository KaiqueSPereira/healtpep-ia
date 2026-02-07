### Recomendações para o Projeto

Por favor, siga as seguintes recomendações ao longo do desenvolvimento deste projeto:

1.  **Estilo de Código:**
    *   Utilizar **Prettier** para formatação de código consistente.
    *   Priorizar o uso de classes e utilitários do **Tailwind CSS** para estilização.

2.  **Componentização:**
    *   **Componentes Específicos:** Se um componente for reutilizado várias vezes dentro de uma área específica (ex: `medicamentos`), ele deve ser criado na subpasta `_components` dessa área (ex: `app/medicamentos/_components`).
    *   **Componentes Globais:** Se um componente for utilizado em múltiplas áreas do projeto, ele deve ser colocado na pasta `app/_components`.

3.  **Principais Bibliotecas e Padrões:**
    *   **Framework:** Next.js
    *   **UI:** React, Tailwind CSS, Radix UI, e Lucide React.
    *   **Gerenciamento de Formulários e Validação:** Utilizar **React Hook Form** para a construção de formulários e **Zod** para a validação de esquemas. **Todos os formulários devem obrigatoriamente usar Zod para validação.**
    *   **Autenticação:** A autenticação é gerenciada pelo **NextAuth.js**.
    *   **Banco de Dados e ORM:** A interação com o banco de dados é feita através do **Prisma**.
    *   **Gráficos:** **Padronizar o uso de `Recharts`** para visualização de dados. Migrar componentes que atualmente usam `Chart.js` para `Recharts` a fim de consolidar as dependências.
    *   **Upload de Arquivos:** Para funcionalidades de upload, utilizar a biblioteca **UploadThing**.
    *   **Gerenciamento de Estado Global:** Recomenda-se o uso de **`Zustand`** para gerenciar estados globais da aplicação, evitando "prop-drilling" e complexidade desnecessária.
    *   **Internacionalização (i18n):** Para preparar o projeto para múltiplos idiomas, recomenda-se a utilização de **`next-intl`**, que oferece integração otimizada com o Next.js App Router e tipagem segura para as traduções.

4.  **Otimização de Dependências:**
    *   **Bibliotecas de PDF:** O projeto utiliza múltiplas bibliotecas para manipulação de PDF (`pdf-lib`, `pdf-parse`, `pdfjs-dist`, `pdfreader`). Recomenda-se realizar uma auditoria para verificar a possibilidade de consolidar estas dependências, utilizando uma solução mais unificada como `pdfjs-dist` para reduzir o tamanho final do build e a complexidade do projeto.

5.  **Testes:**
    *   **Obrigatórios:** Todos os novos recursos e funcionalidades devem ser acompanhados de testes de unidade.
    *   **Cobertura:** Manter a cobertura de testes do projeto sempre acima de 80%.

6.  **Mensagens de Commit:** [Descreva o formato das mensagens de commit, por exemplo, "Seguir o padrão Conventional Commits", etc.]

7.  **Segurança e Privacidade:**
    *   **Criptografia:** Todas as informações sensíveis do usuário, capturadas pela API ou armazenadas no banco de dados, devem ser devidamente criptografadas para garantir a privacidade e segurança dos dados.

8.  **Rastreabilidade:**
    *   **Auditoria:** O aplicativo deve ser o mais rastreável (auditável) possível. Implementar logs detalhados para ações críticas do sistema e do usuário (ex: login, alterações em dados sensíveis, etc.) para facilitar a depuração e a auditoria de segurança.
