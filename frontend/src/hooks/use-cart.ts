import { useState, useEffect } from 'react';
import { getCartCount } from '@/services/api';

export const useCart = () => {
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    return !!token;
  };

  const fetchCartCount = async () => {
    if (!checkAuthStatus()) {
      setCartCount(0);
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    try {
      setIsLoggedIn(true);
      const response = await getCartCount();
      setCartCount(response.data.count || 0);
    } catch (error: any) {
      console.error('Failed to fetch cart count:', error);
      if (error.response?.status === 401) {
        // Token is invalid, clear it
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setCartCount(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshCartCount = () => {
    if (checkAuthStatus()) {
      fetchCartCount();
    } else {
      setCartCount(0);
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, []);

  // Listen for storage changes (when user logs in/out in another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      fetchCartCount();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    cartCount,
    isLoggedIn,
    loading,
    refreshCartCount,
  };
};
