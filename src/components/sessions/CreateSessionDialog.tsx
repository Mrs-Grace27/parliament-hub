import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Users, Lock, Globe } from 'lucide-react';
import { roomsApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CreateSessionDialogProps {
  onSessionCreated?: () => void;
}

export const CreateSessionDialog = ({ onSessionCreated }: CreateSessionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Session name is required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await roomsApi.createRoom(formData.name, formData.description, formData.isPrivate);
      
      toast({
        title: "Success",
        description: "Parliament session created successfully",
        variant: "default"
      });

      setFormData({ name: '', description: '', isPrivate: false });
      setOpen(false);
      onSessionCreated?.();
    } catch (error: any) {
      console.error('Failed to create session:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create session",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={cn(buttonVariants({ variant: 'parliament' }))}>
          <Plus className="w-4 h-4 mr-2" />
          Create Session
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-parliament rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            Create New Parliament Session
          </DialogTitle>
          <DialogDescription>
            Set up a new parliamentary session for debates, motions, and voting.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session-name" className="text-sm font-medium">
                Session Name *
              </Label>
              <Input
                id="session-name"
                placeholder="e.g., Budget Review Session 2024"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="transition-all duration-200 focus:shadow-card"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="session-description"
                placeholder="Describe the purpose and agenda of this session..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="transition-all duration-200 focus:shadow-card min-h-[80px]"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  formData.isPrivate ? "bg-warning/10" : "bg-success/10"
                )}>
                  {formData.isPrivate ? (
                    <Lock className="w-5 h-5 text-warning" />
                  ) : (
                    <Globe className="w-5 h-5 text-success" />
                  )}
                </div>
                <div>
                  <Label htmlFor="private-session" className="text-sm font-medium">
                    {formData.isPrivate ? 'Private Session' : 'Public Session'}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {formData.isPrivate 
                      ? 'Only invited participants can join' 
                      : 'Open to all registered members'
                    }
                  </p>
                </div>
              </div>
              <Switch
                id="private-session"
                checked={formData.isPrivate}
                onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: checked })}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className={cn(buttonVariants({ variant: 'parliament' }))}
            >
              {loading ? 'Creating...' : 'Create Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};