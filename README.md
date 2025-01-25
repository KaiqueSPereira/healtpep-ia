HealthPep-IA
Um sistema de gerenciamento de consultas, resultados de exames e medicamentos, relacionando-os com os profissionais respons�veis. O projeto tamb�m utiliza a an�lise da IA ChatGPT para interpretar os resultados dos exames. Este projeto foi desenvolvido utilizando Next.js 13 com as novas funcionalidades do App Router e integra�?o com banco de dados via Prisma.

?? Tecnologias Utilizadas
Next.js 13: Framework React para renderiza�?o no servidor e funcionalidades modernas.
Prisma: ORM para intera�?es com o banco de dados.
NextAuth.js: Autentica�?o e gerenciamento de sess?es.
TypeScript: Tipagem est�tica para maior confiabilidade no c�digo.
TailwindCSS: Estiliza�?o r�pida e responsiva.
Lucide Icons: �cones modernos para UI.
Shadcn/ui: Componentes de IU personaliz�veis.
?? Funcionalidades
M�dulo de Profissionais
Cadastro de profissionais com:
Nome
Especialidade
N�mero de Classe
Unidades de Sa�de em que atuam
Tratamentos prescritos
M�dulo de Unidades de Sa�de
Cadastro de unidades de sa�de com:
Nome
Tipo de atendimento
Endere�o
Associa�?o com profissionais e consultas
M�dulo de Consultas
Cadastro de consultas com:
Data e hor�rio
Motivo da consulta
Queixas e anota�?es
Associa�?o ao usu�rio e profissional que realizou a consulta
Autentica�?o
Cadastro de usu�rios via Google utilizando NextAuth.js
Acesso restrito apenas para usu�rios autenticados
??? Melhorias Futuras
Adicionar o m�dulo de Controle de Medicamentos:
Cadastro e gerenciamento de medicamentos em uso pelos pacientes.
Adicionar o m�dulo de Exames:
Cadastro de exames realizados, com an�lise automatizada dos resultados via IA ChatGPT.
Implementar pagina�?o na listagem de profissionais.
Criar busca avan�ada por especialidades.
Melhorar a responsividade da interface para dispositivos m�veis.
Adicionar suporte para m�ltiplos idiomas.
?? Contribui�?es
Contribui�?es s?o bem-vindas! Se voc? deseja contribuir:

Fa�a um fork do projeto.
Crie uma nova branch:
bash
Copiar
Editar
git checkout -b minha-nova-feature
Fa�a suas altera�?es e comite:
bash
Copiar
Editar
git commit -m "Adiciona nova feature"
Envie suas mudan�as:
bash
Copiar
Editar
git push origin minha-nova-feature
Abra um Pull Request.
?? Licen�a
Este projeto est� licenciado sob a MIT License. Consulte o arquivo LICENSE para mais informa�?es.

? Cr�ditos
Desenvolvido com ?? por Kaique de Souza @oi_levi.
