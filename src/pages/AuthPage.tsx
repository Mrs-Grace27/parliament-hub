import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => setIsLogin(!isLogin);

  return <LoginForm onToggleMode={toggleMode} isLogin={isLogin} />;
};

export default AuthPage;