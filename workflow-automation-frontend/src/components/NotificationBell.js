import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import './NotificationBell.css';

const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        // Optional: navigation to the related entity
    };

    const getNotificationStyle = (type) => {
        if (!type) return { icon: '🔔', class: 'icon-default' };
        if (type.includes('JOINED')) return { icon: '👋', class: 'icon-info' };
        if (type.includes('UPDATED')) return { icon: '🛡️', class: 'icon-warning' };
        if (type.includes('CREATED')) return { icon: '✨', class: 'icon-success' };
        if (type.includes('FAILED')) return { icon: '❌', class: 'icon-error' };
        return { icon: '🔔', class: 'icon-default' };
    };

    return (
        <div className="notification-wrapper" ref={dropdownRef}>
            <div className="notification-bell" onClick={toggleDropdown}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </div>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h4>Notifications</h4>
                    </div>
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="notification-empty">Aucune notification</div>
                        ) : (
                            notifications.map(notif => {
                                const style = getNotificationStyle(notif.type);
                                return (
                                <div 
                                    key={notif.id} 
                                    className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    <div className={`notification-icon-wrapper ${style.class}`}>
                                        {style.icon}
                                    </div>
                                    <div className="notification-content">
                                        <div className="notification-message">{notif.message}</div>
                                        <div className="notification-time">
                                            {new Date(notif.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    {!notif.read && <div className="notification-dot"></div>}
                                </div>
                            )})
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
