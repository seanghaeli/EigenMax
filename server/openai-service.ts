import OpenAI from "openai";
import type { Protocol } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface StrategyAnalysis {
  riskTolerance: number;
  yieldPreference: number;
  securityPreference: number;
  description: string;
}

interface ProtocolScore {
  protocol: Protocol;
  score: number;
  reasoning: string[];
}

export class OpenAIService {
  async analyzeStrategy(strategyText: string): Promise<StrategyAnalysis> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert in DeFi investment strategies and risk analysis. 
            Analyze the given investment strategy text and provide scores for different aspects.
            Consider words and phrases that indicate risk tolerance, yield preferences, and security focus.`
          },
          {
            role: "user",
            content: `Analyze this investment strategy and provide scores: "${strategyText}"`
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content);
      return {
        riskTolerance: Math.max(0, Math.min(1, result.riskTolerance)),
        yieldPreference: Math.max(0, Math.min(1, result.yieldPreference)),
        securityPreference: Math.max(0, Math.min(1, result.securityPreference)),
        description: result.description
      };
    } catch (error) {
      console.error("OpenAI strategy analysis failed:", error);
      // Fallback to basic analysis
      return {
        riskTolerance: 0.5,
        yieldPreference: 0.5,
        securityPreference: 0.5,
        description: "Using default balanced strategy due to analysis error"
      };
    }
  }

  async scoreProtocols(protocols: Protocol[], strategy: StrategyAnalysis): Promise<ProtocolScore[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert in evaluating DeFi protocols, particularly AVS (Active Validator Set) protocols.
            Score each protocol based on the user's strategy preferences:
            - Risk Tolerance: ${strategy.riskTolerance}
            - Yield Preference: ${strategy.yieldPreference}
            - Security Preference: ${strategy.securityPreference}
            
            Consider these factors:
            1. APY relative to risk
            2. Security score and audit status
            3. Historical performance and stability
            4. Node count and decentralization
            5. Slashing risk vs rewards
            6. Protocol uptime and reliability`
          },
          {
            role: "user",
            content: `Score these protocols and provide reasoning:\n${JSON.stringify(protocols, null, 2)}`
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content);
      return protocols.map(protocol => ({
        protocol,
        score: Math.max(0, Math.min(1, result[protocol.id].score)),
        reasoning: result[protocol.id].reasons
      }));
    } catch (error) {
      console.error("OpenAI protocol scoring failed:", error);
      // Fallback to basic scoring
      return protocols.map(protocol => ({
        protocol,
        score: this.calculateBasicScore(protocol, strategy),
        reasoning: ["Score calculated using basic metrics due to analysis error"]
      }));
    }
  }

  private calculateBasicScore(protocol: Protocol, strategy: StrategyAnalysis): number {
    const slashingPenalty = 1 - (protocol.slashingRisk || 0);
    const securityBonus = ((protocol.securityScore || 50) / 100) * 1.5;
    const uptimeBonus = ((protocol.avgUptimePercent || 99) / 100);
    const nodeScore = Math.min((protocol.nodeCount || 0) / 1000, 1);
    
    return (
      (protocol.apy / 100) * strategy.yieldPreference +
      slashingPenalty * (1 - strategy.riskTolerance) +
      securityBonus * strategy.securityPreference +
      (uptimeBonus + nodeScore) / 2
    ) / 4;
  }
}

export const openAIService = new OpenAIService();
