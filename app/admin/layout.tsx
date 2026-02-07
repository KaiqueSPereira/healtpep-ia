
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

// Componente de Acesso Negado reutilizável
function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background">
            <h1 className="text-4xl font-bold text-destructive">Acesso Negado</h1>
            <p className="mt-4 text-lg text-muted-foreground">Você não tem permissão para acessar esta página.</p>
            <p className="mt-2 text-sm text-muted-foreground">Contate um administrador se você acredita que isso é um erro.</p>
        </div>
    );
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const session = await getServerSession(authOptions);

    // 1. Verifica se a sessão existe e se o usuário está logado
    if (!session || !session.user) {
        // Se não estiver logado, redireciona para a página de login
        // (ou para a home, que por sua vez redirecionará para o login se for protegida)
        redirect("/");
    }

    // 2. Verifica se o usuário tem a permissão necessária
    const hasPermission = session.user.permissions?.includes('view_admin_dashboard');

    if (!hasPermission) {
        // Se não tiver permissão, exibe a página de acesso negado.
        // Você pode optar por redirecionar para a home também: redirect("/");
        return <AccessDenied />;
    }

    // 3. Se o usuário tem permissão, renderiza o conteúdo da página de admin
    return (
        <div className="p-4 md:p-8">
            {children}
        </div>
    );
}
