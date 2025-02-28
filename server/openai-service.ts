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

interface AVSOpportunity {
  protocol: Protocol;
  context: string;
  sentiment?: number;
  analysis?: string[];
}

const AVS_OPPORTUNITIES: AVSOpportunity[] = [
  {
    protocol: {
      name: "EigenLayer",
      type: "avs",
      apy: 8.5,
      securityScore: 95,
      slashingRisk: 0.01,
      avgUptimePercent: 99.9,
      nodeCount: 1000,
    } as Protocol,
    context: `EigenLayer is a pioneering protocol in Ethereum's restaking ecosystem, allowing users to 
    restake their ETH across multiple services. Known for its robust security measures and extensive 
    auditing, it maintains high uptime and has a large, well-distributed node network. The protocol 
    emphasizes risk management through careful operator selection and progressive decentralization.`,
  },
  {
    protocol: {
      name: "Obol Network",
      type: "avs",
      apy: 12.0,
      securityScore: 88,
      slashingRisk: 0.02,
      avgUptimePercent: 99.5,
      nodeCount: 500,
    } as Protocol,
    context: `Obol Network specializes in distributed validator technology, enabling multiple operators 
    to jointly manage validator duties. While offering higher yields, it implements advanced slashing 
    protection mechanisms and focuses on validator performance optimization. The protocol is newer but 
    has shown strong growth in node adoption and technical innovation.`,
  },
  {
    protocol: {
      name: "SSV Network",
      type: "avs",
      apy: 10.0,
      securityScore: 92,
      slashingRisk: 0.015,
      avgUptimePercent: 99.7,
      nodeCount: 750,
    } as Protocol,
    context: `SSV Network provides distributed validator infrastructure with emphasis on decentralization 
    and fault tolerance. Their approach splits validator responsibilities across multiple operators, 
    reducing single points of failure. The protocol has demonstrated consistent performance and maintains 
    a good balance between security and yield generation.`,
  },
];

export class OpenAIService {
  async analyzeStrategy(strategyText: string): Promise<StrategyAnalysis> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert in DeFi investment strategies and risk analysis. 
            Analyze the given investment strategy text and provide scores in a JSON object.
            Evaluate risk tolerance, yield preference, and security preference on a scale of 0-10.
            Format your response as a JSON:
            {
              "riskTolerance": [0-10],
              "yieldPreference": [0-10],
              "securityPreference": [0-10],
              "description": "Brief summary of the strategy"
            }`,
          },
          {
            role: "user",
            content: `Analyze this investment strategy and return a JSON object with scores between 0 and 10: "${strategyText}"`,
          },
        ],
        response_format: { type: "json_object" },
      });

      console.log("OpenAI response received:");
      const content = response.choices[0].message.content;
      console.log(content);

      const result = JSON.parse(content);
      console.log("Parsed result:", result);

      return {
        riskTolerance: Math.max(0, Math.min(10, result.riskTolerance || 5)),
        yieldPreference: Math.max(0, Math.min(10, result.yieldPreference || 5)),
        securityPreference: Math.max(0, Math.min(10, result.securityPreference || 5)),
        description: result.description || "Strategy analysis",
      };
    } catch (error) {
      console.error("OpenAI strategy analysis failed:", error);
      return {
        riskTolerance: 5,
        yieldPreference: 5,
        securityPreference: 5,
        description: "Using default balanced strategy due to analysis error",
      };
    }
  }

  async analyzeAVSOpportunities(
    strategyAnalysis: StrategyAnalysis,
    strategyText: string,
  ): Promise<AVSOpportunity[]> {
    const opportunities = [...AVS_OPPORTUNITIES];

    for (const opportunity of opportunities) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an expert in evaluating DeFi protocols, particularly AVS opportunities.
              The user's investment strategy is: "${strategyText}"

              Their preferences based on analysis:
              - Risk Tolerance: ${strategyAnalysis.riskTolerance}/10
              - Yield Preference: ${strategyAnalysis.yieldPreference}/10
              - Security Preference: ${strategyAnalysis.securityPreference}/10

              Analyze this AVS opportunity and provide:
              1. A sentiment score (0-10) indicating how well it matches the user's preferences and strategy
              2. A list of key points explaining why this opportunity aligns or doesn't align with their strategy

              Format your response as a JSON:
              {
                "sentiment": [0-10],
                "analysis": ["point 1", "point 2", ...]
              }`,
            },
            {
              role: "user",
              content: `Protocol: ${opportunity.protocol.name}
              Context: ${opportunity.context}
              Metrics:
              - APY: ${opportunity.protocol.apy}%
              - Security Score: ${opportunity.protocol.securityScore}/100
              - Slashing Risk: ${opportunity.protocol.slashingRisk * 100}%
              - Uptime: ${opportunity.protocol.avgUptimePercent}%
              - Active Nodes: ${opportunity.protocol.nodeCount}`,
            },
          ],
          response_format: { type: "json_object" },
        });

        const result = JSON.parse(response.choices[0].message.content);
        opportunity.sentiment = Math.max(0, Math.min(10, result.sentiment));
        opportunity.analysis = result.analysis;
      } catch (error) {
        console.error(`Failed to analyze ${opportunity.protocol.name}:`, error);
        opportunity.sentiment = 5; // Neutral fallback
        opportunity.analysis = ["Analysis unavailable due to error"];
      }
    }

    return opportunities;
  }

  async scoreProtocols(
    protocols: Protocol[],
    strategy: StrategyAnalysis,
  ): Promise<ProtocolScore[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert in evaluating DeFi protocols, particularly AVS protocols.
            Score each protocol based on the user's strategy preferences:
            - Risk Tolerance: ${strategy.riskTolerance}/10
            - Yield Preference: ${strategy.yieldPreference}/10
            - Security Preference: ${strategy.securityPreference}/10

            Consider these factors:
            1. APY relative to risk
            2. Security score and audit status
            3. Historical performance and stability
            4. Node count and decentralization
            5. Slashing risk vs rewards
            6. Protocol uptime and reliability

            For each protocol, provide:
            1. A score between 0 and 1
            2. A list of reasons supporting the score`,
          },
          {
            role: "user",
            content: `Score these protocols and provide reasoning:\n${JSON.stringify(protocols, null, 2)}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content);
      return protocols.map(protocol => ({
        protocol,
        score: Math.max(0, Math.min(1, result[protocol.id].score)),
        reasoning: result[protocol.id].reasons,
      }));
    } catch (error) {
      console.error("OpenAI protocol scoring failed:", error);
      return protocols.map(protocol => ({
        protocol,
        score: this.calculateBasicScore(protocol, strategy),
        reasoning: [
          "Score calculated using basic metrics due to analysis error",
        ],
      }));
    }
  }

  private calculateBasicScore(
    protocol: Protocol,
    strategy: StrategyAnalysis,
  ): number {
    const slashingPenalty = 1 - (protocol.slashingRisk || 0);
    const securityBonus = ((protocol.securityScore || 50) / 100) * 1.5;
    const uptimeBonus = ((protocol.avgUptimePercent || 99) / 100);
    const nodeScore = Math.min((protocol.nodeCount || 0) / 1000, 1);

    return (
      (protocol.apy / 100) * (strategy.yieldPreference / 10) +
      slashingPenalty * (1 - strategy.riskTolerance / 10) +
      securityBonus * (strategy.securityPreference / 10) +
      (uptimeBonus + nodeScore) / 2
    ) / 4;
  }

  getAVSOpportunities(): AVSOpportunity[] {
    return AVS_OPPORTUNITIES;
  }
}

export const openAIService = new OpenAIService();