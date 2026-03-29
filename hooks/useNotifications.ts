import { useState, useEffect } from "react";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    //Subscribe to notifications
  }, []);

  return { notifications };
};
