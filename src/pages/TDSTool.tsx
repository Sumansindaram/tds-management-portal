import { useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Calculator, Box, FileText, Info, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Item {
  name: string;
  mass: string;
  x: string;
  y: string;
  z: string;
}

interface LashingRow {
  direction: 'Forward' | 'Rearward' | 'Lateral';
  mode: 'manual' | 'auto';
  count: number;
  lcDaN: number | null;
  angleDeg: number;
  anglePreset?: 'low' | 'typical' | 'steep';
  strapPreset?: 'light' | 'medium' | 'heavy';
  // Computed outputs
  requiredForceDaN?: number;
  strapCapacityPerStrapDaN?: number;
  requiredCount?: number;
  totalCapacityDaN?: number;
  pass?: boolean;
  message?: string;
  swlWarning?: string;
}

interface HistoryEntry {
  timestamp: string;
  result: any;
  type: 'cog' | 'restraint' | 'container';
}

export default function TDSTool() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // CoG State
  const [items, setItems] = useState<Item[]>([]);
  const [cogResult, setCogResult] = useState({ totalMass: '0', x: '–', y: '–', z: '–' });
  const [axle1Mass, setAxle1Mass] = useState('');
  const [axle1X, setAxle1X] = useState('');
  const [axle2Mass, setAxle2Mass] = useState('');
  const [axle2X, setAxle2X] = useState('');
  const [cogHistory, setCogHistory] = useState<HistoryEntry[]>([]);

  // Restraint State - Initialize with Defence defaults
  const [calculatorMode, setCalculatorMode] = useState<'standard' | 'field'>('standard');
  const [designMass, setDesignMass] = useState('');
  const [grav, setGrav] = useState('9.81');
  const [mu, setMu] = useState('0.00');
  const [af, setAf] = useState('0.80');
  const [ar, setAr] = useState('0.50');
  const [al, setAl] = useState('0.50');
  const [anchorSWL, setAnchorSWL] = useState('');
  const [swlKnown, setSwlKnown] = useState<'known' | 'unknown'>('unknown');
  const [sfF, setSfF] = useState('1.00');
  const [sfR, setSfR] = useState('1.00');
  const [sfL, setSfL] = useState('1.00');
  const [anchorMargin, setAnchorMargin] = useState('1.00');
  const [lashingRows, setLashingRows] = useState<LashingRow[]>([
    { direction: 'Forward', mode: 'auto', count: 0, lcDaN: 2000, angleDeg: 30, anglePreset: 'typical', strapPreset: 'medium' },
    { direction: 'Rearward', mode: 'auto', count: 0, lcDaN: 2000, angleDeg: 30, anglePreset: 'typical', strapPreset: 'medium' },
    { direction: 'Lateral', mode: 'auto', count: 0, lcDaN: 2000, angleDeg: 30, anglePreset: 'typical', strapPreset: 'medium' }
  ]);
  const [restraintResults, setRestraintResults] = useState<LashingRow[]>([]);
  const [restraintHistory, setRestraintHistory] = useState<HistoryEntry[]>([]);

  // Container State
  const [containerPreset, setContainerPreset] = useState('20std');
  const [allowRotation, setAllowRotation] = useState('Yes');
  const [assetL, setAssetL] = useState('');
  const [assetW, setAssetW] = useState('');
  const [assetH, setAssetH] = useState('');
  const [contMass, setContMass] = useState('');
  const [payloadLimit, setPayloadLimit] = useState('');
  const [fitResult, setFitResult] = useState('');
  const [containerHistory, setContainerHistory] = useState<HistoryEntry[]>([]);

  // Helper functions
  const toN = (val: string | number, unit: string) => {
    const v = parseFloat(val.toString() || '0');
    if (unit === 'N') return v;
    if (unit === 'kN') return v * 1000;
    if (unit === 'daN') return v * 10;
    return v;
  };

  const fmt = (n: number) => Number.isFinite(n) ? n.toFixed(2) : '–';

  // Angle preset mapping
  const getAngleFromPreset = (preset: string): number => {
    switch (preset) {
      case 'low': return 20;
      case 'typical': return 30;
      case 'steep': return 45;
      default: return 30;
    }
  };

  // Strap preset mapping
  const getStrapFromPreset = (preset: string): number => {
    switch (preset) {
      case 'light': return 1000;
      case 'medium': return 2000;
      case 'heavy': return 4000;
      default: return 2000;
    }
  };

  // CoG Functions
  const addItem = () => {
    setItems([...items, { name: '', mass: '', x: '', y: '', z: '' }]);
  };

  const deleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    updateTotalRow(newItems);
  };

  const updateItem = (index: number, field: keyof Item, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
    updateTotalRow(newItems);
  };

  const updateTotalRow = (itemsList = items) => {
    let mt = 0, sx = 0, sy = 0, sz = 0;
    itemsList.forEach((item) => {
      const m = parseFloat(item.mass) || 0;
      const x = parseFloat(item.x) || 0;
      const y = parseFloat(item.y) || 0;
      const z = parseFloat(item.z) || 0;
      mt += m;
      sx += m * x;
      sy += m * y;
      sz += m * z;
    });
    
    setCogResult({
      totalMass: fmt(mt),
      x: mt ? fmt(sx / mt) : '–',
      y: mt ? fmt(sy / mt) : '–',
      z: mt ? fmt(sz / mt) : '–'
    });
  };

  const calcCoG = () => {
    if (items.length === 0) {
      toast({
        title: 'No Items',
        description: 'Please add items before calculating',
        variant: 'destructive'
      });
      return;
    }
    
    const historyEntry: HistoryEntry = {
      timestamp: new Date().toLocaleString(),
      result: cogResult,
      type: 'cog'
    };
    setCogHistory([historyEntry, ...cogHistory].slice(0, 10));
    
    toast({
      title: 'CoG Calculated',
      description: `Centre of Gravity: x=${cogResult.x}m, y=${cogResult.y}m, z=${cogResult.z}m`
    });
  };
  
  const clearAllCog = () => {
    setItems([]);
    setCogResult({ totalMass: '0', x: '–', y: '–', z: '–' });
    setAxle1Mass('');
    setAxle1X('');
    setAxle2Mass('');
    setAxle2X('');
  };

  const presetAxles = () => {
    const m1 = parseFloat(axle1Mass) || 0;
    const x1 = parseFloat(axle1X) || 0;
    const m2 = parseFloat(axle2Mass) || 0;
    const x2 = parseFloat(axle2X) || 0;
    const newItems = [
      { name: 'Axle 1', mass: m1.toString(), x: x1.toString(), y: '0', z: '0' },
      { name: 'Axle 2', mass: m2.toString(), x: x2.toString(), y: '0', z: '0' }
    ];
    setItems(newItems);
    updateTotalRow(newItems);
  };

  // Restraint Functions
  const updateLashingRow = (direction: 'Forward' | 'Rearward' | 'Lateral', field: keyof LashingRow, value: any) => {
    setLashingRows(rows => rows.map(row => {
      if (row.direction !== direction) return row;
      
      const updatedRow = { ...row, [field]: value };
      
      // If angle preset changed, update angleDeg
      if (field === 'anglePreset') {
        updatedRow.angleDeg = getAngleFromPreset(value);
      }
      // If strap preset changed, update lcDaN
      if (field === 'strapPreset') {
        updatedRow.lcDaN = getStrapFromPreset(value);
      }
      
      return updatedRow;
    }));
  };

  const resetLashingInputs = () => {
    // Only reset input fields, NOT results or history
    setLashingRows([
      { direction: 'Forward', mode: 'auto', count: 0, lcDaN: 2000, angleDeg: 30, anglePreset: 'typical', strapPreset: 'medium' },
      { direction: 'Rearward', mode: 'auto', count: 0, lcDaN: 2000, angleDeg: 30, anglePreset: 'typical', strapPreset: 'medium' },
      { direction: 'Lateral', mode: 'auto', count: 0, lcDaN: 2000, angleDeg: 30, anglePreset: 'typical', strapPreset: 'medium' }
    ]);
    setDesignMass('');
    setAnchorSWL('');
    setSwlKnown('unknown');
  };

  const starterPlan = () => {
    setLashingRows([
      { direction: 'Forward', mode: 'manual', count: 4, lcDaN: 2000, angleDeg: 20, anglePreset: 'low', strapPreset: 'medium' },
      { direction: 'Rearward', mode: 'manual', count: 2, lcDaN: 4000, angleDeg: 10, anglePreset: 'low', strapPreset: 'heavy' },
      { direction: 'Lateral', mode: 'manual', count: 4, lcDaN: 2000, angleDeg: 30, anglePreset: 'typical', strapPreset: 'medium' }
    ]);
  };

  const presetDef = () => {
    setMu('0.00');
    setAf('0.80');
    setAr('0.50');
    setAl('0.50');
  };

  const switchToFieldMode = () => {
    setCalculatorMode('field');
    // Apply Defence presets automatically
    setMu('0.00');
    setAf('0.80');
    setAr('0.50');
    setAl('0.50');
    setSwlKnown('unknown');
    // Set all rows to auto mode with presets
    setLashingRows(rows => rows.map(row => ({
      ...row,
      mode: 'auto' as const,
      anglePreset: 'typical' as const,
      strapPreset: 'medium' as const,
      angleDeg: 30,
      lcDaN: 2000
    })));
  };

  const switchToStandardMode = () => {
    setCalculatorMode('standard');
  };

  const calculateLashings = (): LashingRow[] => {
    const weightKg = parseFloat(designMass) || 0;
    const gMs2 = parseFloat(grav) || 9.81;
    const accelForwardG = parseFloat(af) || 0.80;
    const accelRearwardG = parseFloat(ar) || 0.50;
    const accelLateralG = parseFloat(al) || 0.50;
    const sfForward = parseFloat(sfF) || 1;
    const sfRearward = parseFloat(sfR) || 1;
    const sfLateral = parseFloat(sfL) || 1;
    const anchorSwlDaN = swlKnown === 'known' ? (parseFloat(anchorSWL) || 0) : null;
    const anchorMarg = parseFloat(anchorMargin) || 1;

    const weightN = weightKg * gMs2;

    const accelByDir: Record<string, { accel: number; sf: number }> = {
      Forward: { accel: accelForwardG, sf: sfForward },
      Rearward: { accel: accelRearwardG, sf: sfRearward },
      Lateral: { accel: accelLateralG, sf: sfLateral }
    };

    return lashingRows.map((row) => {
      const { accel, sf } = accelByDir[row.direction];
      const FreqN = weightN * accel * sf;
      const requiredForceDaN = FreqN / 10;

      if (!row.lcDaN || !row.angleDeg) {
        return {
          ...row,
          pass: false,
          requiredForceDaN,
          message: 'Enter strap rating (LC) and angle.'
        };
      }

      const angleRad = (row.angleDeg * Math.PI) / 180;
      const strapCapacityPerStrapN = row.lcDaN * 10 * Math.cos(angleRad);
      const strapCapacityPerStrapDaN = strapCapacityPerStrapN / 10;

      if (strapCapacityPerStrapN <= 0) {
        return {
          ...row,
          pass: false,
          requiredForceDaN,
          strapCapacityPerStrapDaN,
          message: 'Strap angle invalid; capacity becomes zero.'
        };
      }

      let requiredCount: number;
      let totalCapacityN: number;
      let totalCapacityDaN: number;
      let countUsed: number;

      if (row.mode === 'auto') {
        requiredCount = Math.ceil(FreqN / strapCapacityPerStrapN);
        countUsed = requiredCount;
        totalCapacityN = strapCapacityPerStrapN * requiredCount;
        totalCapacityDaN = totalCapacityN / 10;
      } else {
        countUsed = Math.max(0, row.count || 0);
        totalCapacityN = strapCapacityPerStrapN * countUsed;
        totalCapacityDaN = totalCapacityN / 10;
        requiredCount = Math.ceil(FreqN / strapCapacityPerStrapN);
      }

      let pass = totalCapacityN >= FreqN;
      let message = '';
      let swlWarning = '';

      // Anchor SWL check
      if (anchorSwlDaN && anchorSwlDaN > 0 && countUsed > 0) {
        const perStrapLoadDaN = requiredForceDaN / countUsed;
        const maxPerStrapDaN = anchorSwlDaN * anchorMarg;
        if (perStrapLoadDaN > maxPerStrapDaN) {
          pass = false;
          message += `Anchor SWL exceeded: each strap would see ~${perStrapLoadDaN.toFixed(0)} daN but max allowed is ${maxPerStrapDaN.toFixed(0)} daN. `;
        } else {
          swlWarning = `Anchor SWL check: each strap ≈ ${perStrapLoadDaN.toFixed(0)} daN, limit = ${anchorSwlDaN.toFixed(0)} daN → OK.`;
        }
      } else if (swlKnown === 'unknown' || !anchorSwlDaN) {
        swlWarning = 'NOTE: Anchor SWL NOT CHECKED – tie-down point strength unknown. This strap count satisfies Defence g-forces assuming the lashing points are strong enough. Confirm platform SWL from vehicle data / TDS.';
      }

      if (row.mode === 'auto') {
        if (pass) {
          message += `Required straps: ${requiredCount} × ${row.lcDaN} daN @ ${row.angleDeg}°.`;
        } else {
          message += `Required straps (for force only): ${requiredCount} × ${row.lcDaN} daN @ ${row.angleDeg}°, but anchor/capacity checks failed.`;
        }
      } else {
        if (pass) {
          message += `PASS with ${countUsed} × ${row.lcDaN} daN @ ${row.angleDeg}°. Minimum required straps for force only would be ${requiredCount}.`;
        } else {
          const deficitN = FreqN - totalCapacityN;
          const extraNeeded = Math.ceil(deficitN / strapCapacityPerStrapN);
          message += `FAIL: need approximately ${extraNeeded} more ${row.lcDaN} daN straps at ${row.angleDeg}° (total required ≈ ${requiredCount}).`;
        }
      }

      return {
        ...row,
        requiredForceDaN,
        strapCapacityPerStrapDaN,
        requiredCount,
        totalCapacityDaN,
        count: row.mode === 'auto' ? requiredCount : countUsed,
        pass,
        message,
        swlWarning
      };
    });
  };

  const calcRestraint = () => {
    const m = parseFloat(designMass) || 0;
    if (m === 0) {
      toast({
        title: 'Error',
        description: 'Please enter Transportation Weight',
        variant: 'destructive'
      });
      return;
    }

    const results = calculateLashings();
    setRestraintResults(results);
    
    const historyEntry: HistoryEntry = {
      timestamp: new Date().toLocaleString(),
      result: { results, designMass: m, lashingRows },
      type: 'restraint'
    };
    setRestraintHistory([historyEntry, ...restraintHistory].slice(0, 10));
    
    toast({
      title: 'Restraint Calculated',
      description: 'Check results below for each direction'
    });
  };

  // Container Functions
  const getContainerDimensions = () => {
    if (containerPreset === '20std') {
      return { Lint: 5.90, Wint: 2.35, Hint: 2.39, Wdoor: 2.34, Hdoor: 2.28, payload: 30480 };
    } else if (containerPreset === '20hc') {
      return { Lint: 5.90, Wint: 2.35, Hint: 2.69, Wdoor: 2.34, Hdoor: 2.58, payload: 30480 };
    }
    return { Lint: 5.90, Wint: 2.35, Hint: 2.39, Wdoor: 2.34, Hdoor: 2.28, payload: 0 };
  };

  const checkFit = () => {
    const { Lint, Wint, Hint, Wdoor, Hdoor, payload: defaultPayload } = getContainerDimensions();
    const La = parseFloat(assetL) || 0;
    const Wa = parseFloat(assetW) || 0;
    const Ha = parseFloat(assetH) || 0;
    const m = parseFloat(contMass) || 0;
    const payload = parseFloat(payloadLimit) || defaultPayload;

    const orientations = [
      { name: 'Normal (L×W×H)', dims: [La, Wa, Ha], desc: 'length first' },
      { name: 'Rotated 90° (W×L×H)', dims: [Wa, La, Ha], desc: 'width first' },
      { name: 'On end (H×W×L)', dims: [Ha, Wa, La], desc: 'standing upright' }
    ];

    const tries = allowRotation === 'Yes' ? orientations : [orientations[0]];
    let passedOrientation = null;
    const failReasons: string[] = [];

    tries.forEach((o) => {
      const [L, W, H] = o.dims;
      const doorPass = W <= Wdoor && H <= Hdoor;
      const internalFit = L <= Lint && W <= Wint && H <= Hint;
      
      if (!passedOrientation && doorPass && internalFit) {
        passedOrientation = o;
      } else if (!passedOrientation) {
        const reasons = [];
        if (!doorPass) {
          const doorDiff = Math.max(W - Wdoor, H - Hdoor);
          reasons.push(`Cannot fit through door (${doorDiff > 0 ? `exceeds by ${doorDiff.toFixed(2)}m` : 'too large'})`);
        }
        if (!internalFit) {
          const sizeDiffs = [
            L > Lint ? `length exceeds by ${(L - Lint).toFixed(2)}m` : null,
            W > Wint ? `width exceeds by ${(W - Wint).toFixed(2)}m` : null,
            H > Hint ? `height exceeds by ${(H - Hint).toFixed(2)}m` : null
          ].filter(Boolean);
          reasons.push(`Internal space: ${sizeDiffs.join(', ')}`);
        }
        failReasons.push(`${o.name}:\n  • ${reasons.join('\n  • ')}`);
      }
    });

    const payloadOK = (payload && m) ? (m <= payload) : true;
    
    if (passedOrientation) {
      const weightNote = payloadOK 
        ? `Weight: ${m.toFixed(0)} kg (within ${payload.toFixed(0)} kg limit) ✓` 
        : `⚠️ WARNING: Weight ${m.toFixed(0)} kg exceeds payload limit ${payload.toFixed(0)} kg by ${(m - payload).toFixed(0)} kg`;
      
      setFitResult(
        `✓ PASS - Equipment Fits!\n\n` +
        `Orientation: ${passedOrientation.name} (${passedOrientation.desc})\n\n` +
        `✓ Fits through door opening (${Wdoor}m × ${Hdoor}m)\n` +
        `✓ Fits inside container (${Lint}m × ${Wint}m × ${Hint}m)\n` +
        `${weightNote}\n\n` +
        `This orientation will work for loading into the container.`
      );
    } else {
      let reason = '';
      if (allowRotation === 'No') {
        const [L, W, H] = [La, Wa, Ha];
        const doorFail = W > Wdoor || H > Hdoor;
        const internalFail = L > Lint || W > Wint || H > Hint;
        
        if (doorFail && internalFail) {
          reason = `❌ Equipment dimensions are TOO LARGE for this container:\n\n`;
          reason += `Your equipment: ${L.toFixed(2)}m (L) × ${W.toFixed(2)}m (W) × ${H.toFixed(2)}m (H)\n\n`;
          if (W > Wdoor || H > Hdoor) {
            reason += `Door opening: ${Wdoor}m (W) × ${Hdoor}m (H) - Equipment won't fit through\n`;
          }
          if (L > Lint || W > Wint || H > Hint) {
            reason += `Internal space: ${Lint}m (L) × ${Wint}m (W) × ${Hint}m (H) - Equipment too large\n`;
          }
          reason += `\n💡 TRY: Enable "Allow rotation" to test other orientations, or use a larger container.`;
        } else {
          reason = 'With rotation disabled, the equipment in its normal orientation is too large.\n\n' +
                   '💡 TRY: Enable "Allow rotation" to check if turning it sideways or on end might work.';
        }
      } else {
        reason = `❌ FAIL - Equipment does not fit in any orientation:\n\n` +
                 `Your equipment: ${La.toFixed(2)}m (L) × ${Wa.toFixed(2)}m (W) × ${Ha.toFixed(2)}m (H)\n` +
                 `Container: ${Lint}m (L) × ${Wint}m (W) × ${Hint}m (H) internal\n` +
                 `Door: ${Wdoor}m (W) × ${Hdoor}m (H)\n\n` +
                 `Tried orientations:\n${failReasons.join('\n\n')}\n\n` +
                 `💡 SOLUTION: You will need a larger container:\n` +
                 `   • 40 ft ISO container (12m length)\n` +
                 `   • High Cube container (2.69m height)\n` +
                 `   • Or consider alternative transport method`;
      }
      
      setFitResult(`✗ FAIL\n\n${reason}`);
    }
    
    const historyEntry: HistoryEntry = {
      timestamp: new Date().toLocaleString(),
      result: { fitResult: passedOrientation ? 'PASS' : 'FAIL', dimensions: { L: La, W: Wa, H: Ha }, mass: m },
      type: 'container'
    };
    setContainerHistory([historyEntry, ...containerHistory].slice(0, 10));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6 lg:p-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-3xl text-card-foreground">JSP 800 Vol 7 — TDS Tool</CardTitle>
            <CardDescription>Transportation Data Sheet Planning Tool</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="search" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-gray-200">
                <TabsTrigger value="search" className="data-[state=active]:bg-ribbon data-[state=active]:text-white text-gray-900">
                  <Search className="h-4 w-4 mr-2" />
                  TDS Search
                </TabsTrigger>
                <TabsTrigger value="cog" className="data-[state=active]:bg-ribbon data-[state=active]:text-white text-gray-900">
                  <Calculator className="h-4 w-4 mr-2" />
                  Centre of Gravity
                </TabsTrigger>
                <TabsTrigger value="restraint" className="data-[state=active]:bg-ribbon data-[state=active]:text-white text-gray-900">
                  <Box className="h-4 w-4 mr-2" />
                  Restraint System
                </TabsTrigger>
                <TabsTrigger value="container" className="data-[state=active]:bg-ribbon data-[state=active]:text-white text-gray-900">
                  <Box className="h-4 w-4 mr-2" />
                  Container Fit
                </TabsTrigger>
                <TabsTrigger value="guidance" className="data-[state=active]:bg-ribbon data-[state=active]:text-white text-gray-900">
                  <Info className="h-4 w-4 mr-2" />
                  Guidance
                </TabsTrigger>
              </TabsList>

              {/* TDS Search */}
              <TabsContent value="search" className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-card-foreground">TDS Database Search</CardTitle>
                    <CardDescription>Open the official TDS search page in a new tab to perform advanced queries.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={() => window.open('https://tiedown.desdigital.mod.uk/search', '_blank')}
                      variant="default"
                    >
                      Open TDS Search
                    </Button>
                    <p className="text-sm text-foreground/70">
                      Tip: Use Asset Code, Designation, NSN or RIC; refine with Status, Asset Types and Transportation Types.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Centre of Gravity */}
              <TabsContent value="cog" className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Centre of Gravity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={addItem} variant="default">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                      <Button onClick={presetAxles} className="bg-ribbon hover:bg-ribbon/90 text-white">
                        Use Axle Masses
                      </Button>
                      <Button onClick={clearAllCog} className="bg-ribbon hover:bg-ribbon/90 text-white">
                        Clear Items
                      </Button>
                      <Button onClick={calcCoG} variant="default">
                        Calculate CoG
                      </Button>
                    </div>

                    {cogResult.x !== '–' && (
                      <div className="bg-green-50 border-2 border-green-400 p-4 rounded-md">
                        <h3 className="font-bold text-green-900 text-lg mb-2">Current Centre of Gravity Result</h3>
                        <div className="text-green-900 font-semibold">
                          <p>Total Mass: {cogResult.totalMass} kg</p>
                          <p>CoG Position: x = {cogResult.x}m, y = {cogResult.y}m, z = {cogResult.z}m</p>
                        </div>
                        <p className="text-sm text-green-800 mt-2">Click "Calculate CoG" button to save this result to history.</p>
                      </div>
                    )}

                    <div className="rounded-md border border-border">
                      <Table>
                        <TableHeader className="bg-gray-200">
                          <TableRow>
                            <TableHead className="text-gray-900 font-semibold">Name</TableHead>
                            <TableHead className="text-gray-900 font-semibold">Mass (kg)</TableHead>
                            <TableHead className="text-gray-900 font-semibold">x (m)</TableHead>
                            <TableHead className="text-gray-900 font-semibold">y (m)</TableHead>
                            <TableHead className="text-gray-900 font-semibold">z (m)</TableHead>
                            <TableHead className="text-gray-900 font-semibold">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <Input
                                  value={item.name}
                                  onChange={(e) => updateItem(i, 'name', e.target.value)}
                                  placeholder="Item name"
                                  className="bg-white text-gray-900 border-border"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.mass}
                                  onChange={(e) => updateItem(i, 'mass', e.target.value)}
                                  placeholder="kg"
                                  className="bg-white text-gray-900 border-border"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.x}
                                  onChange={(e) => updateItem(i, 'x', e.target.value)}
                                  placeholder="x m"
                                  className="bg-white text-gray-900 border-border"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.y}
                                  onChange={(e) => updateItem(i, 'y', e.target.value)}
                                  placeholder="y m"
                                  className="bg-white text-gray-900 border-border"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.z}
                                  onChange={(e) => updateItem(i, 'z', e.target.value)}
                                  placeholder="z m"
                                  className="bg-white text-gray-900 border-border"
                                />
                              </TableCell>
                              <TableCell>
                                <Button onClick={() => deleteItem(i)} size="sm" className="bg-ribbon hover:bg-ribbon/90 text-white">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-gray-200 font-bold">
                            <TableCell className="text-gray-900">Total</TableCell>
                            <TableCell className="text-gray-900">{cogResult.totalMass}</TableCell>
                            <TableCell className="text-gray-900">{cogResult.x}</TableCell>
                            <TableCell className="text-gray-900">{cogResult.y}</TableCell>
                            <TableCell className="text-gray-900">{cogResult.z}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    <div className="bg-blue-50 border-2 border-blue-400 p-4 rounded-md mb-4">
                      <p className="font-bold text-blue-900 mb-2">Quick Method: Using Axle Masses</p>
                      <p className="text-gray-900 text-sm mb-3">
                        If you know the weight on each axle, this provides a faster way to calculate CofG for vehicles. 
                        Example: A 10,000 kg vehicle with front axle at 0m carrying 4,500 kg and rear axle at 3.5m carrying 5,500 kg.
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-900">Front Axle Mass (kg)</label>
                        <Input
                          type="number"
                          value={axle1Mass}
                          onChange={(e) => setAxle1Mass(e.target.value)}
                          placeholder="e.g., 4500"
                          className="bg-white text-gray-900 border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900">Front Axle X (m)</label>
                        <Input
                          type="number"
                          value={axle1X}
                          onChange={(e) => setAxle1X(e.target.value)}
                          placeholder="e.g., 0.00"
                          step="0.01"
                          className="bg-white text-gray-900 border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900">Rear Axle Mass (kg)</label>
                        <Input
                          type="number"
                          value={axle2Mass}
                          onChange={(e) => setAxle2Mass(e.target.value)}
                          placeholder="e.g., 5500"
                          className="bg-white text-gray-900 border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900">Rear Axle X (m)</label>
                        <Input
                          type="number"
                          value={axle2X}
                          onChange={(e) => setAxle2X(e.target.value)}
                          placeholder="e.g., 3.50"
                          step="0.01"
                          className="bg-white text-gray-900 border-border"
                        />
                      </div>
                    </div>
                    
                    {cogHistory.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Calculation History</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {cogHistory.map((entry, idx) => (
                            <div key={idx} className="bg-gray-100 p-3 rounded border border-gray-300">
                              <p className="text-xs text-gray-600 mb-1">{entry.timestamp}</p>
                              <p className="text-sm text-gray-900 font-semibold">
                                CoG: x={entry.result.x}m, y={entry.result.y}m, z={entry.result.z}m | Mass: {entry.result.totalMass}kg
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Restraint System */}
              <TabsContent value="restraint" className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Restraint System (Direct lashings)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Mode Toggle */}
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-sm font-medium text-gray-900">Calculator Mode:</span>
                      <div className="flex">
                        <button
                          onClick={switchToStandardMode}
                          className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                            calculatorMode === 'standard'
                              ? 'bg-ribbon text-white border-ribbon'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          Standard
                        </button>
                        <button
                          onClick={switchToFieldMode}
                          className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-b border-r ${
                            calculatorMode === 'field'
                              ? 'bg-ribbon text-white border-ribbon'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          Field
                        </button>
                      </div>
                    </div>

                    {/* How to Use section */}
                    <div className="bg-blue-50 border-2 border-blue-400 p-4 rounded-md mb-4">
                      <p className="font-bold text-blue-900 mb-2">How to Use This Tool</p>
                      {calculatorMode === 'field' ? (
                        <>
                          <p className="text-gray-900 text-sm mb-2">
                            <strong>Field Mode:</strong> Simplified for soldiers in the field. Just enter the weight and select strap type - the tool tells you how many straps you need.
                          </p>
                          <p className="text-gray-900 text-sm">
                            Defence road-move settings are automatically applied (0.8g forward, 0.5g rear/lateral, zero friction).
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-900 text-sm mb-2">
                            <strong>Auto Mode:</strong> Enter strap rating and angle - the tool tells you exactly how many straps you need.
                          </p>
                          <p className="text-gray-900 text-sm mb-2">
                            <strong>Manual Mode:</strong> Enter your strap count to check if it's enough (PASS/FAIL).
                          </p>
                          <p className="text-gray-900 text-sm">
                            Defence values (0.8g forward, 0.5g rear/lateral, μ=0) are pre-loaded. Enter your load weight and click "Calculate".
                          </p>
                        </>
                      )}
                    </div>
                    
                    {/* Field Mode Info Banner */}
                    {calculatorMode === 'field' && (
                      <div className="bg-green-50 border-2 border-green-500 p-4 rounded-md">
                        <p className="text-green-900 font-semibold">
                          Field Mode is using Defence road-move settings: 0.8g forward, 0.5g rear/lateral, zero friction (μ = 0).
                        </p>
                      </div>
                    )}
                    
                    {/* Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {calculatorMode === 'standard' && (
                        <>
                          <Button onClick={presetDef} variant="secondary">Defence Preset (μ=0)</Button>
                          <Button onClick={starterPlan} className="bg-ribbon hover:bg-ribbon/90 text-white h-10">Starter Plan (Manual)</Button>
                        </>
                      )}
                      <Button onClick={resetLashingInputs} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground h-10">Reset Inputs</Button>
                    </div>

                    {/* Weight Input - Always visible */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-900">Transportation Weight (kg)</label>
                        <Input
                          type="number"
                          value={designMass}
                          onChange={(e) => setDesignMass(e.target.value)}
                          placeholder="e.g., 9500"
                          className="bg-white text-gray-900 border-border"
                        />
                      </div>
                      
                      {calculatorMode === 'standard' && (
                        <>
                          <div>
                            <label className="text-sm font-medium text-gray-900">g (m/s²)</label>
                            <Input
                              type="number"
                              value={grav}
                              onChange={(e) => setGrav(e.target.value)}
                              placeholder="9.81"
                              step="0.01"
                              className="bg-white text-gray-900 border-border"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-900">Friction μ</label>
                            <Input
                              type="number"
                              value={mu}
                              onChange={(e) => setMu(e.target.value)}
                              placeholder="Defence = 0.00"
                              step="0.01"
                              className="bg-white text-gray-900 border-border"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Standard Mode - Full controls */}
                    {calculatorMode === 'standard' && (
                      <>
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-900">Forward accel (g)</label>
                            <Input
                              type="number"
                              value={af}
                              onChange={(e) => setAf(e.target.value)}
                              placeholder="0.80"
                              step="0.01"
                              className="bg-white text-gray-900 border-border"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-900">Rearward accel (g)</label>
                            <Input
                              type="number"
                              value={ar}
                              onChange={(e) => setAr(e.target.value)}
                              placeholder="0.50"
                              step="0.01"
                              className="bg-white text-gray-900 border-border"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-900">Lateral accel (g)</label>
                            <Input
                              type="number"
                              value={al}
                              onChange={(e) => setAl(e.target.value)}
                              placeholder="0.50"
                              step="0.01"
                              className="bg-white text-gray-900 border-border"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-900">Anchor SWL (daN)</label>
                            <Input
                              type="number"
                              value={anchorSWL}
                              onChange={(e) => setAnchorSWL(e.target.value)}
                              placeholder="Optional"
                              className="bg-white text-gray-900 border-border"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-900">Safety × Forward</label>
                            <Input
                              type="number"
                              value={sfF}
                              onChange={(e) => setSfF(e.target.value)}
                              placeholder="1.00"
                              step="0.01"
                              className="bg-white text-gray-900 border-border"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-900">Safety × Rearward</label>
                            <Input
                              type="number"
                              value={sfR}
                              onChange={(e) => setSfR(e.target.value)}
                              placeholder="1.00"
                              step="0.01"
                              className="bg-white text-gray-900 border-border"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-900">Safety × Lateral</label>
                            <Input
                              type="number"
                              value={sfL}
                              onChange={(e) => setSfL(e.target.value)}
                              placeholder="1.00"
                              step="0.01"
                              className="bg-white text-gray-900 border-border"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-900">Anchor margin ×</label>
                            <Input
                              type="number"
                              value={anchorMargin}
                              onChange={(e) => setAnchorMargin(e.target.value)}
                              placeholder="1.00"
                              step="0.01"
                              className="bg-white text-gray-900 border-border"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Field Mode - SWL Control */}
                    {calculatorMode === 'field' && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                        <label className="text-sm font-medium text-gray-900 block mb-2">Anchor SWL (tie-down point strength)</label>
                        <div className="flex items-center gap-4 mb-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="swlKnown"
                              checked={swlKnown === 'unknown'}
                              onChange={() => setSwlKnown('unknown')}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-900">I do NOT know the SWL (default)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="swlKnown"
                              checked={swlKnown === 'known'}
                              onChange={() => setSwlKnown('known')}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-900">I know the SWL</span>
                          </label>
                        </div>
                        {swlKnown === 'known' && (
                          <Input
                            type="number"
                            value={anchorSWL}
                            onChange={(e) => setAnchorSWL(e.target.value)}
                            placeholder="Enter SWL in daN"
                            className="bg-white text-gray-900 border-border max-w-xs"
                          />
                        )}
                      </div>
                    )}

                    <h3 className="text-lg font-semibold text-gray-900 mt-6">Lashing Configuration by Direction</h3>
                    
                    <div className="space-y-4">
                      {lashingRows.map((row) => (
                        <div key={row.direction} className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-md font-bold text-gray-900">{row.direction}</h4>
                            {calculatorMode === 'standard' && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Mode:</span>
                                <button
                                  onClick={() => updateLashingRow(row.direction, 'mode', 'auto')}
                                  className={`px-3 py-1 text-sm rounded-l-md border ${
                                    row.mode === 'auto' 
                                      ? 'bg-ribbon text-white border-ribbon' 
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                  }`}
                                >
                                  Auto
                                </button>
                                <button
                                  onClick={() => updateLashingRow(row.direction, 'mode', 'manual')}
                                  className={`px-3 py-1 text-sm rounded-r-md border-t border-b border-r ${
                                    row.mode === 'manual' 
                                      ? 'bg-ribbon text-white border-ribbon' 
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                  }`}
                                >
                                  Manual
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <div className={`grid ${calculatorMode === 'field' ? 'grid-cols-2' : 'grid-cols-4'} gap-4`}>
                            {calculatorMode === 'standard' && row.mode === 'manual' && (
                              <div>
                                <label className="text-sm font-medium text-gray-900">Strap Count</label>
                                <Input
                                  type="number"
                                  value={row.count || ''}
                                  onChange={(e) => updateLashingRow(row.direction, 'count', parseInt(e.target.value) || 0)}
                                  placeholder="e.g., 4"
                                  min="0"
                                  className="bg-white text-gray-900 border-border"
                                />
                              </div>
                            )}
                            
                            {/* Strap Type/Rating */}
                            <div>
                              <label className="text-sm font-medium text-gray-900">
                                {calculatorMode === 'field' ? 'Strap Type' : 'Strap Rating (daN)'}
                              </label>
                              {calculatorMode === 'field' ? (
                                <Select 
                                  value={row.strapPreset || 'medium'} 
                                  onValueChange={(v) => updateLashingRow(row.direction, 'strapPreset', v)}
                                >
                                  <SelectTrigger className="bg-white text-gray-900 border-border">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white">
                                    <SelectItem value="light">Light (1,000 daN)</SelectItem>
                                    <SelectItem value="medium">Medium (2,000 daN)</SelectItem>
                                    <SelectItem value="heavy">Heavy (4,000 daN)</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Select 
                                  value={row.lcDaN?.toString() || ''} 
                                  onValueChange={(v) => updateLashingRow(row.direction, 'lcDaN', parseInt(v))}
                                >
                                  <SelectTrigger className="bg-white text-gray-900 border-border">
                                    <SelectValue placeholder="Select rating" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white">
                                    <SelectItem value="1000">1,000 daN (Light)</SelectItem>
                                    <SelectItem value="2000">2,000 daN (Standard)</SelectItem>
                                    <SelectItem value="4000">4,000 daN (Heavy)</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                            
                            {/* Angle */}
                            <div>
                              <label className="text-sm font-medium text-gray-900">
                                {calculatorMode === 'field' ? 'Angle Preset' : 'Angle (°)'}
                              </label>
                              {calculatorMode === 'field' ? (
                                <Select 
                                  value={row.anglePreset || 'typical'} 
                                  onValueChange={(v) => updateLashingRow(row.direction, 'anglePreset', v)}
                                >
                                  <SelectTrigger className="bg-white text-gray-900 border-border">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white">
                                    <SelectItem value="low">Low (~20°)</SelectItem>
                                    <SelectItem value="typical">Typical (~30°)</SelectItem>
                                    <SelectItem value="steep">Steep (~45°)</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  type="number"
                                  value={row.angleDeg || ''}
                                  onChange={(e) => updateLashingRow(row.direction, 'angleDeg', parseFloat(e.target.value) || 0)}
                                  placeholder="20-30 recommended"
                                  step="1"
                                  className="bg-white text-gray-900 border-border"
                                />
                              )}
                            </div>
                            
                            {calculatorMode === 'standard' && (
                              <div className="flex items-end">
                                <p className="text-xs text-gray-500">
                                  {row.mode === 'auto' 
                                    ? 'Auto calculates required strap count' 
                                    : 'Enter your strap count to check'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button onClick={calcRestraint} variant="default" size="lg">Calculate</Button>
                    </div>

                    {restraintResults.length > 0 && (
                      <>
                        <h3 className="text-lg font-semibold text-gray-900 mt-6">Results - Your Restraint Plan</h3>
                        
                        <div className="bg-red-50 border-2 border-red-600 p-4 rounded-md mb-4">
                          <p className="font-bold text-red-900 mb-2">⚠️ DEFENCE STANDARD (JSP 800 Vol 7):</p>
                          <p className="text-gray-900">
                            <strong>Zero Friction (μ=0)</strong> is assumed. Lashings must provide ALL restraint force. 
                            Do NOT rely on friction.
                          </p>
                        </div>

                        {restraintResults.map((r, i) => (
                          <Card key={i} className={`${r.pass ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600'} border-2`}>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xl font-bold text-gray-900">{r.direction} Direction</h4>
                                <span className={`text-2xl font-bold ${r.pass ? 'text-green-700' : 'text-red-700'}`}>
                                  {r.pass ? '✓ PASS' : '✗ FAIL'}
                                </span>
                              </div>

                              <div className="space-y-3 text-gray-900">
                                {/* Main Result Display */}
                                <div className={`p-4 rounded border-2 ${r.pass ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'}`}>
                                  <p className="text-lg font-bold mb-2">
                                    {r.mode === 'auto' ? 'Required Straps:' : 'Your Configuration:'}
                                  </p>
                                  <p className="text-3xl font-bold">
                                    {r.count} × {r.lcDaN} daN @ {r.angleDeg}°
                                  </p>
                                  <p className="text-sm mt-2 text-gray-700">{r.message}</p>
                                </div>

                                {/* Force details */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-white p-3 rounded border border-gray-300">
                                    <p className="text-sm mb-1">Force Required:</p>
                                    <p className="text-lg font-bold">{(r.requiredForceDaN || 0).toLocaleString()} daN</p>
                                  </div>
                                  <div className="bg-white p-3 rounded border border-gray-300">
                                    <p className="text-sm mb-1">Total Strap Capacity:</p>
                                    <p className="text-lg font-bold">{(r.totalCapacityDaN || 0).toLocaleString()} daN</p>
                                  </div>
                                </div>

                                {/* SWL Warning */}
                                {r.swlWarning && (
                                  <div className={`p-3 rounded border ${
                                    r.swlWarning.includes('NOT CHECKED') 
                                      ? 'bg-amber-50 border-amber-400' 
                                      : 'bg-blue-50 border-blue-300'
                                  }`}>
                                    <div className="flex items-start gap-2">
                                      {r.swlWarning.includes('NOT CHECKED') && (
                                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                      )}
                                      <p className={`text-sm ${r.swlWarning.includes('NOT CHECKED') ? 'text-amber-900' : 'text-blue-900'}`}>
                                        {r.swlWarning}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {r.mode === 'manual' && !r.pass && r.requiredCount && (
                                  <div className="bg-amber-100 border border-amber-400 p-3 rounded">
                                    <p className="font-bold text-amber-900">
                                      💡 Tip: You need at least {r.requiredCount} straps at this rating and angle.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        <div className="bg-amber-50 border-2 border-amber-600 p-4 rounded-md mt-4">
                          <p className="font-bold text-amber-900 mb-2">Standard Strap Ratings:</p>
                          <ul className="space-y-1 text-gray-900">
                            <li>• <strong>1,000 daN:</strong> Light duty (loads under 5,000 kg)</li>
                            <li>• <strong>2,000 daN:</strong> Standard (loads 5,000-15,000 kg)</li>
                            <li>• <strong>4,000 daN:</strong> Heavy duty (loads over 15,000 kg)</li>
                          </ul>
                        </div>

                        <div className="bg-blue-50 border border-blue-300 p-3 rounded mt-4">
                          <p className="font-semibold text-blue-900 mb-1">Lashing Angle Guide:</p>
                          <p className="text-sm text-gray-900">
                            Keep strap angles <strong>20-30°</strong> for best results. 
                            Lower angles give better restraint. Angles above 45° significantly reduce effectiveness.
                          </p>
                        </div>
                      </>
                    )}
                    
                    {/* History - Always visible, never cleared */}
                    {restraintHistory.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Calculation History</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {restraintHistory.map((entry, idx) => (
                            <div key={idx} className="bg-gray-100 p-3 rounded border border-gray-300">
                              <p className="text-xs text-gray-600 mb-1">{entry.timestamp}</p>
                              <p className="text-sm text-gray-900 font-semibold">
                                Mass: {entry.result.designMass}kg
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Container Fit */}
              <TabsContent value="container" className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Container Fit — 20 ft ISO by default</CardTitle>
                    <CardDescription>For non-20 ft ISO, pick Custom ISO to edit sizes.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-900">Container preset</label>
                        <Select value={containerPreset} onValueChange={setContainerPreset}>
                          <SelectTrigger className="bg-white text-gray-900 border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="20std">20 ft ISO (Standard)</SelectItem>
                            <SelectItem value="20hc">20 ft ISO (High Cube)</SelectItem>
                            <SelectItem value="custom">Custom ISO</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900">Allow rotation</label>
                        <Select value={allowRotation} onValueChange={setAllowRotation}>
                          <SelectTrigger className="bg-white text-gray-900 border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-900">Asset L (m)</label>
                        <Input
                          type="number"
                          value={assetL}
                          onChange={(e) => setAssetL(e.target.value)}
                          placeholder="e.g., 4.50"
                          step="0.01"
                          className="bg-white text-gray-900 border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900">Asset W (m)</label>
                        <Input
                          type="number"
                          value={assetW}
                          onChange={(e) => setAssetW(e.target.value)}
                          placeholder="e.g., 2.10"
                          step="0.01"
                          className="bg-white text-gray-900 border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900">Asset H (m)</label>
                        <Input
                          type="number"
                          value={assetH}
                          onChange={(e) => setAssetH(e.target.value)}
                          placeholder="e.g., 2.00"
                          step="0.01"
                          className="bg-white text-gray-900 border-border"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-900">Transportation Weight (kg)</label>
                        <Input
                          type="number"
                          value={contMass}
                          onChange={(e) => setContMass(e.target.value)}
                          placeholder="e.g., 9500"
                          className="bg-white text-gray-900 border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900">Payload Limit (kg) - Auto-Filled</label>
                        <Input
                          type="number"
                          value={payloadLimit || (containerPreset !== 'custom' ? '30480' : '')}
                          onChange={(e) => setPayloadLimit(e.target.value)}
                          placeholder="Auto: 30480 for 20ft ISO"
                          className="bg-white text-gray-900 border-border"
                          disabled={containerPreset !== 'custom'}
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          20ft ISO standard payload: 30,480 kg (auto-filled)
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={checkFit} variant="default">Check fit</Button>
                      <Button
                        onClick={() => {
                          setAssetL('');
                          setAssetW('');
                          setAssetH('');
                          setContMass('');
                          setPayloadLimit('');
                          setFitResult('');
                        }}
                        className="bg-ribbon hover:bg-ribbon/90 text-white"
                      >
                        Clear
                      </Button>
                    </div>

                    {fitResult && (
                      <div className={`p-4 rounded-md border-2 ${
                        fitResult.startsWith('✓ PASS') 
                          ? 'bg-green-50 border-green-600' 
                          : 'bg-red-50 border-red-600'
                      }`}>
                        <pre className="whitespace-pre-wrap text-gray-900 font-sans text-sm leading-relaxed">
                          {fitResult}
                        </pre>
                      </div>
                    )}
                    
                    {containerHistory.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Calculation History</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {containerHistory.map((entry, idx) => (
                            <div key={idx} className="bg-gray-100 p-3 rounded border border-gray-300">
                              <p className="text-xs text-gray-600 mb-1">{entry.timestamp}</p>
                              <p className="text-sm text-gray-900 font-semibold">
                                Result: {entry.result.fitResult} | 
                                Dimensions: {entry.result.dimensions.L}m × {entry.result.dimensions.W}m × {entry.result.dimensions.H}m | 
                                Mass: {entry.result.mass}kg
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Guidance */}
              <TabsContent value="guidance" className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-card-foreground">Guidance for Front-Line Commands (FLC)</CardTitle>
                    <CardDescription>Simple step-by-step instructions for calculating Centre of Gravity, Restraint Systems, and Container Fit</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Centre of Gravity Section */}
                    <Card className="bg-white border-border">
                      <CardHeader>
                        <CardTitle className="text-gray-900">Centre of Gravity (CofG) - Finding the Balance Point</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-gray-900">
                        <div>
                          <h4 className="font-semibold mb-2">What is Centre of Gravity?</h4>
                          <p className="text-sm">
                            The Centre of Gravity (CofG) is the balance point of your equipment. Think of it like a seesaw - 
                            if you know where the balance point is, you can load and secure your cargo properly.
                          </p>
                        </div>
                        
                        <div className="bg-blue-50 border-2 border-blue-400 p-4 rounded">
                          <p className="font-semibold text-blue-900 mb-2">⚠️ CRITICAL: Use Transportation Weight</p>
                          <p className="text-gray-900 mb-2">
                            Always calculate CofG and restraint systems using the <strong>transportation weight</strong> - this is the actual weight during transport, which is different from laden or unladen weight.
                          </p>
                          <p className="text-gray-900 text-sm">
                            Transportation weight includes: empty vehicle weight + fuel + ammunition + crew equipment + any cargo being transported.
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">How to Use:</h4>
                          <ol className="list-decimal list-inside space-y-2 text-sm">
                            <li><strong>Method 1 - Item by Item:</strong> Click "Add Item" and enter each component's mass and position (x, y, z coordinates from the front-left-bottom corner)</li>
                            <li><strong>Method 2 - Axle Masses (Quick Method):</strong> If you know the weight on each axle:
                              <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                <li>Enter front axle mass and position (usually x = 0)</li>
                                <li>Enter rear axle mass and position (distance from front axle in meters)</li>
                                <li>Click "Use Axle Masses" then "Calculate CoG"</li>
                              </ul>
                            </li>
                            <li>The tool calculates the overall balance point automatically</li>
                          </ol>
                        </div>
                        
                        <div className="bg-green-50 border border-green-300 rounded p-3">
                          <p className="text-sm"><strong>Example:</strong> A 10,000 kg vehicle with front axle at 0m carrying 4,500 kg and rear axle at 3.5m carrying 5,500 kg has its CofG at approximately x = 1.93m from the front.</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Restraint System Section */}
                    <Card className="bg-white border-border">
                      <CardHeader>
                        <CardTitle className="text-gray-900">Restraint System - Securing Your Load</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-gray-900">
                        <div>
                          <h4 className="font-semibold mb-2">What is the Restraint System Calculator?</h4>
                          <p className="text-sm">
                            This tool calculates how many straps you need to safely secure equipment during transport. 
                            It follows JSP 800 Vol 7 Defence Standards to ensure loads don't shift during braking, accelerating, or turning.
                          </p>
                        </div>

                        {/* Field Mode Section */}
                        <div className="bg-green-50 border-2 border-green-500 p-4 rounded">
                          <h4 className="font-semibold text-green-900 mb-2">Field Mode (Recommended for Soldiers)</h4>
                          <p className="text-gray-900 text-sm mb-3">
                            Field Mode is designed for use in the field when you don't have time for complex calculations.
                            It uses Defence Standard values automatically and gives you simple answers.
                          </p>
                          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-900">
                            <li>Click <strong>"Field"</strong> mode toggle at the top</li>
                            <li>Enter the <strong>Transportation Weight</strong> of your equipment</li>
                            <li>For each direction, select your <strong>Strap Type</strong> (Light/Medium/Heavy) and <strong>Angle</strong> (Low/Typical/Steep)</li>
                            <li>If you know the tie-down point SWL, select "I know the SWL" and enter it - otherwise leave as "I do NOT know"</li>
                            <li>Click <strong>"Calculate"</strong></li>
                            <li>The tool tells you exactly how many straps you need</li>
                          </ol>
                          <p className="text-xs text-green-800 mt-3">
                            Field Mode automatically uses: 0.8g forward, 0.5g rearward/lateral, zero friction (μ=0)
                          </p>
                        </div>

                        {/* Standard Mode Section */}
                        <div className="bg-gray-50 border border-gray-300 p-4 rounded">
                          <h4 className="font-semibold text-gray-900 mb-2">Standard Mode (For Detailed Calculations)</h4>
                          <p className="text-gray-900 text-sm mb-3">
                            Standard Mode gives you full control over all parameters for detailed engineering calculations.
                          </p>
                          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-900">
                            <li>Defence values are pre-loaded (0.8g forward, 0.5g rear/lateral, μ=0)</li>
                            <li>Enter the <strong>Transportation Weight</strong></li>
                            <li>Choose <strong>Auto</strong> or <strong>Manual</strong> mode for each direction:
                              <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                <li><strong>Auto:</strong> Tool calculates how many straps you need</li>
                                <li><strong>Manual:</strong> You enter strap count, tool checks if it's enough</li>
                              </ul>
                            </li>
                            <li>Select strap rating (daN) and angle for each direction</li>
                            <li>Click <strong>"Calculate"</strong></li>
                          </ol>
                        </div>
                        
                        <div className="bg-amber-50 border-2 border-amber-600 rounded p-4">
                          <p className="text-sm font-bold text-amber-900 mb-2">⚠️ Important Field Explanations:</p>
                          <ul className="list-disc list-inside ml-4 space-y-2 text-sm text-gray-900">
                            <li><strong>Transportation Weight (kg):</strong> The total weight including fuel, ammunition, crew equipment - NOT empty weight</li>
                            <li><strong>Friction μ (mu):</strong> Defence Standard is μ=0 (zero friction) for safety. Never rely on friction for Defence operations</li>
                            <li><strong>Forward/Rearward/Lateral accel (g):</strong> The g-forces during transport. Defence Standards: Forward 0.8g, Rearward 0.5g, Lateral 0.5g</li>
                            <li><strong>LC (Lashing Capacity):</strong> Strap strength printed on the label - common values are 1000, 2000, or 4000 daN</li>
                            <li><strong>Angle θ:</strong> Keep between 20-30° for best efficiency. Lower angles = more effective restraint</li>
                            <li><strong>Anchor SWL:</strong> The Safe Working Load of your tie-down points. If unknown, the tool will warn you to verify</li>
                          </ul>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-300 rounded p-3 mt-3">
                          <p className="text-sm font-semibold text-blue-900 mb-1">Key Tips:</p>
                          <ul className="list-disc list-inside ml-4 space-y-1 text-sm text-gray-900">
                            <li>Smaller angles (20-30°, closer to horizontal) = more effective restraint</li>
                            <li>Use higher capacity straps (2000 daN) rather than excessive quantities of weak straps</li>
                            <li>Distribute lashings evenly around the load for balanced restraint</li>
                            <li>Always re-check and re-tension lashings after first 30 minutes of transport</li>
                            <li>For Defence: Strap capacity should be at least 2× the g-force applied (e.g., 1g = 2000 daN minimum)</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Container Fit Section */}
                    <Card className="bg-white border-border">
                      <CardHeader>
                        <CardTitle className="text-gray-900">ISO Container Fit - Will It Fit?</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-gray-900">
                        <div>
                          <h4 className="font-semibold mb-2">What is Container Fit?</h4>
                          <p className="text-sm">
                            This tool checks if your equipment will fit inside a standard shipping container (like those on cargo ships). 
                            It checks both the door opening and the internal space.
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">How to Use:</h4>
                          <ol className="list-decimal list-inside space-y-2 text-sm">
                            <li><strong>Select container type:</strong> Most common is "20 ft ISO (Standard)" - this is the standard military container size</li>
                            
                            <li><strong>Allow rotation:</strong> 
                              <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                <li><strong>Yes:</strong> The tool will try different orientations (turning it sideways or on end)</li>
                                <li><strong>No:</strong> Only checks if it fits in the normal position</li>
                              </ul>
                            </li>
                            
                            <li><strong>Enter your equipment dimensions:</strong>
                              <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                <li>L = Length (longest dimension)</li>
                                <li>W = Width</li>
                                <li>H = Height</li>
                                <li>All measurements in meters (e.g., 4.50 m)</li>
                              </ul>
                            </li>
                            
                            <li><strong>Enter weights:</strong>
                              <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                <li><strong>Transportation Weight:</strong> Weight of your equipment (kg) - same as used for CoG and restraint calculations</li>
                                <li><strong>Payload Limit:</strong> Auto-filled for standard containers - 30,480 kg for 20 ft ISO (you don't need to enter this)</li>
                              </ul>
                            </li>
                            
                            <li><strong>Click "Check fit":</strong> The tool will tell you:
                              <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                <li><strong>PASS:</strong> Equipment fits - it shows which orientation works (e.g., "L×W×H")</li>
                                <li><strong>FAIL:</strong> Equipment doesn't fit - you'll need a larger container or different transport method</li>
                              </ul>
                            </li>
                          </ol>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Standard 20 ft ISO Container Dimensions:</h4>
                          <ul className="list-disc list-inside ml-6 space-y-1 text-sm">
                            <li><strong>Door opening:</strong> 2.34 m wide × 2.28 m high</li>
                            <li><strong>Internal space:</strong> 5.90 m long × 2.35 m wide × 2.39 m high</li>
                            <li><strong>Payload capacity:</strong> Approximately 30,480 kg</li>
                          </ul>
                        </div>
                        
                        <div className="bg-warning/10 border border-warning/30 rounded p-3">
                          <p className="text-sm"><strong>Remember:</strong> Even if the equipment fits dimensionally, you must also check:</p>
                          <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                            <li>Can you safely load it through the door?</li>
                            <li>Is there clearance for securing straps?</li>
                            <li>Will the weight distribution be safe?</li>
                            <li>Consider using High Cube (2.69 m high) for taller items</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Reference */}
                    <Card className="bg-success/10 border-success/30 border">
                      <CardHeader>
                        <CardTitle className="text-gray-900">Quick Reference Card</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-900">
                          <div>
                            <h4 className="font-semibold mb-2 text-gray-900">Defence Standard Values:</h4>
                            <ul className="space-y-1 text-gray-900">
                              <li>Forward: 0.8 g</li>
                              <li>Rearward: 0.5 g</li>
                              <li>Lateral: 0.5 g</li>
                              <li>Friction (μ): 0.0</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2 text-gray-900">Typical Strap Ratings:</h4>
                            <ul className="space-y-1 text-gray-900">
                              <li>Light: 1000 daN</li>
                              <li>Medium: 2000 daN</li>
                              <li>Heavy: 4000 daN</li>
                              <li>Extra Heavy: 5000+ daN</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2 text-gray-900">Best Practices:</h4>
                            <ul className="space-y-1 text-gray-900">
                              <li>Keep strap angles &lt; 30°</li>
                              <li>Use Defence preset for safety</li>
                              <li>Check all directions</li>
                              <li>Re-tension after 30 minutes</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-center">
              <Button className="bg-ribbon hover:bg-ribbon/90 text-white" onClick={() => navigate('/')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
