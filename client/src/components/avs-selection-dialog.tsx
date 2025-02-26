import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Server, Activity, Check } from "lucide-react";
import type { Protocol } from "@shared/schema";

interface AVSSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocols: Protocol[];
  onConfirm: () => void;
}

export function AVSSelectionDialog({ open, onOpenChange, protocols, onConfirm }: AVSSelectionDialogProps) {
  const [step, setStep] = useState<'initial' | 'filtering' | 'final'>('initial');
  const avsProtocols = protocols.filter(p => p.type === 'avs');

  // Sort protocols by their overall score for visualization
  const sortedProtocols = [...avsProtocols].sort((a, b) => {
    const scoreA = calculateScore(a);
    const scoreB = calculateScore(b);
    return scoreB - scoreA;
  });

  const topProtocols = sortedProtocols.slice(0, 3);

  function calculateScore(protocol: Protocol) {
    const slashingPenalty = 1 - (protocol.slashingRisk || 0);
    const securityBonus = ((protocol.securityScore || 50) / 100) * 1.5;
    const uptimeBonus = ((protocol.avgUptimePercent || 99) / 100);
    const nodeScore = Math.min((protocol.nodeCount || 0) / 1000, 1);
    
    return protocol.apy * slashingPenalty * securityBonus * uptimeBonus * nodeScore;
  }

  function getScoreBreakdown(protocol: Protocol) {
    return {
      apy: protocol.apy,
      slashingRisk: (protocol.slashingRisk || 0) * 100,
      security: protocol.securityScore || 50,
      uptime: protocol.avgUptimePercent || 99,
      nodes: protocol.nodeCount || 0
    };
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 'initial' && "Available AVS Protocols"}
            {step === 'filtering' && "Analyzing Protocol Safety & Performance"}
            {step === 'final' && "Optimized Restaking Selection"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'initial' && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Analyzing {avsProtocols.length} available AVS protocols for optimal restaking allocation
              </p>
              <div className="grid gap-4">
                {avsProtocols.map(protocol => (
                  <Card key={protocol.name} className="border border-muted">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Server className="w-5 h-5 text-primary" />
                          <span className="font-medium">{protocol.name}</span>
                        </div>
                        <div className="text-sm px-2 py-1 rounded bg-muted">
                          APY: {protocol.apy.toFixed(2)}%
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <span>Security Score: {protocol.securityScore}/100</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            <span>Uptime: {protocol.avgUptimePercent}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={() => setStep('filtering')}
              >
                Analyze Protocols
              </Button>
            </>
          )}

          {step === 'filtering' && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Scoring protocols based on security, performance, and yield metrics
              </p>
              <div className="space-y-4">
                {sortedProtocols.map(protocol => {
                  const score = calculateScore(protocol);
                  const metrics = getScoreBreakdown(protocol);
                  
                  return (
                    <Card 
                      key={protocol.name} 
                      className={`border ${
                        topProtocols.includes(protocol) 
                          ? 'border-primary' 
                          : 'border-muted opacity-50'
                      }`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Server className="w-5 h-5 text-primary" />
                            <span className="font-medium">{protocol.name}</span>
                          </div>
                          <div className="text-sm px-2 py-1 rounded bg-primary/10 text-primary">
                            Score: {(score * 100).toFixed(0)}
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>APY</span>
                            <span className="text-primary">{metrics.apy.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Slashing Risk</span>
                            <span className={metrics.slashingRisk > 5 ? 'text-destructive' : 'text-primary'}>
                              {metrics.slashingRisk.toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Security Score</span>
                            <span className={metrics.security < 70 ? 'text-warning' : 'text-primary'}>
                              {metrics.security}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Uptime</span>
                            <span className={metrics.uptime < 99 ? 'text-warning' : 'text-primary'}>
                              {metrics.uptime}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Active Nodes</span>
                            <span className="text-primary">{metrics.nodes}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={() => setStep('final')}
              >
                View Optimal Selection
              </Button>
            </>
          )}

          {step === 'final' && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Selected the top 3 protocols based on optimal balance of yield and security
              </p>
              <div className="space-y-4">
                {topProtocols.map((protocol, index) => (
                  <Card key={protocol.name} className="border border-primary">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-primary" />
                          <span className="font-medium">{protocol.name}</span>
                        </div>
                        <div className="text-sm px-2 py-1 rounded bg-primary/10 text-primary">
                          Priority {index + 1}
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p>
                          Recommended allocation: {index === 0 ? '50%' : index === 1 ? '30%' : '20%'}
                        </p>
                        <p className="text-muted-foreground">
                          {index === 0 && "Primary allocation for optimal yield"}
                          {index === 1 && "Secondary allocation for risk diversification"}
                          {index === 2 && "Safety reserve with good uptime"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={() => {
                  onConfirm();
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
