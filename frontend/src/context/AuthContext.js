import React, { createContext, useState, useContext, useEffect } from "react";
import { firebaseAuth } from "../services/firebase";
import { authAPI } from "../services/api";
import socketService from "../services/socket";

const AuthContext = createContext();

// Export useAuth hook
export const useAuth = () => {
  return useContext(AuthContext);
};

// Export AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password, role = null, name = null) => {
    setLoading(true);
    try {
      const firebaseResult = await firebaseAuth.login(email, password);
      
      if (!firebaseResult.success) {
        return firebaseResult;
      }

      localStorage.setItem("token", firebaseResult.token);
      localStorage.setItem("firebaseUid", firebaseResult.user.uid);

      const userData = {
        email: firebaseResult.user.email,
        name: name || firebaseResult.user.displayName || firebaseResult.user.email.split('@')[0],
      };

      // Include role if provided (for registration)
      if (role) {
        userData.role = role;
      }

      const backendResult = await authAPI.register(userData);

      if (backendResult.success) {
        const user = backendResult.data;
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
        
        // Connect to Socket.IO
        socketService.connect(user);
        
        return { success: true, data: user };
      } else {
        throw new Error(backendResult.error || "Backend registration failed");
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseAuth.logout();
    } catch (error) {
      // Silent error handling
    }
    
    // Disconnect from Socket.IO
    socketService.disconnect();
    
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("firebaseUid");
  };

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem("token", token);
          localStorage.setItem("firebaseUid", firebaseUser.uid);

          // Get user from backend
          const backendResult = await authAPI.getMe();
          if (backendResult.success) {
            const userData = backendResult.data;
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
            
            // Connect to Socket.IO
            socketService.connect(userData);
          }
        } catch (error) {
          socketService.disconnect();
          setUser(null);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          localStorage.removeItem("firebaseUid");
        }
      } else {
        socketService.disconnect();
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("firebaseUid");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
