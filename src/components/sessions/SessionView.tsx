import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Crown, 
  Users, 
  Mic, 
  MicOff, 
  Send, 
  ThumbsUp, 
  ThumbsDown, 
  Minus,
  ArrowLeft,
  Clock,
  Vote,
  Plus,
  Play,
  Square
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { roomsApi, motionsApi, Room, Motion } from '@/services/api';
import { socketService } from '@/services/socket';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface SessionViewProps {
  roomId: string;
  onLeave: () => void;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

interface SpeakingRequest {
  userId: string;
  userName: string;
  timestamp: string;
}

export const SessionView = ({ roomId, onLeave }: SessionViewProps) => {
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [motions, setMotions] = useState<Motion[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [speakingQueue, setSpeakingQueue] = useState<SpeakingRequest[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasRequestedToSpeak, setHasRequestedToSpeak] = useState(false);
  const [createMotionOpen, setCreateMotionOpen] = useState(false);
  const [motionForm, setMotionForm] = useState({ title: '', description: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadRoomData();
    setupSocketListeners();
    
    // Join the room socket
    if (user) {
      socketService.joinRoom(roomId, user.id);
    }

    return () => {
      // Leave the room socket when component unmounts
      if (user) {
        socketService.leaveRoom(roomId, user.id);
      }
      cleanupSocketListeners();
    };
  }, [roomId, user]);

  const loadRoomData = async () => {
    try {
      const [roomResponse, motionsResponse] = await Promise.all([
        roomsApi.getRoom(roomId),
        motionsApi.getMotions({ roomId })
      ]);
      
      setRoom(roomResponse.room);
      setMotions(motionsResponse.motions);
    } catch (error: any) {
      console.error('Failed to load room data:', error);
      toast({
        title: "Error",
        description: "Failed to load session data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.onNewMessage((data) => {
      setMessages(prev => [...prev, {
        id: data.messageId,
        userId: data.userId,
        userName: data.userName,
        message: data.message,
        timestamp: data.timestamp
      }]);
    });

    socketService.onSpeakRequest((data) => {
      setSpeakingQueue(prev => [...prev, {
        userId: data.userId,
        userName: data.userName,
        timestamp: new Date().toISOString()
      }]);
    });

    socketService.onVoteCast((data) => {
      setMotions(prev => prev.map(motion => 
        motion.id === data.motionId 
          ? { ...motion, votes: data.totalVotes }
          : motion
      ));
    });

    socketService.onMotionStatusChanged((data) => {
      setMotions(prev => prev.map(motion =>
        motion.id === data.motionId
          ? { ...motion, status: data.newStatus as Motion['status'] }
          : motion
      ));
    });

    socketService.onUserJoined((data) => {
      toast({
        title: "User Joined",
        description: `${data.userName} joined the session`,
        variant: "default"
      });
    });

    socketService.onUserLeft((data) => {
      toast({
        title: "User Left",
        description: `${data.userName} left the session`,
        variant: "default"
      });
    });
  };

  const cleanupSocketListeners = () => {
    socketService.off('new-message');
    socketService.off('speak-request');
    socketService.off('vote-cast');
    socketService.off('motion-status-changed');
    socketService.off('user-joined');
    socketService.off('user-left');
  };

  const sendMessage = () => {
    if (!currentMessage.trim() || !user) return;

    socketService.sendMessage(roomId, currentMessage, user.id);
    setCurrentMessage('');
  };

  const requestToSpeak = () => {
    if (!user) return;
    
    socketService.requestToSpeak(roomId, user.id);
    setHasRequestedToSpeak(true);
    
    toast({
      title: "Speaking Request Sent",
      description: "Your request to speak has been added to the queue",
      variant: "default"
    });
  };

  const handleVote = async (motionId: string, vote: 'for' | 'against' | 'abstain') => {
    if (!user) return;

    try {
      await motionsApi.voteOnMotion(motionId, vote);
      socketService.castVote(motionId, vote, user.id);
      
      toast({
        title: "Vote Cast",
        description: `Your vote "${vote}" has been recorded`,
        variant: "default"
      });
    } catch (error: any) {
      console.error('Failed to vote:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to cast vote",
        variant: "destructive"
      });
    }
  };

  const createMotion = async () => {
    if (!motionForm.title.trim() || !user) return;

    try {
      await motionsApi.createMotion(motionForm.title, motionForm.description, roomId);
      setMotionForm({ title: '', description: '' });
      setCreateMotionOpen(false);
      loadRoomData(); // Reload to get new motion
      
      toast({
        title: "Motion Created",
        description: "New motion has been submitted successfully",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Failed to create motion:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create motion",
        variant: "destructive"
      });
    }
  };

  const startVoting = async (motionId: string) => {
    try {
      await motionsApi.startVoting(motionId);
      loadRoomData();
      
      toast({
        title: "Voting Started",
        description: "Voting phase has begun for this motion",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Failed to start voting:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to start voting",
        variant: "destructive"
      });
    }
  };

  const endVoting = async (motionId: string) => {
    try {
      await motionsApi.endVoting(motionId);
      loadRoomData();
      
      toast({
        title: "Voting Ended",
        description: "Voting phase has concluded for this motion",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Failed to end voting:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to end voting",
        variant: "destructive"
      });
    }
  };

  const getVoteColor = (vote: 'for' | 'against' | 'abstain') => {
    switch (vote) {
      case 'for': return 'bg-success text-success-foreground';
      case 'against': return 'bg-destructive text-destructive-foreground';
      case 'abstain': return 'bg-warning text-warning-foreground';
    }
  };

  const getMotionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-parliament-blue text-white';
      case 'voting': return 'bg-parliament-purple text-white';
      case 'closed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-card flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-parliament-purple mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Session...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-card flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Session Not Found</h3>
            <p className="text-muted-foreground mb-4">This session may have been deleted or you don't have access.</p>
            <Button onClick={onLeave}>Return to Dashboard</Button>
          </CardContent>
        </Card>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={onLeave}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div>
                <h1 className="text-lg font-bold text-parliament-purple">{room.name}</h1>
                <p className="text-xs text-muted-foreground">{room.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-success/10 text-success">
                <Users className="w-3 h-3 mr-1" />
                {room.participants} participants
              </Badge>
              
              <Avatar>
                <AvatarFallback className="bg-parliament-purple text-white">
                  {user?.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Motions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Active Motions</h2>
              {(user?.role === 'speaker' || user?.role === 'member') && (
                <Dialog open={createMotionOpen} onOpenChange={setCreateMotionOpen}>
                  <DialogTrigger asChild>
                    <Button className={cn(buttonVariants({ variant: 'parliament', size: 'sm' }))}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Motion
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Motion</DialogTitle>
                      <DialogDescription>
                        Submit a new motion for debate and voting.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Motion title..."
                        value={motionForm.title}
                        onChange={(e) => setMotionForm({ ...motionForm, title: e.target.value })}
                      />
                      <Textarea
                        placeholder="Motion description and details..."
                        value={motionForm.description}
                        onChange={(e) => setMotionForm({ ...motionForm, description: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateMotionOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createMotion} disabled={!motionForm.title.trim()}>
                        Create Motion
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {motions.length > 0 ? (
              <div className="space-y-4">
                {motions.map((motion) => (
                  <Card key={motion.id} className="shadow-card">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{motion.title}</CardTitle>
                          <CardDescription className="mt-2">{motion.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getMotionStatusColor(motion.status)}>
                            {motion.status}
                          </Badge>
                          {user?.role === 'speaker' && (
                            <div className="flex gap-1">
                              {motion.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startVoting(motion.id)}
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Start Vote
                                </Button>
                              )}
                              {motion.status === 'voting' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => endVoting(motion.id)}
                                >
                                  <Square className="w-3 h-3 mr-1" />
                                  End Vote
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    {motion.status === 'voting' && (
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-success/10 rounded-lg">
                              <div className="text-2xl font-bold text-success">{motion.votes.for}</div>
                              <div className="text-sm text-muted-foreground">For</div>
                            </div>
                            <div className="p-3 bg-destructive/10 rounded-lg">
                              <div className="text-2xl font-bold text-destructive">{motion.votes.against}</div>
                              <div className="text-sm text-muted-foreground">Against</div>
                            </div>
                            <div className="p-3 bg-warning/10 rounded-lg">
                              <div className="text-2xl font-bold text-warning">{motion.votes.abstain}</div>
                              <div className="text-sm text-muted-foreground">Abstain</div>
                            </div>
                          </div>
                          
                          {(user?.role === 'member' || user?.role === 'speaker') && (
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                className={cn(buttonVariants({ variant: 'success' }))}
                                onClick={() => handleVote(motion.id, 'for')}
                              >
                                <ThumbsUp className="w-4 h-4 mr-1" />
                                For
                              </Button>
                              <Button
                                size="sm"
                                className={cn(buttonVariants({ variant: 'destructive' }))}
                                onClick={() => handleVote(motion.id, 'against')}
                              >
                                <ThumbsDown className="w-4 h-4 mr-1" />
                                Against
                              </Button>
                              <Button
                                size="sm"
                                className={cn(buttonVariants({ variant: 'warning' }))}
                                onClick={() => handleVote(motion.id, 'abstain')}
                              >
                                <Minus className="w-4 h-4 mr-1" />
                                Abstain
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="shadow-card">
                <CardContent className="p-8 text-center">
                  <Vote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Motions</h3>
                  <p className="text-muted-foreground">There are currently no motions for this session.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Chat & Speaking Queue */}
          <div className="space-y-6">
            {/* Speaking Queue */}
            {user?.role === 'speaker' && speakingQueue.length > 0 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Speaking Queue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {speakingQueue.map((request, index) => (
                    <div key={`${request.userId}-${request.timestamp}`} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="text-sm">{request.userName}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                          Deny
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Request to Speak */}
            {user?.role === 'member' && (
              <Card className="shadow-card">
                <CardContent className="p-4">
                  <Button
                    className="w-full"
                    variant={hasRequestedToSpeak ? "outline" : "parliament"}
                    onClick={requestToSpeak}
                    disabled={hasRequestedToSpeak}
                  >
                    {hasRequestedToSpeak ? (
                      <>
                        <MicOff className="w-4 h-4 mr-2" />
                        Request Pending
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Request to Speak
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Chat */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Session Chat</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-64 p-4">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div key={message.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{message.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm bg-muted/30 rounded-lg p-2">{message.message}</p>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No messages yet. Start the conversation!
                      </p>
                    )}
                  </div>
                </ScrollArea>
                
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={sendMessage}
                      disabled={!currentMessage.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};