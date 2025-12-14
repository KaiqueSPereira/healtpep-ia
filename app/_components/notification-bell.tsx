'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BellIcon, CheckCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/_components/ui/popover';
import { Button } from '@/app/_components/ui/button';
import { ScrollArea } from '@/app/_components/ui/scroll-area';
import { Separator } from '@/app/_components/ui/separator';

interface Notification {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    medicamentoId?: string | null;
}

const NotificationBell = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        
        // Opcional: buscar notificações periodicamente
        const interval = setInterval(fetchNotifications, 60000); // A cada 1 minuto
        return () => clearInterval(interval);
    }, []);

    const handleMarkAllAsRead = async () => {
        try {
            const response = await fetch('/api/notifications', { method: 'POST' });
            if (response.ok) {
                setUnreadCount(0);
                setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            }
        } catch (error) {
            console.error("Failed to mark notifications as read:", error);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <BellIcon size={18} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <div className="p-4">
                    <h4 className="font-medium leading-none">Notificações</h4>
                </div>
                <ScrollArea className="h-72">
                    <div className="p-4 pt-0">
                        {notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <div key={notification.id}>
                                    <Link 
                                        href={notification.medicamentoId ? `/medicamentos/${notification.medicamentoId}` : '#'}
                                        onClick={() => setIsOpen(false)}
                                        className="block p-2 rounded-md hover:bg-accent"
                                    >
                                        <p className={`font-semibold text-sm ${!notification.isRead ? '' : 'text-muted-foreground'}`}>
                                            {notification.title}
                                        </p>
                                        <p className={`text-xs ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                                        </p>
                                    </Link>
                                    <Separator className="my-1" />
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-center text-muted-foreground py-8">Nenhuma notificação</p>
                        )}
                    </div>
                </ScrollArea>
                {notifications.length > 0 && (
                    <div className="p-2 border-t">
                        <Button 
                            variant="outline"
                            className="w-full"
                            onClick={handleMarkAllAsRead}
                            disabled={unreadCount === 0}
                        >
                            <CheckCheck className="mr-2 h-4 w-4"/>
                            Marcar todas como lidas
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};

export default NotificationBell;
