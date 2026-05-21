/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getApiBase, getToken } from '../api/axiosConfig';

export function useSocket(enabled = true) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!enabled || !token) return undefined;

    const base = getApiBase();
    const s = io(base, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [enabled]);

  return socket;
}
