import { useState, useEffect, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '../stores/authStore';

export const useNotifications = () => {
    const { user, currentOrganization } = useAuthStore();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [stompClient, setStompClient] = useState(null);

    const organizationId = currentOrganization?.id || user?.organizationId || user?.organization?.id;

    // Fetch history
    const fetchNotifications = useCallback(async () => {
        if (!user || !organizationId) return;
        
        try {
            // Dans votre architecture, /api/notifications est routé vers l'audit-service par l'api-gateway
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/notifications?userId=${user.id}&organizationId=${organizationId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, [user, currentOrganization]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Setup WebSocket
    useEffect(() => {
        if (!user || !organizationId) return;

        const socketUrl = '/ws-notifications'; 
        
        const client = new Client({
            webSocketFactory: () => new SockJS(socketUrl),
            debug: (str) => console.log(str),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('Connected to WebSocket', { userId: user.id, organizationId, socketUrl });
                
                // Subscribe to user notifications
                client.subscribe(`/topic/user.${user.id}.notifications`, (message) => {
                    console.log('WS message received on user channel', message.body);
                    const newNotification = JSON.parse(message.body);
                    handleNewNotification(newNotification);
                });

                // Subscribe to organization notifications
                client.subscribe(`/topic/org.${organizationId}.notifications`, (message) => {
                    console.log('WS message received on org channel', message.body);
                    const newNotification = JSON.parse(message.body);
                    handleNewNotification(newNotification);
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
        });

        client.activate();
        setStompClient(client);

        return () => {
            if (client) {
                client.deactivate();
            }
        };
    }, [user, currentOrganization]);

    const handleNewNotification = (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        
        // Optional: Trigger a toast/snack notification here if you have a library
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read', error);
        }
    };

    return {
        notifications,
        unreadCount,
        markAsRead
    };
};
