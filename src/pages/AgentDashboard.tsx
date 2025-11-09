import { useState } from 'react';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Search, FileText, Mail, Calculator, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AgentDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tdsQuery, setTdsQuery] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '', weight: '' });
  const [cofgData, setCofgData] = useState({ weight: '', distance: '' });

  const handleTDSSearch = () => {
    toast({
      title: 'TDS Search',
      description: `Searching for: ${tdsQuery}`
    });
  };

  const handleFallbackTDS = () => {
    toast({
      title: 'Fallback TDS Generator',
      description: `Dimensions: ${dimensions.length}x${dimensions.width}x${dimensions.height}mm, Weight: ${dimensions.weight}kg`
    });
  };

  const handleEmailReply = () => {
    toast({
      title: 'Email Reply Assistant',
      description: 'Generating reply...'
    });
  };

  const handleCofGCalculation = () => {
    toast({
      title: 'CofG Calculator',
      description: `Calculating with Weight: ${cofgData.weight}kg, Distance: ${cofgData.distance}m`
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
              <p className="text-muted-foreground">Search for vehicle transportation data sheets</p>
              <Input
                placeholder="Enter vehicle name (e.g., Challenger)"
                value={tdsQuery}
                onChange={(e) => setTdsQuery(e.target.value)}
              />
              <Button onClick={handleTDSSearch}>Search</Button>
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
              <p className="text-muted-foreground">Generate professional email responses</p>
              <Textarea
                placeholder="Paste received email content here..."
                rows={8}
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
              />
              <Button onClick={handleEmailReply}>Generate Reply</Button>
            </TabsContent>

            <TabsContent value="cofg" className="space-y-4">
              <h2 className="text-xl font-semibold">Center of Gravity Calculator</h2>
              <p className="text-muted-foreground">Calculate vehicle center of gravity</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Weight (kg)</label>
                  <Input
                    type="number"
                    value={cofgData.weight}
                    onChange={(e) => setCofgData({ ...cofgData, weight: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Distance from Reference (m)</label>
                  <Input
                    type="number"
                    value={cofgData.distance}
                    onChange={(e) => setCofgData({ ...cofgData, distance: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleCofGCalculation}>Calculate</Button>
            </TabsContent>

            <TabsContent value="safety" className="space-y-4">
              <h2 className="text-xl font-semibold">Safety Leadership Directory</h2>
              <p className="text-muted-foreground">Manage safety responsible roles across delivery teams</p>
              <Button onClick={() => navigate('/ssr-directory')}>Open SSR Directory</Button>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <Button variant="outline" onClick={() => navigate('/')}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
