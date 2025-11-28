import { useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Calculator, Box, FileText, Info, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Item {
  name: string;
  mass: string;
  x: string;
  y: string;
  z: string;
}

interface Lashing {
  count: string;
  LC: string;
  unit: string;
  angle: string;
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

  // Restraint State
  const [designMass, setDesignMass] = useState('');
  const [grav, setGrav] = useState('9.81');
  const [mu, setMu] = useState('');
  const [ratingUnit, setRatingUnit] = useState('daN');
  const [af, setAf] = useState('');
  const [ar, setAr] = useState('');
  const [al, setAl] = useState('');
  const [anchorSWL, setAnchorSWL] = useState('');
  const [sfF, setSfF] = useState('1.00');
  const [sfR, setSfR] = useState('1.00');
  const [sfL, setSfL] = useState('1.00');
  const [anchorMargin, setAnchorMargin] = useState('1.00');
  const [lashDir, setLashDir] = useState('Forward');
  const [lashCount, setLashCount] = useState('');
  const [lashLC, setLashLC] = useState('');
  const [lashUnit, setLashUnit] = useState('daN');
  const [lashAngle, setLashAngle] = useState('');
  const [lashings, setLashings] = useState<{ Forward: Lashing[], Rearward: Lashing[], Lateral: Lashing[] }>({
    Forward: [],
    Rearward: [],
    Lateral: []
  });
  const [restraintResults, setRestraintResults] = useState<any[]>([]);

  // Container State
  const [containerPreset, setContainerPreset] = useState('20std');
  const [allowRotation, setAllowRotation] = useState('Yes');
  const [assetL, setAssetL] = useState('');
  const [assetW, setAssetW] = useState('');
  const [assetH, setAssetH] = useState('');
  const [contMass, setContMass] = useState('');
  const [payloadLimit, setPayloadLimit] = useState('');
  const [fitResult, setFitResult] = useState('');

  // Helper functions
  const toN = (val: string | number, unit: string) => {
    const v = parseFloat(val.toString() || '0');
    if (unit === 'N') return v;
    if (unit === 'kN') return v * 1000;
    if (unit === 'daN') return v * 10;
    return v;
  };

  const fmt = (n: number) => Number.isFinite(n) ? n.toFixed(2) : '–';

  // CoG Functions
  const addItem = () => {
    setItems([...items, { name: '', mass: '', x: '', y: '', z: '' }]);
  };

  const deleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    calcCoG(newItems);
  };

  const updateItem = (index: number, field: keyof Item, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
    calcCoG(newItems);
  };

  const calcCoG = (itemsList = items) => {
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

  const presetAxles = () => {
    const m1 = parseFloat(axle1Mass) || 0;
    const x1 = parseFloat(axle1X) || 0;
    const m2 = parseFloat(axle2Mass) || 0;
    const x2 = parseFloat(axle2X) || 0;
    const newItems = [
      { name: 'Axle 1', mass: m1.toString(), x: x1.toString(), y: '0', z: '' },
      { name: 'Axle 2', mass: m2.toString(), x: x2.toString(), y: '0', z: '' }
    ];
    setItems(newItems);
    calcCoG(newItems);
  };

  // Restraint Functions
  const addLashing = () => {
    if (!lashCount || !lashLC || !lashAngle) {
      toast({
        title: 'Error',
        description: 'Please enter count, LC, and angle',
        variant: 'destructive'
      });
      return;
    }
    const newLashings = { ...lashings };
    newLashings[lashDir as keyof typeof lashings].push({
      count: lashCount,
      LC: lashLC,
      unit: lashUnit,
      angle: lashAngle
    });
    setLashings(newLashings);
    setLashCount('');
    setLashLC('');
    setLashAngle('');
  };

  const clearLashings = () => {
    setLashings({ Forward: [], Rearward: [], Lateral: [] });
  };

  const starterPlan = () => {
    setLashings({
      Forward: [{ count: '4', LC: '2000', unit: 'daN', angle: '20' }],
      Rearward: [{ count: '2', LC: '4000', unit: 'daN', angle: '10' }],
      Lateral: [{ count: '4', LC: '2000', unit: 'daN', angle: '30' }]
    });
  };

  const presetUK = () => {
    setMu('0.30');
    setAf('0.80');
    setAr('0.50');
    setAl('0.50');
  };

  const presetDef = () => {
    setMu('0.00');
    setAf('0.80');
    setAr('0.50');
    setAl('0.50');
  };

  const calcRestraint = () => {
    const m = parseFloat(designMass) || 0;
    const g = parseFloat(grav) || 9.81;
    const muVal = parseFloat(mu) || 0;
    const afVal = parseFloat(af) || 0;
    const arVal = parseFloat(ar) || 0;
    const alVal = parseFloat(al) || 0;
    const sfFVal = parseFloat(sfF) || 1;
    const sfRVal = parseFloat(sfR) || 1;
    const sfLVal = parseFloat(sfL) || 1;

    const directionResidual = (a: number, sf: number) => {
      const Freq = m * g * a * sf;
      const Fmu = muVal * m * g;
      const Residual = Math.max(Freq - Fmu, 0);
      return { Freq, Fmu, Residual };
    };

    const directionCapacity = (dir: 'Forward' | 'Rearward' | 'Lateral') => {
      return lashings[dir].reduce((sum, L) => {
        const LC_N = toN(L.LC, L.unit);
        const eff_each = LC_N * Math.cos((parseFloat(L.angle) || 0) * Math.PI / 180);
        return sum + eff_each * (parseFloat(L.count) || 0);
      }, 0);
    };

    const results = [
      { dir: 'Forward', ...directionResidual(afVal, sfFVal), cap: directionCapacity('Forward') },
      { dir: 'Rearward', ...directionResidual(arVal, sfRVal), cap: directionCapacity('Rearward') },
      { dir: 'Lateral', ...directionResidual(alVal, sfLVal), cap: directionCapacity('Lateral') }
    ];

    setRestraintResults(results);
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
                        Add item
                      </Button>
                      <Button onClick={presetAxles} className="bg-white text-gray-900 border border-border hover:bg-gray-100">
                        Use axle masses
                      </Button>
                      <Button onClick={() => setItems([])} className="bg-white text-gray-900 border border-border hover:bg-gray-100">
                        Clear items
                      </Button>
                      <Button onClick={() => calcCoG()} variant="default">
                        Calculate CofG
                      </Button>
                    </div>

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
                        <label className="text-sm font-medium text-gray-900">Front axle mass (kg)</label>
                        <Input
                          type="number"
                          value={axle1Mass}
                          onChange={(e) => setAxle1Mass(e.target.value)}
                          placeholder="e.g., 4500"
                          className="bg-white text-gray-900 border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900">Front axle x (m)</label>
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
                        <label className="text-sm font-medium text-gray-900">Rear axle mass (kg)</label>
                        <Input
                          type="number"
                          value={axle2Mass}
                          onChange={(e) => setAxle2Mass(e.target.value)}
                          placeholder="e.g., 5500"
                          className="bg-white text-gray-900 border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900">Rear axle x (m)</label>
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
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={presetUK} variant="secondary">UK Road Preset</Button>
                      <Button onClick={presetDef} variant="secondary">Defence Preset (μ=0)</Button>
                      <Button onClick={starterPlan} className="bg-ribbon hover:bg-ribbon/90 text-white">Starter plan</Button>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-900">Design mass (kg)</label>
                        <Input
                          type="number"
                          value={designMass}
                          onChange={(e) => setDesignMass(e.target.value)}
                          placeholder="e.g., 9500"
                          className="bg-white text-gray-900 border-border"
                        />
                      </div>
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
                          placeholder="UK ~0.30; Defence 0.00"
                          step="0.01"
                          className="bg-white text-gray-900 border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900">Rating unit</label>
                        <Select value={ratingUnit} onValueChange={setRatingUnit}>
                          <SelectTrigger className="bg-white text-gray-900 border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="daN">daN</SelectItem>
                            <SelectItem value="kN">kN</SelectItem>
                            <SelectItem value="N">N</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-900">Forward accel (g)</label>
                        <Input
                          type="number"
                          value={af}
                          onChange={(e) => setAf(e.target.value)}
                          placeholder="e.g., 0.80"
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
                          placeholder="e.g., 0.50"
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
                          placeholder="e.g., 0.50"
                          step="0.01"
                          className="bg-white text-gray-900 border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900">Anchor SWL per point</label>
                        <Input
                          type="number"
                          value={anchorSWL}
                          onChange={(e) => setAnchorSWL(e.target.value)}
                          placeholder="e.g., 20"
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
                          placeholder="e.g., 1.00"
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
                          placeholder="e.g., 1.00"
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
                          placeholder="e.g., 1.00"
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
                          placeholder="e.g., 1.00"
                          step="0.01"
                          className="bg-white text-gray-900 border-border"
                        />
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900">Add lashing</h3>
                    <div className="grid grid-cols-6 gap-4 items-end">
                      <div>
                        <label className="text-sm font-medium text-gray-900">Direction</label>
                        <Select value={lashDir} onValueChange={setLashDir}>
                          <SelectTrigger className="bg-white text-gray-900 border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="Forward">Forward</SelectItem>
                            <SelectItem value="Rearward">Rearward</SelectItem>
                            <SelectItem value="Lateral">Lateral</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900">Count</label>
                        <Input
                          type="number"
                          value={lashCount}
                          onChange={(e) => setLashCount(e.target.value)}
                          placeholder="e.g., 2"
                          min="1"
                          className="bg-white text-gray-900 border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900">LC</label>
                        <Input
                          type="number"
                          value={lashLC}
                          onChange={(e) => setLashLC(e.target.value)}
                          placeholder="e.g., 2000"
                          className="bg-white text-gray-900 border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900">Unit</label>
                        <Select value={lashUnit} onValueChange={setLashUnit}>
                          <SelectTrigger className="bg-white text-gray-900 border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="daN">daN</SelectItem>
                            <SelectItem value="kN">kN</SelectItem>
                            <SelectItem value="N">N</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900">θ°</label>
                        <Input
                          type="number"
                          value={lashAngle}
                          onChange={(e) => setLashAngle(e.target.value)}
                          placeholder="e.g., 20"
                          step="0.1"
                          className="bg-white text-gray-900 border-border"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={addLashing} variant="default">Add</Button>
                        <Button onClick={clearLashings} className="bg-ribbon hover:bg-ribbon/90 text-white">Clear all</Button>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button onClick={calcRestraint} variant="default">Calculate</Button>
                      <Button onClick={() => setRestraintResults([])} className="bg-ribbon hover:bg-ribbon/90 text-white">Clear results</Button>
                    </div>

                    {restraintResults.length > 0 && (
                      <>
                        <h3 className="text-lg font-semibold text-gray-900">Lashing Results - Your Restraint Plan</h3>
                        
                        <div className="bg-red-50 border-2 border-red-600 p-4 rounded-md mb-4">
                          <p className="font-bold text-red-900 mb-2">⚠️ CRITICAL DEFENCE STANDARD:</p>
                          <p className="text-gray-900">
                            <strong>Zero Friction (μ=0)</strong> is assumed for Defence operations. Your lashings must 
                            provide ALL the restraint force. Do NOT rely on friction between the load and the platform. 
                            The load surface must be treated as completely slippery.
                          </p>
                        </div>

                        {restraintResults.map((r, i) => {
                          const pass = r.cap >= r.Residual;
                          const directionLashings = lashings[r.dir as keyof typeof lashings];
                          const totalStraps = directionLashings.reduce((sum, L) => sum + (parseFloat(L.count) || 0), 0);
                          
                          return (
                            <Card key={i} className={`${pass ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600'} border-2`}>
                              <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-xl font-bold text-gray-900">{r.dir} Direction</h4>
                                  <span className={`text-2xl font-bold ${pass ? 'text-green-700' : 'text-red-700'}`}>
                                    {pass ? '✓ PASS' : '✗ FAIL'}
                                  </span>
                                </div>

                                <div className="space-y-3 text-gray-900">
                                  <div className="bg-white p-3 rounded border border-gray-300">
                                    <p className="text-sm font-semibold mb-1">Total Straps Required:</p>
                                    <p className="text-2xl font-bold">{totalStraps} straps in {r.dir.toLowerCase()} direction</p>
                                  </div>

                                  <div className="bg-white p-3 rounded border border-gray-300">
                                    <p className="text-sm font-semibold mb-2">Your Strap Configuration:</p>
                                    {directionLashings.length === 0 ? (
                                      <p className="text-red-600 font-semibold">⚠️ No straps configured for this direction!</p>
                                    ) : (
                                      <ul className="space-y-1">
                                        {directionLashings.map((L, idx) => (
                                          <li key={idx} className="flex items-center justify-between">
                                            <span>• {L.count} straps @ {L.LC} {L.unit} capacity</span>
                                            <span className="font-semibold">Angle: {L.angle}°</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white p-3 rounded border border-gray-300">
                                      <p className="text-sm mb-1">Force Needed (with safety factor):</p>
                                      <p className="text-lg font-bold">{fmt(r.Residual)} N</p>
                                      <p className="text-xs text-gray-600 mt-1">({(r.Residual / 10).toFixed(0)} daN)</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border border-gray-300">
                                      <p className="text-sm mb-1">Your Strap Capacity:</p>
                                      <p className="text-lg font-bold">{fmt(r.cap)} N</p>
                                      <p className="text-xs text-gray-600 mt-1">({(r.cap / 10).toFixed(0)} daN)</p>
                                    </div>
                                  </div>

                                  {!pass && (
                                    <div className="bg-red-100 border border-red-400 p-3 rounded">
                                      <p className="font-bold text-red-900 mb-1">⚠️ Action Required:</p>
                                      <p className="text-gray-900 text-sm">
                                        Add more straps or use higher capacity straps (e.g., upgrade from 1000 daN to 2000 daN). 
                                        You need approximately <strong>{Math.ceil((r.Residual - r.cap) / 10000)} more standard (2000 daN) straps</strong> to pass.
                                      </p>
                                    </div>
                                  )}

                                  <div className="bg-blue-50 border border-blue-300 p-3 rounded">
                                    <p className="font-semibold text-blue-900 mb-1">Lashing Angle Guide:</p>
                                    <p className="text-sm text-gray-900">
                                      Keep strap angles <strong>20-30°</strong> for maximum efficiency. 
                                      Lower angles (closer to horizontal) provide better restraint. 
                                      Angles above 45° significantly reduce effectiveness.
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}

                        <div className="bg-amber-50 border-2 border-amber-600 p-4 rounded-md mt-4">
                          <p className="font-bold text-amber-900 mb-2">Standard Strap Ratings:</p>
                          <ul className="space-y-1 text-gray-900">
                            <li>• <strong>Light duty:</strong> 1,000 daN (suitable for loads under 5,000 kg)</li>
                            <li>• <strong>Medium duty:</strong> 2,000 daN (most common, suitable for loads 5,000-15,000 kg)</li>
                            <li>• <strong>Heavy duty:</strong> 4,000 daN (for heavy loads over 15,000 kg)</li>
                          </ul>
                          <p className="mt-2 text-sm text-gray-900">
                            <strong>Defence Standard:</strong> Strap capacity should be at least <strong>2× the g-force applied</strong>. 
                            For 1g acceleration, minimum 2,000 daN straps recommended.
                          </p>
                        </div>
                      </>
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
                        <label className="text-sm font-medium text-gray-900">Design mass (kg)</label>
                        <Input
                          type="number"
                          value={contMass}
                          onChange={(e) => setContMass(e.target.value)}
                          placeholder="e.g., 9500"
                          className="bg-white text-gray-900 border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900">Payload limit (kg) - Auto-filled</label>
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
                        
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                          <p className="font-semibold text-blue-900 mb-2">Critical: Use Transportation Weight</p>
                          <p className="text-gray-900 mb-2">
                            Always calculate CofG using the <strong>transportation weight</strong> - this is the actual weight during transport, which is different from laden or unladen weight.
                          </p>
                          <p className="text-gray-900 mb-2">Transportation weight includes:</p>
                          <ul className="list-disc ml-5 space-y-1 text-gray-900">
                            <li>Ammunition</li>
                            <li>Weapon systems</li>
                            <li>Fuel in tanks</li>
                            <li>Water</li>
                            <li>Crew kit and equipment</li>
                            <li>Any other items that will be onboard during transport</li>
                          </ul>
                          <p className="mt-2 text-gray-900">
                            These items add weight to the unladen weight and change the CofG position. Never use just the empty vehicle weight!
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">How to Calculate:</h4>
                          <ol className="list-decimal list-inside space-y-2 text-sm">
                            <li><strong>Break it down into parts:</strong> Divide your equipment into separate items (e.g., vehicle body, fuel, crew, cargo)</li>
                            <li><strong>Weigh each part:</strong> Enter the weight (mass) of each item in kilograms</li>
                            <li><strong>Measure the position:</strong> Measure where each item sits from a reference point (usually the front):
                              <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                <li>x = front to back distance (in meters)</li>
                                <li>y = left to right distance (in meters)</li>
                                <li>z = height from ground (in meters)</li>
                              </ul>
                            </li>
                            <li><strong>Click "Calculate CofG":</strong> The tool will calculate the overall balance point automatically</li>
                          </ol>
                        </div>
                        
                        <div className="bg-green-50 border-2 border-green-400 p-4 rounded">
                          <h4 className="font-semibold mb-2 text-green-900">Quick Method - Using Axle Weights (Example):</h4>
                          <p className="text-sm text-gray-900 mb-2">
                            If you have a vehicle with known axle weights, use the "Use axle masses" button. 
                            Just enter the weight on each axle and where the axles are positioned. This gives you a quick CofG estimate.
                          </p>
                          <div className="bg-white p-3 rounded border border-green-300 mt-2">
                            <p className="font-semibold text-gray-900 mb-1">Example Calculation:</p>
                            <p className="text-sm text-gray-900">Vehicle: 10,000 kg total weight</p>
                            <ul className="list-disc ml-5 text-sm text-gray-900 space-y-1 mt-1">
                              <li>Front axle: 4,500 kg at position x = 0.00 m (reference point)</li>
                              <li>Rear axle: 5,500 kg at position x = 3.50 m (from front)</li>
                            </ul>
                            <p className="text-sm text-gray-900 mt-2">
                              <strong>Result:</strong> CofG at x = 1.93 m from front axle
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Formula: CofG(x) = (4500×0 + 5500×3.5) ÷ 10000 = 1.93 m
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-amber-50 border border-amber-200 rounded p-4">
                          <p className="font-semibold text-amber-900 mb-2">Important: High CofG and Safety</p>
                          <p className="text-gray-900 mb-2">
                            A high CofG (large z value above 2m) means the equipment is more likely to tip over during transport, especially on slopes or during cornering.
                          </p>
                          <p className="text-gray-900 mb-2"><strong>What needs to be considered when planning transport:</strong></p>
                          <ul className="list-disc ml-5 space-y-1 text-gray-900">
                            <li>Stability during acceleration, braking, and cornering</li>
                            <li>Risk of rollover on uneven terrain or slopes</li>
                            <li>Route planning to avoid steep gradients and sharp bends</li>
                            <li>Speed restrictions for high CofG loads</li>
                          </ul>
                          <p className="text-gray-900 mt-3 mb-2"><strong>High CofG Mitigation - How to transport safely:</strong></p>
                          <ul className="list-disc ml-5 space-y-1 text-gray-900">
                            <li><strong>Reduce speed:</strong> Drive slower, especially on bends and uneven terrain</li>
                            <li><strong>Additional restraints:</strong> Use more lashings and ensure they're properly tensioned</li>
                            <li><strong>Lower the load:</strong> Remove turrets, antennas, or detachable components if possible</li>
                            <li><strong>Route planning:</strong> Avoid steep gradients, sharp turns, and rough terrain</li>
                            <li><strong>Weight distribution:</strong> Place heavier items lower in the vehicle where practical</li>
                            <li><strong>Driver briefing:</strong> Ensure drivers understand stability risks and safe driving practices</li>
                            <li><strong>Escort vehicles:</strong> Consider using escort for very high CofG loads</li>
                          </ul>
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
                          <h4 className="font-semibold mb-2">What is a Restraint System?</h4>
                          <p className="text-sm">
                            A restraint system is how you tie down and secure equipment to prevent it from moving during transport. 
                            You need to secure it in three directions: forward (braking), rearward (acceleration), and sideways (cornering).
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Step-by-Step Guide:</h4>
                          <ol className="list-decimal list-inside space-y-3 text-sm">
                            <li><strong>Enter the design mass:</strong> This is the total weight of what you're securing (in kilograms)</li>
                            
                            <li><strong>Select a preset:</strong>
                              <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                <li><strong>UK Road Preset:</strong> Use if transporting on UK roads (assumes some friction μ=0.30)</li>
                                <li><strong>Defence Preset:</strong> Use for military operations (assumes no friction μ=0, safer)</li>
                              </ul>
                            </li>
                            
                            <li><strong>Add your lashings (tie-down straps):</strong>
                              <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                <li><strong>Direction:</strong> Choose Forward, Rearward, or Lateral (sideways)</li>
                                <li><strong>Count:</strong> How many straps in this direction (e.g., 4)</li>
                                <li><strong>LC (Lashing Capacity):</strong> The strength rating of your strap (usually printed on it, e.g., 2000 daN)</li>
                                <li><strong>Angle (θ):</strong> How steep the strap angle is - keep this small (around 20-30 degrees) for best results</li>
                              </ul>
                            </li>
                            
                            <li><strong>Click "Calculate":</strong> The tool checks if your lashings are strong enough</li>
                            
                            <li><strong>Read the results:</strong>
                              <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                <li><strong>PASS:</strong> Your restraint system is adequate</li>
                                <li><strong>FAIL:</strong> You need more lashings in that direction - add more and recalculate</li>
                              </ul>
                            </li>
                          </ol>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Recommended Starting Point:</h4>
                          <p className="text-sm mb-2">Click "Starter plan" to load a typical setup, then adjust as needed:</p>
                          <ul className="list-disc list-inside ml-6 space-y-1 text-sm">
                            <li>4 straps pulling forward</li>
                            <li>2 straps pulling rearward</li>
                            <li>4 straps pulling sideways (lateral)</li>
                          </ul>
                        </div>
                        
                        <div className="bg-warning/10 border border-warning/30 rounded p-3">
                          <p className="text-sm"><strong>Key Tips:</strong></p>
                          <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                            <li>Smaller angles (closer to horizontal) = more effective restraint</li>
                            <li>Use higher capacity straps rather than excessive quantities</li>
                            <li>Distribute lashings evenly around the load</li>
                            <li>Always re-check lashings before moving</li>
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
                                <li><strong>Design mass:</strong> Weight of your equipment (kg)</li>
                                <li><strong>Payload limit:</strong> Maximum weight the container can carry (typically around 30,000 kg for 20 ft ISO)</li>
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
