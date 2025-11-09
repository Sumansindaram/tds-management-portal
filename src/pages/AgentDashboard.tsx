import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Search, FileText, Mail, Calculator, Users, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AgentDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tdsQuery, setTdsQuery] = useState('');
  const [tdsSearching, setTdsSearching] = useState(false);
  const [tdsResults, setTdsResults] = useState<any>(null);
  const [emailContent, setEmailContent] = useState('');
  const [emailGenerating, setEmailGenerating] = useState(false);
  const [emailReply, setEmailReply] = useState('');
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '', weight: '' });
  const [cofgData, setCofgData] = useState({ weight: '', distance: '' });
  const [cofgResult, setCofgResult] = useState<string>('');

  const handleTDSSearch = async () => {
    if (!tdsQuery.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a search query',
        variant: 'destructive'
      });
      return;
    }

    setTdsSearching(true);
    setTdsResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-tds-search', {
        body: { query: tdsQuery }
      });

      if (error) throw error;

      setTdsResults(data);
      toast({
        title: 'Search Complete',
        description: `Found ${data.results.length} matching entries`
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setTdsSearching(false);
    }
  };

  const handleFallbackTDS = () => {
    const { length, width, height, weight } = dimensions;
    if (!length || !width || !height || !weight) {
      toast({
        title: 'Error',
        description: 'Please fill in all dimensions',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Fallback TDS Generator',
      description: `Dimensions: ${length}x${width}x${height}mm, Weight: ${weight}kg`
    });
  };

  const handleEmailReply = async () => {
    if (!emailContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please paste email content',
        variant: 'destructive'
      });
      return;
    }

    setEmailGenerating(true);
    setEmailReply('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-email-reply', {
        body: { emailContent }
      });

      if (error) throw error;

      setEmailReply(data.reply);
      toast({
        title: 'Reply Generated',
        description: 'Email reply has been generated successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setEmailGenerating(false);
    }
  };

  const handleCofGCalculation = () => {
    const { weight, distance } = cofgData;
    if (!weight || !distance) {
      toast({
        title: 'Error',
        description: 'Please enter weight and distance',
        variant: 'destructive'
      });
      return;
    }

    const w = parseFloat(weight);
    const d = parseFloat(distance);
    const moment = w * d;
    const result = `Center of Gravity Calculation:\n\nWeight: ${w} kg\nDistance from Reference: ${d} m\nMoment: ${moment.toFixed(2)} kg⋅m`;
    
    setCofgResult(result);
    toast({
      title: 'Calculation Complete',
      description: `Moment: ${moment.toFixed(2)} kg⋅m`
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6 lg:p-8">
        <Card className="p-6">
          <h1 className="text-3xl font-bold text-foreground mb-6">AI Agent Dashboard</h1>
          
          <Tabs defaultValue="tds" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="tds">
                <Search className="h-4 w-4 mr-2" />
                TDS Search
              </TabsTrigger>
              <TabsTrigger value="fallback">
                <FileText className="h-4 w-4 mr-2" />
                Fallback TDS
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="h-4 w-4 mr-2" />
                Email Reply
              </TabsTrigger>
              <TabsTrigger value="cofg">
                <Calculator className="h-4 w-4 mr-2" />
                CofG Calculator
              </TabsTrigger>
              <TabsTrigger value="safety">
                <Users className="h-4 w-4 mr-2" />
                Safety Directory
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tds" className="space-y-4">
              <h2 className="text-xl font-semibold">TDS Search</h2>
              <p className="text-muted-foreground">AI-powered search for vehicle transportation data sheets</p>
              <Input
                placeholder="Enter vehicle name, NSN, or designation (e.g., Challenger, Foxhound)"
                value={tdsQuery}
                onChange={(e) => setTdsQuery(e.target.value)}
              />
              <Button onClick={handleTDSSearch} disabled={tdsSearching}>
                {tdsSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </Button>

              {tdsResults && (
                <div className="mt-4 space-y-4">
                  <Card className="p-4 bg-muted">
                    <h3 className="font-semibold mb-2">AI Summary</h3>
                    <p className="whitespace-pre-wrap">{tdsResults.aiSummary}</p>
                  </Card>

                  {tdsResults.results.length > 0 && (
                    <Card className="p-4">
                      <h3 className="font-semibold mb-2">Matching Entries</h3>
                      <div className="space-y-2">
                        {tdsResults.results.map((entry: any, i: number) => (
                          <div key={i} className="border-b pb-2">
                            <p><strong>Reference:</strong> {entry.reference}</p>
                            <p><strong>Designation:</strong> {entry.designation}</p>
                            <p><strong>NSN:</strong> {entry.nsn}</p>
                            <p><strong>Status:</strong> {entry.status}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="fallback" className="space-y-4">
              <h2 className="text-xl font-semibold">Fallback TDS Generator</h2>
              <p className="text-muted-foreground">Generate TDS from vehicle dimensions</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Length (mm)</label>
                  <Input
                    type="number"
                    value={dimensions.length}
                    onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Width (mm)</label>
                  <Input
                    type="number"
                    value={dimensions.width}
                    onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Height (mm)</label>
                  <Input
                    type="number"
                    value={dimensions.height}
                    onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Weight (kg)</label>
                  <Input
                    type="number"
                    value={dimensions.weight}
                    onChange={(e) => setDimensions({ ...dimensions, weight: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleFallbackTDS}>Generate TDS</Button>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <h2 className="text-xl font-semibold">Email Reply Assistant</h2>
              <p className="text-muted-foreground">AI-powered professional email response generator</p>
              <Textarea
                placeholder="Paste received email content here..."
                rows={8}
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
              />
              <Button onClick={handleEmailReply} disabled={emailGenerating}>
                {emailGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Reply'
                )}
              </Button>

              {emailReply && (
                <Card className="p-4 bg-muted mt-4">
                  <h3 className="font-semibold mb-2">Generated Reply</h3>
                  <div className="whitespace-pre-wrap">{emailReply}</div>
                  <Button 
                    className="mt-4" 
                    onClick={() => {
                      navigator.clipboard.writeText(emailReply);
                      toast({ title: 'Copied', description: 'Reply copied to clipboard' });
                    }}
                  >
                    Copy to Clipboard
                  </Button>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="cofg" className="space-y-4">
              <h2 className="text-xl font-semibold">Center of Gravity Calculator</h2>
              <p className="text-muted-foreground">Calculate vehicle center of gravity moments</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Weight (kg)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 62500"
                    value={cofgData.weight}
                    onChange={(e) => setCofgData({ ...cofgData, weight: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Distance from Reference (m)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 3.5"
                    value={cofgData.distance}
                    onChange={(e) => setCofgData({ ...cofgData, distance: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleCofGCalculation}>Calculate</Button>

              {cofgResult && (
                <Card className="p-4 bg-muted mt-4">
                  <h3 className="font-semibold mb-2">Calculation Result</h3>
                  <pre className="whitespace-pre-wrap font-mono text-sm">{cofgResult}</pre>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="safety" className="space-y-4">
              <h2 className="text-xl font-semibold">Safety Leadership Directory</h2>
              <p className="text-muted-foreground">Manage safety responsible roles across delivery teams</p>
              <Button onClick={() => navigate('/ssr-directory')}>Open SSR Directory</Button>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <Button variant="default" onClick={() => navigate('/')}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
