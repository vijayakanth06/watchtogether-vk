import { useEffect } from 'react';
import { onValue, off } from 'firebase/database';

export const useFirebaseListener = (ref, callback) => {
  useEffect(() => {
    const listener = onValue(ref, (snapshot) => {
      callback(snapshot);
    });

    return () => {
      off(ref, listener);
    };
  }, [ref, callback]);
};