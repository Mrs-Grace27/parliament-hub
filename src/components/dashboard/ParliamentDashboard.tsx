import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Crown, LogOut, Users, Gavel, Clock, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { CreateSessionDialog } from '@/components/sessions/CreateSessionDialog';
import { SessionView } from '@/components/sessions/SessionView';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { roomsApi, Room } from '@/services/api';
import { socketService } from '@/services/socket';
import { useToast } from '@/hooks/use-toast';

export const ParliamentDashboard = () => {
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRooms();
    
    // Check socket connection status
    const checkSocketConnection = () => {
      setSocketConnected(socketService.isConnected());
    };

    // Check initially and then periodically
    checkSocketConnection();
    const interval = setInterval(checkSocketConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadRooms = async () => {
    try {
      const response = await roomsApi.getRooms();
      setRooms(response.rooms);
    } catch (error: any) {
      console.error('Failed to load rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load parliament sessions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (roomId: string) => {
    try {
      await roomsApi.joinRoom(roomId);
      
      // Join socket room for real-time updates
      if (user && socketService.isConnected()) {
        socketService.joinRoom(roomId, user.id);
      }
      
      toast({
        title: "Success",
        description: "Joined session successfully",
        variant: "default"
      });
      
      // Navigate to session view
      setActiveSessionId(roomId);
    } catch (error: any) {
      console.error('Failed to join session:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to join session",
        variant: "destructive"
      });
    }
  };

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

  // Calculate stats
  const activeRooms = rooms.filter(room => room.isActive).length;
  const totalParticipants = rooms.reduce((sum, room) => sum + room.participants, 0);

  // Show session view if user has joined a session
  if (activeSessionId) {
    return (
      <SessionView 
        roomId={activeSessionId} 
        onLeave={() => {
          setActiveSessionId(null);
          loadRooms();
        }} 
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-card flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-parliament-purple mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Parliament Dashboard...</p>
        </div>
      </div>
    );
  }

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
              {/* Socket Connection Status */}
              <div className="flex items-center space-x-2">
                {socketConnected ? (
                  <Wifi className="w-4 h-4 text-success" />
                ) : (
                  <WifiOff className="w-4 h-4 text-destructive" />
                )}
                <span className={cn(
                  "text-xs",
                  socketConnected ? "text-success" : "text-destructive"
                )}>
                  {socketConnected ? "Connected" : "Disconnected"}
                </span>
              </div>

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
                  Active
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
                  <p className="text-3xl font-bold text-foreground">{activeRooms}</p>
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
                  <p className="text-3xl font-bold text-foreground">{totalParticipants}</p>
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
            <CreateSessionDialog onSessionCreated={loadRooms} />
          )}
        </div>

        {rooms.length > 0 ? (
          <div className="grid gap-4">
            {rooms.map((room) => (
              <Card key={room.id} className="shadow-card hover:shadow-parliament transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-medium text-foreground">{room.name}</h4>
                        <Badge className={getStatusColor(room.isActive ? 'active' : 'pending')} variant="secondary">
                          {room.isActive ? 'Active' : 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{room.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {room.participants} participants
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(room.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button 
                      className={cn(buttonVariants({ variant: room.isActive ? 'parliament' : 'vote' }))}
                      onClick={() => handleJoinSession(room.id)}
                    >
                      {room.isActive ? 'Join Session' : 'View Details'}
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
                <CreateSessionDialog onSessionCreated={loadRooms} />
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};