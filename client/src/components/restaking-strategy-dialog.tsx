import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  Server,
  Activity,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
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
  description?: string;
};

type AVSOpportunity = {
  protocol: Protocol;
  context: string;
  sentiment?: number;
  analysis?: string[];
};

export function RestakingStrategyDialog({
  open,
  onOpenChange,
  protocols,
  onConfirm,
}: RestakingStrategyDialogProps) {
  const [step, setStep] = useState<
    "input" | "analysis" | "opportunities" | "recommendation"
  >("input");
  const [strategy, setStrategy] = useState<string>("");
  const [analyzedStrategy, setAnalyzedStrategy] = useState<Strategy | null>(
    null,
  );
  console.log(analyzedStrategy);
  console.log("Helloo there");
  const [opportunities, setOpportunities] = useState<AVSOpportunity[]>([]);
  const [loading, setLoading] = useState(false);

  const avsProtocols = protocols.filter((p) => p.type === "avs");

  const handleStrategySubmit = async () => {
    setLoading(true);
    try {
      const analysisResponse = await fetch("/api/avs-opportunities/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy }),
      });

      const data = await analysisResponse.json();

      // Transform the values from 0-10 scale to 0-1 scale
      setAnalyzedStrategy({
        riskTolerance: data.strategy.riskTolerance / 10,
        yieldPreference: data.strategy.yieldPreference / 10,
        securityPreference: data.strategy.securityPreference / 10,
        tokens: ["wstETH", "rETH", "cbETH"],
        description: data.strategy.description,
      });

      setOpportunities(data.opportunities);
      setStep("analysis");

    } catch (error) {
      console.error("Error analyzing strategy:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 8) return "text-green-500";
    if (sentiment >= 6) return "text-blue-500";
    if (sentiment >= 4) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-none pb-4">
          <DialogTitle>
            {step === "input" && "Define Your Restaking Strategy"}
            {step === "analysis" && "AI Analysis of Your Strategy"}
            {step === "opportunities" && "Available AVS Opportunities"}
            {step === "recommendation" && "Recommended Allocation"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {step === "input" && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Describe your investment strategy and risk tolerance. For
                example: "I prefer a balanced approach with moderate risk and
                stable yields" or "I want aggressive growth with maximum yields"
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
                disabled={!strategy.trim() || loading}
              >
                {loading ? "Analyzing Strategy..." : "Analyze Strategy"}
              </Button>
            </>
          )}

          {step === "analysis" && analyzedStrategy && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {analyzedStrategy.description}
              </p>
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
                            style={{
                              width: `${analyzedStrategy.riskTolerance * 100}%`,
                            }}
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
                            style={{
                              width: `${analyzedStrategy.yieldPreference * 100}%`,
                            }}
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
                            style={{
                              width: `${analyzedStrategy.securityPreference * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Button
                  className="w-full mt-4"
                  onClick={() => setStep("opportunities")}
                >
                  View Available Opportunities
                </Button>
              </div>
            </>
          )}

          {step === "opportunities" && (
            <div className="flex flex-col h-full">
              <p className="text-sm text-muted-foreground mb-4">
                Available AVS opportunities based on your strategy:
              </p>
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {opportunities.map((opportunity) => (
                  <Card
                    key={opportunity.protocol.name}
                    className="border border-muted"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Server className="w-5 h-5 text-primary" />
                          <span className="font-medium">
                            {opportunity.protocol.name}
                          </span>
                        </div>
                        <div
                          className={`text-sm px-2 py-1 rounded bg-muted ${getSentimentColor(opportunity.sentiment || 0)}`}
                        >
                          Sentiment: {opportunity.sentiment?.toFixed(1)}/10
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {opportunity.context}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>APY: {opportunity.protocol.apy}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          <span>
                            Security: {opportunity.protocol.securityScore}/100
                          </span>
                        </div>
                      </div>
                      {opportunity.analysis && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <h4 className="font-medium mb-2">Analysis:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {opportunity.analysis.map((point, i) => (
                              <li
                                key={i}
                                className="text-muted-foreground text-sm"
                              >
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex-none py-4 border-t bg-background">
                <Button
                  className="w-full"
                  onClick={() => setStep("recommendation")}
                >
                  View Recommendations
                </Button>
              </div>
            </div>
          )}

          {step === "recommendation" && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Based on the analysis, here are your recommended AVS
                allocations:
              </p>
              <div className="space-y-4">
                {opportunities
                  .sort((a, b) => (b.sentiment || 0) - (a.sentiment || 0))
                  .slice(0, 3)
                  .map((opportunity, index) => (
                    <Card
                      key={opportunity.protocol.name}
                      className="border border-primary"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Server className="w-5 h-5 text-primary" />
                            <span className="font-medium">
                              {opportunity.protocol.name}
                            </span>
                          </div>
                          <div className="text-sm px-2 py-1 rounded bg-primary/10 text-primary">
                            {index === 0 ? "50%" : index === 1 ? "30%" : "20%"}{" "}
                            Allocation
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Sentiment Score</span>
                            <span
                              className={getSentimentColor(
                                opportunity.sentiment || 0,
                              )}
                            >
                              {opportunity.sentiment?.toFixed(1)}/10
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>APY</span>
                            <span className="text-primary">
                              {opportunity.protocol.apy.toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Security Score</span>
                            <span className="text-primary">
                              {opportunity.protocol.securityScore}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Slashing Risk</span>
                            <span
                              className={
                                opportunity.protocol.slashingRisk
                                  ? opportunity.protocol.slashingRisk > 0.05
                                    ? "text-destructive"
                                    : "text-primary"
                                  : "text-muted-foreground"
                              }
                            >
                              {opportunity.protocol.slashingRisk
                                ? (
                                    opportunity.protocol.slashingRisk * 100
                                  ).toFixed(2)
                                : "N/A"}
                              %
                            </span>
                          </div>
                        </div>
                        {opportunity.analysis && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <h4 className="font-medium mb-2">Analysis:</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {opportunity.analysis.map((point, i) => (
                                <li
                                  key={i}
                                  className="text-muted-foreground text-sm"
                                >
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
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