import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Server, Activity, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import type { Protocol } from "@shared/schema";

interface RestakingStrategyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocols: Protocol[];
  onConfirm: (strategy: string) => void;
}

type Strategy = {
  riskTolerance: number;
  yieldPreference: number;
  securityPreference: number;
  tokens: string[];
};

export function RestakingStrategyDialog({ open, onOpenChange, protocols, onConfirm }: RestakingStrategyDialogProps) {
  const [step, setStep] = useState<'input' | 'analysis' | 'recommendation'>('input');
  const [strategy, setStrategy] = useState<string>('');
  const [analyzedStrategy, setAnalyzedStrategy] = useState<Strategy | null>(null);
  const [selectedProtocols, setSelectedProtocols] = useState<Protocol[]>([]);

  const avsProtocols = protocols.filter(p => p.type === 'avs');

  const analyzeStrategy = (strategyText: string): Strategy => {
    // Simple sentiment analysis (placeholder for LLM integration)
    const riskKeywords = {
      high: ['aggressive', 'high risk', 'maximum yield', 'growth'],
      moderate: ['balanced', 'moderate', 'mixed'],
      low: ['conservative', 'safe', 'stable', 'minimum risk']
    };

    const text = strategyText.toLowerCase();
    let riskTolerance = 0.5; // Default moderate
    let yieldPreference = 0.5;
    let securityPreference = 0.5;

    // Analyze risk tolerance
    if (riskKeywords.high.some(word => text.includes(word))) {
      riskTolerance = 0.8;
      yieldPreference = 0.7;
      securityPreference = 0.3;
    } else if (riskKeywords.low.some(word => text.includes(word))) {
      riskTolerance = 0.2;
      yieldPreference = 0.3;
      securityPreference = 0.8;
    }

    return {
      riskTolerance,
      yieldPreference,
      securityPreference,
      tokens: ['wstETH', 'rETH', 'cbETH']
    };
  };

  const matchProtocols = (userStrategy: Strategy) => {
    const scoredProtocols = avsProtocols.map(protocol => {
      const yieldScore = protocol.apy / Math.max(...avsProtocols.map(p => p.apy));
      const securityScore = (protocol.securityScore || 50) / 100;
      const riskScore = 1 - (protocol.slashingRisk || 0);
      const uptimeScore = (protocol.avgUptimePercent || 99) / 100;

      const totalScore = (
        yieldScore * userStrategy.yieldPreference +
        securityScore * userStrategy.securityPreference +
        riskScore * (1 - userStrategy.riskTolerance) +
        uptimeScore
      ) / 4;

      return { protocol, score: totalScore };
    });

    const sortedProtocols = scoredProtocols
      .sort((a, b) => b.score - a.score)
      .map(({ protocol }) => protocol)
      .slice(0, 3);

    setSelectedProtocols(sortedProtocols);
  };

  const handleStrategySubmit = () => {
    const analysis = analyzeStrategy(strategy);
    setAnalyzedStrategy(analysis);
    matchProtocols(analysis);
    setStep('analysis');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 'input' && "Define Your Restaking Strategy"}
            {step === 'analysis' && "Analyzing Your Strategy"}
            {step === 'recommendation' && "Recommended Allocation"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'input' && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Describe your investment strategy and risk tolerance. For example:
                "I prefer a balanced approach with moderate risk and stable yields"
                or "I want aggressive growth with maximum yields"
              </p>
              <Textarea
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                placeholder="Enter your investment strategy..."
                className="min-h-[100px]"
              />
              <Button 
                className="w-full mt-4" 
                onClick={handleStrategySubmit}
                disabled={!strategy.trim()}
              >
                Analyze Strategy
              </Button>
            </>
          )}

          {step === 'analysis' && analyzedStrategy && (
            <>
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">Strategy Analysis</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Risk Tolerance
                        </span>
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${analyzedStrategy.riskTolerance * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Yield Preference
                        </span>
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${analyzedStrategy.yieldPreference * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          Security Preference
                        </span>
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${analyzedStrategy.securityPreference * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Button 
                  className="w-full mt-4" 
                  onClick={() => setStep('recommendation')}
                >
                  View Recommendations
                </Button>
              </div>
            </>
          )}

          {step === 'recommendation' && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Based on your strategy, here are the recommended AVS protocols for restaking:
              </p>
              <div className="space-y-4">
                {selectedProtocols.map((protocol, index) => (
                  <Card key={protocol.name} className="border border-primary">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Server className="w-5 h-5 text-primary" />
                          <span className="font-medium">{protocol.name}</span>
                        </div>
                        <div className="text-sm px-2 py-1 rounded bg-primary/10 text-primary">
                          {index === 0 ? '50%' : index === 1 ? '30%' : '20%'} Allocation
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>APY</span>
                          <span className="text-primary">{protocol.apy.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Security Score</span>
                          <span className="text-primary">{protocol.securityScore}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Slashing Risk</span>
                          <span className={protocol.slashingRisk > 0.05 ? 'text-destructive' : 'text-primary'}>
                            {(protocol.slashingRisk * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Uptime</span>
                          <span className="text-primary">{protocol.avgUptimePercent}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={() => {
                  onConfirm(strategy);
                  onOpenChange(false);
                }}
              >
                Confirm Restaking
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
