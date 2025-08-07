import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User, Crown, Users } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  onToggleMode: () => void;
  isLogin: boolean;
}

export const LoginForm = ({ onToggleMode, isLogin }: LoginFormProps) => {
  const { login, register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'listener'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password, formData.role);
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  const roleOptions = [
    {
      value: 'listener',
      label: 'Public Listener',
      description: 'Listen to proceedings only',
      subtext: 'No speaking or voting rights - View-only access',
      icon: Users,
      color: 'text-parliament-blue'
    },
    {
      value: 'member',
      label: 'Parliament Member',
      description: 'Request to speak and participate',
      subtext: 'Can request to speak, chat, and vote on motions',
      icon: User,
      color: 'text-parliament-green'
    },
    {
      value: 'speaker',
      label: 'Speaker/Chair',
      description: 'Full session management control',
      subtext: 'Create sessions, manage speakers, control proceedings',
      icon: Crown,
      color: 'text-parliament-gold'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-parliament flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-glow bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-parliament-purple">
              Parliament Session
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Join the digital parliamentary platform
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required={!isLogin}
                  className="transition-all duration-200 focus:shadow-card"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="transition-all duration-200 focus:shadow-card"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="transition-all duration-200 focus:shadow-card"
              />
            </div>

            {!isLogin && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Select Your Role</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  className="space-y-3"
                >
                  {roleOptions.map((option) => (
                    <div key={option.value} className="flex items-start space-x-3">
                      <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor={option.value}
                          className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                        >
                          <option.icon className={`w-4 h-4 ${option.color}`} />
                          {option.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                        <p className="text-xs text-muted-foreground/80">
                          {option.subtext}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className={cn(buttonVariants({ variant: 'parliament', size: 'lg' }), "w-full")}
            >
              {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Join Parliament Session')}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <Button
              variant="ghost"
              onClick={onToggleMode}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Sign in"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Digital Parliament System v1.0<br />
              Republic of The Gambia
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};