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
      return { Lint: 5.90, Wint: 2.35, Hint: 2.39, Wdoor: 2.34, Hdoor: 2.28 };
    } else if (containerPreset === '20hc') {
      return { Lint: 5.90, Wint: 2.35, Hint: 2.69, Wdoor: 2.34, Hdoor: 2.58 };
    }
    return { Lint: 5.90, Wint: 2.35, Hint: 2.39, Wdoor: 2.34, Hdoor: 2.28 };
  };

  const checkFit = () => {
    const { Lint, Wint, Hint, Wdoor, Hdoor } = getContainerDimensions();
    const La = parseFloat(assetL) || 0;
    const Wa = parseFloat(assetW) || 0;
    const Ha = parseFloat(assetH) || 0;
    const m = parseFloat(contMass) || 0;
    const payload = parseFloat(payloadLimit) || 0;

    const orientations = [
      { name: 'L×W×H', dims: [La, Wa, Ha] },
      { name: 'W×L×H', dims: [Wa, La, Ha] },
      { name: 'H×W×L', dims: [Ha, Wa, La] }
    ];

    const tries = allowRotation === 'Yes' ? orientations : [orientations[0]];
    let ok = null;

    tries.forEach((o) => {
      const [L, W, H] = o.dims;
      const doorPass = Math.min(W, H) <= Wdoor && Math.max(W, H) <= Hdoor;
      const internalFit = L <= Lint && W <= Wint && H <= Hint;
      if (!ok && doorPass && internalFit) ok = o.name;
    });

    const payloadOK = (payload && m) ? (m <= payload) : true;
    setFitResult(
      ok
        ? `PASS — orientation ${ok}; door ✓, internal ✓; payload ${payloadOK ? '✓' : '✗'}`
        : `FAIL — no orientation passes door & internal simultaneously.`
    );
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
              <TabsList className="grid w-full grid-cols-5 bg-muted">
                <TabsTrigger value="search" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Search className="h-4 w-4 mr-2" />
                  TDS Search
                </TabsTrigger>
                <TabsTrigger value="cog" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Calculator className="h-4 w-4 mr-2" />
                  Centre of Gravity
                </TabsTrigger>
                <TabsTrigger value="restraint" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Box className="h-4 w-4 mr-2" />
                  Restraint System
                </TabsTrigger>
                <TabsTrigger value="container" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Box className="h-4 w-4 mr-2" />
                  Container Fit
                </TabsTrigger>
                <TabsTrigger value="guidance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
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
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Open TDS Search
                    </Button>
                    <p className="text-sm text-muted-foreground font-mono">
                      Tip: Use Asset Code, Designation, NSN or RIC; refine with Status, Asset Types and Transportation Types.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Centre of Gravity */}
              <TabsContent value="cog" className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-card-foreground">Centre of Gravity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={addItem} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Add item
                      </Button>
                      <Button onClick={presetAxles} variant="secondary">
                        Use axle masses
                      </Button>
                      <Button onClick={() => setItems([])} variant="outline">
                        Clear items
                      </Button>
                      <Button onClick={() => calcCoG()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        Calculate CoG
                      </Button>
                    </div>

                    <div className="rounded-md border border-border">
                      <Table>
                        <TableHeader className="bg-muted">
                          <TableRow>
                            <TableHead className="text-foreground">Name</TableHead>
                            <TableHead className="text-foreground">Mass (kg)</TableHead>
                            <TableHead className="text-foreground">x (m)</TableHead>
                            <TableHead className="text-foreground">y (m)</TableHead>
                            <TableHead className="text-foreground">z (m)</TableHead>
                            <TableHead className="text-foreground">Action</TableHead>
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
                                  className="bg-background text-foreground border-border"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.mass}
                                  onChange={(e) => updateItem(i, 'mass', e.target.value)}
                                  placeholder="kg"
                                  className="bg-background text-foreground border-border"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.x}
                                  onChange={(e) => updateItem(i, 'x', e.target.value)}
                                  placeholder="x m"
                                  className="bg-background text-foreground border-border"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.y}
                                  onChange={(e) => updateItem(i, 'y', e.target.value)}
                                  placeholder="y m"
                                  className="bg-background text-foreground border-border"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.z}
                                  onChange={(e) => updateItem(i, 'z', e.target.value)}
                                  placeholder="z m"
                                  className="bg-background text-foreground border-border"
                                />
                              </TableCell>
                              <TableCell>
                                <Button onClick={() => deleteItem(i)} variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted font-bold">
                            <TableCell className="text-foreground">Total</TableCell>
                            <TableCell className="text-foreground">{cogResult.totalMass}</TableCell>
                            <TableCell className="text-foreground">{cogResult.x}</TableCell>
                            <TableCell className="text-foreground">{cogResult.y}</TableCell>
                            <TableCell className="text-foreground">{cogResult.z}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">Front axle mass (kg)</label>
                        <Input
                          type="number"
                          value={axle1Mass}
                          onChange={(e) => setAxle1Mass(e.target.value)}
                          placeholder="e.g., 4700"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Front axle x (m)</label>
                        <Input
                          type="number"
                          value={axle1X}
                          onChange={(e) => setAxle1X(e.target.value)}
                          placeholder="e.g., 0.00"
                          step="0.01"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Rear axle mass (kg)</label>
                        <Input
                          type="number"
                          value={axle2Mass}
                          onChange={(e) => setAxle2Mass(e.target.value)}
                          placeholder="e.g., 4800"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Rear axle x (m)</label>
                        <Input
                          type="number"
                          value={axle2X}
                          onChange={(e) => setAxle2X(e.target.value)}
                          placeholder="e.g., 4.20"
                          step="0.01"
                          className="bg-background text-foreground border-border"
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
                    <CardTitle className="text-card-foreground">Restraint System (Direct lashings)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={presetUK} variant="secondary">UK Road Preset</Button>
                      <Button onClick={presetDef} variant="secondary">Defence Preset (μ=0)</Button>
                      <Button onClick={starterPlan} variant="outline">Starter plan</Button>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">Design mass (kg)</label>
                        <Input
                          type="number"
                          value={designMass}
                          onChange={(e) => setDesignMass(e.target.value)}
                          placeholder="e.g., 9500"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">g (m/s²)</label>
                        <Input
                          type="number"
                          value={grav}
                          onChange={(e) => setGrav(e.target.value)}
                          placeholder="9.81"
                          step="0.01"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Friction μ</label>
                        <Input
                          type="number"
                          value={mu}
                          onChange={(e) => setMu(e.target.value)}
                          placeholder="UK ~0.30; Defence 0.00"
                          step="0.01"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Rating unit</label>
                        <Select value={ratingUnit} onValueChange={setRatingUnit}>
                          <SelectTrigger className="bg-background text-foreground border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daN">daN</SelectItem>
                            <SelectItem value="kN">kN</SelectItem>
                            <SelectItem value="N">N</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">Forward accel (g)</label>
                        <Input
                          type="number"
                          value={af}
                          onChange={(e) => setAf(e.target.value)}
                          placeholder="e.g., 0.80"
                          step="0.01"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Rearward accel (g)</label>
                        <Input
                          type="number"
                          value={ar}
                          onChange={(e) => setAr(e.target.value)}
                          placeholder="e.g., 0.50"
                          step="0.01"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Lateral accel (g)</label>
                        <Input
                          type="number"
                          value={al}
                          onChange={(e) => setAl(e.target.value)}
                          placeholder="e.g., 0.50"
                          step="0.01"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Anchor SWL per point</label>
                        <Input
                          type="number"
                          value={anchorSWL}
                          onChange={(e) => setAnchorSWL(e.target.value)}
                          placeholder="e.g., 20"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">Safety × Forward</label>
                        <Input
                          type="number"
                          value={sfF}
                          onChange={(e) => setSfF(e.target.value)}
                          placeholder="e.g., 1.00"
                          step="0.01"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Safety × Rearward</label>
                        <Input
                          type="number"
                          value={sfR}
                          onChange={(e) => setSfR(e.target.value)}
                          placeholder="e.g., 1.00"
                          step="0.01"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Safety × Lateral</label>
                        <Input
                          type="number"
                          value={sfL}
                          onChange={(e) => setSfL(e.target.value)}
                          placeholder="e.g., 1.00"
                          step="0.01"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Anchor margin ×</label>
                        <Input
                          type="number"
                          value={anchorMargin}
                          onChange={(e) => setAnchorMargin(e.target.value)}
                          placeholder="e.g., 1.00"
                          step="0.01"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-card-foreground">Add lashing</h3>
                    <div className="grid grid-cols-6 gap-4 items-end">
                      <div>
                        <label className="text-sm font-medium text-foreground">Direction</label>
                        <Select value={lashDir} onValueChange={setLashDir}>
                          <SelectTrigger className="bg-background text-foreground border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Forward">Forward</SelectItem>
                            <SelectItem value="Rearward">Rearward</SelectItem>
                            <SelectItem value="Lateral">Lateral</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Count</label>
                        <Input
                          type="number"
                          value={lashCount}
                          onChange={(e) => setLashCount(e.target.value)}
                          placeholder="e.g., 2"
                          min="1"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">LC</label>
                        <Input
                          type="number"
                          value={lashLC}
                          onChange={(e) => setLashLC(e.target.value)}
                          placeholder="e.g., 2000"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Unit</label>
                        <Select value={lashUnit} onValueChange={setLashUnit}>
                          <SelectTrigger className="bg-background text-foreground border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daN">daN</SelectItem>
                            <SelectItem value="kN">kN</SelectItem>
                            <SelectItem value="N">N</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">θ°</label>
                        <Input
                          type="number"
                          value={lashAngle}
                          onChange={(e) => setLashAngle(e.target.value)}
                          placeholder="e.g., 20"
                          step="0.1"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={addLashing} className="bg-primary text-primary-foreground hover:bg-primary/90">Add</Button>
                        <Button onClick={clearLashings} variant="outline">Clear all</Button>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button onClick={calcRestraint} className="bg-primary text-primary-foreground hover:bg-primary/90">Calculate</Button>
                      <Button onClick={() => setRestraintResults([])} variant="outline">Clear results</Button>
                    </div>

                    {restraintResults.length > 0 && (
                      <>
                        <h3 className="text-lg font-semibold text-card-foreground">Results summary</h3>
                        <div className="rounded-md border border-border">
                          <Table>
                            <TableHeader className="bg-muted">
                              <TableRow>
                                <TableHead className="text-foreground">Direction</TableHead>
                                <TableHead className="text-foreground">F_req (N)</TableHead>
                                <TableHead className="text-foreground">F_μ (N)</TableHead>
                                <TableHead className="text-foreground">Residual (N)</TableHead>
                                <TableHead className="text-foreground">Capacity (N)</TableHead>
                                <TableHead className="text-foreground">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {restraintResults.map((r, i) => {
                                const pass = r.cap >= r.Residual;
                                return (
                                  <TableRow key={i}>
                                    <TableCell className="text-foreground">{r.dir}</TableCell>
                                    <TableCell className="text-foreground">{fmt(r.Freq)}</TableCell>
                                    <TableCell className="text-foreground">{fmt(r.Fmu)}</TableCell>
                                    <TableCell className="text-foreground">{fmt(r.Residual)}</TableCell>
                                    <TableCell className="text-foreground">{fmt(r.cap)}</TableCell>
                                    <TableCell className={pass ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                                      {pass ? 'PASS' : 'FAIL'}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
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
                    <CardTitle className="text-card-foreground">Container Fit — 20 ft ISO by default</CardTitle>
                    <CardDescription>For non-20 ft ISO, pick Custom ISO to edit sizes.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">Container preset</label>
                        <Select value={containerPreset} onValueChange={setContainerPreset}>
                          <SelectTrigger className="bg-background text-foreground border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="20std">20 ft ISO (Standard)</SelectItem>
                            <SelectItem value="20hc">20 ft ISO (High Cube)</SelectItem>
                            <SelectItem value="custom">Custom ISO</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Allow rotation</label>
                        <Select value={allowRotation} onValueChange={setAllowRotation}>
                          <SelectTrigger className="bg-background text-foreground border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">Asset L (m)</label>
                        <Input
                          type="number"
                          value={assetL}
                          onChange={(e) => setAssetL(e.target.value)}
                          placeholder="e.g., 4.50"
                          step="0.01"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Asset W (m)</label>
                        <Input
                          type="number"
                          value={assetW}
                          onChange={(e) => setAssetW(e.target.value)}
                          placeholder="e.g., 2.10"
                          step="0.01"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Asset H (m)</label>
                        <Input
                          type="number"
                          value={assetH}
                          onChange={(e) => setAssetH(e.target.value)}
                          placeholder="e.g., 2.00"
                          step="0.01"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">Design mass (kg)</label>
                        <Input
                          type="number"
                          value={contMass}
                          onChange={(e) => setContMass(e.target.value)}
                          placeholder="e.g., 9500"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Payload limit (kg)</label>
                        <Input
                          type="number"
                          value={payloadLimit}
                          onChange={(e) => setPayloadLimit(e.target.value)}
                          placeholder="e.g., 30480"
                          className="bg-background text-foreground border-border"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={checkFit} className="bg-primary text-primary-foreground hover:bg-primary/90">Check fit</Button>
                      <Button
                        onClick={() => {
                          setAssetL('');
                          setAssetW('');
                          setAssetH('');
                          setContMass('');
                          setPayloadLimit('');
                          setFitResult('');
                        }}
                        variant="outline"
                      >
                        Clear
                      </Button>
                    </div>

                    {fitResult && (
                      <div className="p-4 rounded-md bg-muted border border-border">
                        <p className="font-mono text-foreground">{fitResult}</p>
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
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Card className="bg-muted border-border">
                      <CardHeader>
                        <CardTitle className="text-card-foreground">Quick rules</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-2 text-foreground">
                          <li><strong>Use Defence values:</strong> Forward 0.8 g, Rear 0.5 g, Side 0.5 g.</li>
                          <li><strong>Straps:</strong> choose LC (e.g., 2000 daN). Keep angle small (≈ 20°) and straight to the direction.</li>
                          <li><strong>Plan:</strong> Start with 4 straps forward, 2 rearward, 4 lateral. Recalculate and add if any direction shows FAIL.</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={() => navigate('/')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
