import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const pushNotification = useCallback((notification) => {
        const id = notification.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const newNotification = {
            id,
            title: notification.title || 'Notification',
            message: notification.message || '',
            type: notification.type || 'info',
            duration: notification.duration === undefined ? null : notification.duration,
        };

        setNotifications((prev) => [...prev, newNotification]);

        if (newNotification.duration && newNotification.duration > 0) {
            window.setTimeout(() => {
                setNotifications((prev) => prev.filter((item) => item.id !== id));
            }, newNotification.duration);
        }
    }, []);

    const dismissNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, pushNotification, dismissNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
