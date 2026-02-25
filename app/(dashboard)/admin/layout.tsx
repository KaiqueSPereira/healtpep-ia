
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import UnauthorizedPage from "@/app/unauthorized/page"; // Importando sua página!

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const session = await getServerSession(authOptions);

    // 1. Verifica se a sessão existe e se o usuário está logado
    if (!session || !session.user) {
        // Se não estiver logado, redireciona para a página de login
        redirect("/");
    }

    // 2. Verifica se o usuário tem a permissão necessária
    const hasPermission = session.user.permissions?.includes('view_admin_dashboard');

    if (!hasPermission) {
        // Se não tiver permissão, exibe a sua página personalizada.
        return <UnauthorizedPage />;
    }

    // 3. Se o usuário tem permissão, renderiza o conteúdo da página de admin
    return (
        <div className="p-4 md:p-8">
            {children}
        </div>
    );
}
