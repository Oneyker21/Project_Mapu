import { useState, useEffect } from 'react';
import { onSnapshot, query, collection, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../database/FirebaseConfig.js';

export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notificaciones'),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notificationsData = [];
        let unread = 0;

        snapshot.forEach((doc) => {
          const notification = {
            id: doc.id,
            ...doc.data()
          };
          notificationsData.push(notification);
          if (!notification.read) {
            unread++;
          }
        });

        setNotifications(notificationsData);
        setUnreadCount(unread);
        setLoading(false);
      },
      (error) => {
        console.error('Error obteniendo notificaciones en tiempo real:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading
  };
};
