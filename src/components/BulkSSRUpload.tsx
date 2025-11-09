import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Loader2, Download } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface BulkSSRUploadProps {
  onSuccess: () => void;
}

export default function BulkSSRUpload({ onSuccess }: BulkSSRUploadProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<'ssr_only' | 'ssr_with_assets'>('ssr_with_assets');
  const [csvContent, setCsvContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!csvContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please upload a CSV file or paste CSV data',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('process-ssr-csv', {
        body: { csvData: csvContent, mode }
      });

      if (error) throw error;

      setResults(data);
      
      if (data.errors.length === 0) {
        toast({
          title: 'Success',
          description: `Created ${data.ssrsCreated} SSRs${mode === 'ssr_with_assets' ? ` and ${data.assetsCreated} assets` : ''}`
        });
        onSuccess();
        setCsvContent('');
      } else {
        toast({
          title: 'Partial Success',
          description: `Created ${data.ssrsCreated} SSRs but encountered ${data.errors.length} errors`,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = mode === 'ssr_with_assets'
      ? 'delivery_team,title,first_name,last_name,email,phone,role_type,status,asset_nsn,asset_code,asset_designation,asset_type,asset_short_name\n'
      + 'Team Alpha,Mr,John,Doe,john.doe@mod.gov.uk,123-456-7890,Safety Officer,active,2320-99-123-4567,A001,Challenger 2,A Vehicles,CH2\n'
      + 'Team Beta,Ms,Jane,Smith,jane.smith@mod.gov.uk,098-765-4321,Transport Manager,active,2320-99-765-4321,B002,Foxhound,B Vehicles,FOX'
      : 'delivery_team,title,first_name,last_name,email,phone,role_type,status\n'
      + 'Team Alpha,Mr,John,Doe,john.doe@mod.gov.uk,123-456-7890,Safety Officer,active\n'
      + 'Team Beta,Ms,Jane,Smith,jane.smith@mod.gov.uk,098-765-4321,Transport Manager,active';

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ssr_template_${mode}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Bulk SSR Upload</h2>
      
      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">Upload Mode</Label>
          <RadioGroup value={mode} onValueChange={(v: any) => setMode(v)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ssr_with_assets" id="with-assets" />
              <Label htmlFor="with-assets">SSRs with Assets (Combined CSV)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ssr_only" id="ssr-only" />
              <Label htmlFor="ssr-only">SSRs Only</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Button
            type="button"
            variant="outline"
            onClick={downloadTemplate}
            className="mb-2"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>
        </div>

        <div>
          <Label>Upload CSV File</Label>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90"
            />
          </div>
        </div>

        <div>
          <Label>Or Paste CSV Data</Label>
          <Textarea
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            rows={10}
            placeholder="Paste CSV content here..."
            className="font-mono text-sm mt-2"
          />
        </div>

        <Button onClick={handleUpload} disabled={uploading} className="w-full">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload and Process
            </>
          )}
        </Button>

        {results && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Results:</h3>
            <p>✓ SSRs Created: {results.ssrsCreated}</p>
            {mode === 'ssr_with_assets' && (
              <p>✓ Assets Created: {results.assetsCreated}</p>
            )}
            {results.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-destructive font-semibold">Errors:</p>
                <ul className="list-disc list-inside text-sm">
                  {results.errors.slice(0, 10).map((error: string, i: number) => (
                    <li key={i}>{error}</li>
                  ))}
                  {results.errors.length > 10 && (
                    <li>... and {results.errors.length - 10} more errors</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
