import { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'teacher' | 'coordinator' | 'director' | 'program_director' | 'institutional_admin' | 'sysadmin' | 'parent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  status: 'active' | 'inactive';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, remember: boolean) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Teacher A',
    email: 'teacher@melue.org',
    role: 'teacher',
    phone: '555-0101',
    status: 'active',
  },
  {
    id: '2',
    name: 'Coordinator A',
    email: 'coordinator@melue.org',
    role: 'coordinator',
    phone: '555-0102',
    status: 'active',
  },
  {
    id: '3',
    name: 'Director A',
    email: 'director@melue.org',
    role: 'director',
    phone: '555-0103',
    status: 'active',
  },
  {
    id: '7',
    name: 'Program Director A',
    email: 'programdirector@melue.org',
    role: 'program_director',
    phone: '555-0107',
    status: 'active',
  },
  {
    id: '4',
    name: 'Admin A',
    email: 'admin@melue.org',
    role: 'institutional_admin',
    phone: '555-0104',
    status: 'active',
  },
  {
    id: '5',
    name: 'Sys Admin',
    email: 'sysadmin@melue.org',
    role: 'sysadmin',
    phone: '555-0105',
    status: 'active',
  },
  {
    id: '6',
    name: 'Parent A',
    email: 'parent@melue.org',
    role: 'parent',
    phone: '555-0106',
    status: 'active',
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string, remember: boolean): Promise<boolean> => {
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      if (remember) {
        localStorage.setItem('rememberedUser', JSON.stringify(foundUser));
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rememberedUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
