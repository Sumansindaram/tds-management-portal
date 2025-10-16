import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

export default function AdminDetail() {
  const { id } = useParams();
  const { role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (id && (role === 'admin' || role === 'super_admin')) {
      loadEntry();
    }
  }, [id, role]);

  const loadEntry = async () => {
    try {
      const { data, error } = await supabase
        .from('tds_entries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setEntry(data);
    } catch (error) {
      console.error('Error loading entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to load entry details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!entry) return;

    if ((newStatus === 'Rejected' || newStatus === 'Returned') && !comment.trim()) {
      toast({
        title: 'Comment Required',
        description: `Please provide a comment for ${newStatus} status`,
        variant: 'destructive',
      });
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('tds_entries')
        .update({
          status: newStatus,
          admin_comment: comment || null,
        })
        .eq('id', entry.id);

      if (error) throw error;

      // Call edge function to send email
      await supabase.functions.invoke('send-tds-notification', {
        body: {
          email: entry.ssr_email,
          name: entry.ssr_name,
          reference: entry.reference,
          status: newStatus,
          comment: comment,
        },
      });

      toast({
        title: 'Success',
        description: `Status updated to ${newStatus}`,
      });

      navigate('/admin');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Entry not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const fields = [
    { label: 'Reference', value: entry.reference },
    { label: 'Status', value: entry.status },
    { label: 'SSR Name', value: entry.ssr_name },
    { label: 'SSR Email', value: entry.ssr_email },
    { label: 'Designation', value: entry.designation },
    { label: 'NSN', value: entry.nsn },
    { label: 'Asset Code', value: entry.asset_code },
    { label: 'Short Name', value: entry.short_name },
    { label: 'Length', value: entry.length },
    { label: 'Width', value: entry.width },
    { label: 'Height', value: entry.height },
    { label: 'Unladen Weight', value: entry.unladen_weight },
    { label: 'Laden Weight', value: entry.laden_weight },
    { label: 'ALEST', value: entry.alest },
    { label: 'LIMS 2.5', value: entry.lims_25 },
    { label: 'LIMS 2.8', value: entry.lims_28 },
    { label: 'Out of Service Date', value: entry.out_of_service_date },
    { label: 'MLC', value: entry.mlc },
    { label: 'Service', value: entry.service },
    { label: 'Owner Nation', value: entry.owner_nation },
    { label: 'RIC Code', value: entry.ric_code },
    { label: 'Asset Type', value: entry.asset_type },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-primary">Request Details</CardTitle>
            <Badge variant="outline" className="text-lg">
              {entry.reference}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {fields.map(field => (
                <div key={field.label} className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">{field.label}</p>
                  <p className="text-base">{field.value || '—'}</p>
                </div>
              ))}
            </div>

            {entry.admin_comment && (
              <div className="rounded-lg bg-muted p-4">
                <p className="mb-1 text-sm font-semibold">Previous Admin Comment:</p>
                <p className="text-sm">{entry.admin_comment}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="comment">Admin Comment</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter your comments here..."
                rows={4}
              />
            </div>

            <div className="flex flex-wrap gap-3 border-t pt-6">
              <Button
                onClick={() => updateStatus('Approved')}
                disabled={updating}
                className="bg-success hover:bg-success/90"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                onClick={() => updateStatus('Rejected')}
                disabled={updating}
                variant="destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={() => updateStatus('Returned')}
                disabled={updating}
                className="bg-warning hover:bg-warning/90"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Return
              </Button>
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}