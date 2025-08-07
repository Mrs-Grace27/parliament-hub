import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Crown, LogOut, Plus, Users, Gavel, Clock, AlertTriangle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SessionData {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'ended';
  participants: number;
  startTime: string;
}

export const ParliamentDashboard = () => {
  const { user, logout } = useAuth();
  const [sessions] = useState<SessionData[]>([
    {
      id: '1',
      name: 'Budget Review Session',
      status: 'active',
      participants: 15,
      startTime: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'Policy Discussion',
      status: 'pending',
      participants: 8,
      startTime: '2024-01-15T14:00:00Z'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'ended': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'speaker': return Crown;
      case 'member': return Gavel;
      default: return Users;
    }
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'speaker': return 'text-parliament-gold';
      case 'member': return 'text-parliament-green';
      default: return 'text-parliament-blue';
    }
  };

  const RoleIcon = getRoleIcon();

  const speakerPrivileges = user?.role === 'speaker' ? [
    'Create and manage parliament sessions',
    'Control speaker queue (FIFO order)',
    'Approve/deny speaking requests',
    'Manage session timing and agenda',
    'Moderate chat and maintain order'
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-card">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-parliament rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-parliament-purple">Parliament System</h1>
                <p className="text-xs text-muted-foreground">Republic of The Gambia</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-parliament-purple text-white">
                    {user?.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-muted-foreground capitalize">{user?.role}</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Parliament Dashboard
          </h2>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! Role: <span className="font-medium capitalize">{user?.role}</span>
          </p>
        </div>

        {/* Role Privileges Card */}
        {user?.role === 'speaker' && (
          <Card className="mb-8 border-l-4 border-l-parliament-gold shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-parliament-gold" />
                Speaker/Chair Privileges
                <Badge className="bg-parliament-gold text-white">
                  Me In Use
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {speakerPrivileges.map((privilege, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1 h-1 bg-parliament-gold rounded-full mt-2 flex-shrink-0" />
                    <span>{privilege}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                  <p className="text-3xl font-bold text-foreground">1</p>
                </div>
                <div className="w-12 h-12 bg-parliament-blue/10 rounded-lg flex items-center justify-center">
                  <Gavel className="w-6 h-6 text-parliament-blue" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
                  <p className="text-3xl font-bold text-foreground">23</p>
                </div>
                <div className="w-12 h-12 bg-parliament-green/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-parliament-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Your Role</p>
                  <p className="text-xl font-bold text-foreground capitalize">{user?.role}</p>
                </div>
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", 
                  user?.role === 'speaker' ? 'bg-parliament-gold/10' : 
                  user?.role === 'member' ? 'bg-parliament-green/10' : 'bg-parliament-blue/10'
                )}>
                  <RoleIcon className={cn("w-6 h-6", getRoleColor())} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Section */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-foreground">Parliament Sessions</h3>
          {(user?.role === 'speaker' || user?.role === 'admin') && (
            <Button className={cn(buttonVariants({ variant: 'parliament' }))}>
              <Plus className="w-4 h-4 mr-2" />
              Create Session
            </Button>
          )}
        </div>

        {sessions.length > 0 ? (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <Card key={session.id} className="shadow-card hover:shadow-parliament transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-medium text-foreground">{session.name}</h4>
                        <Badge className={getStatusColor(session.status)} variant="secondary">
                          {session.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {session.participants} participants
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(session.startTime).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <Button className={cn(buttonVariants({ variant: 'vote' }))}>
                      {session.status === 'active' ? 'Join Session' : 'View Details'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-medium text-foreground mb-2">No Active Sessions</h4>
              <p className="text-muted-foreground mb-6">
                Create a new parliament session to get started.
              </p>
              {(user?.role === 'speaker' || user?.role === 'admin') && (
                <Button className={cn(buttonVariants({ variant: 'parliament' }))}>
                  Create Your First Session
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};