// Layer 3: Job Analyzer (evaluates profitability and feasibility)
export class JobAnalyzer {
  constructor(config = {}) {
    this.minHourlyRate = config.minHourlyRate || 15; // $15/hour minimum
    this.maxEstimatedHours = config.maxEstimatedHours || 4; // Max 4 hours per job
    this.minBudget = config.minBudget || 5; // $5 minimum
  }

  analyze(job) {
    const budget = parseFloat(job.budgetUsdc);
    const estimatedHours = this.estimateHours(job);
    const hourlyRate = budget / estimatedHours;
    const complexity = this.assessComplexity(job);
    const feasibility = this.assessFeasibility(job);
    
    const score = this.calculateScore({
      budget,
      hourlyRate,
      estimatedHours,
      complexity,
      feasibility
    });
    
    return {
      shouldBid: score >= 0.5 && hourlyRate >= this.minHourlyRate,
      score,
      budget,
      estimatedHours,
      hourlyRate,
      complexity,
      feasibility,
      reasoning: this.generateReasoning(score, hourlyRate, complexity, feasibility)
    };
  }

  estimateHours(job) {
    const budget = parseFloat(job.budgetUsdc);
    const description = (job.description || '').toLowerCase();
    const title = (job.title || '').toLowerCase();
    
    // Base estimate from budget
    let hours = budget / 25; // Assume $25/hour baseline
    
    // Adjust based on keywords
    const complexKeywords = ['complex', 'advanced', 'detailed', 'comprehensive', 'extensive'];
    const simpleKeywords = ['simple', 'basic', 'quick', 'short', 'brief'];
    
    if (complexKeywords.some(kw => description.includes(kw) || title.includes(kw))) {
      hours *= 1.5;
    }
    
    if (simpleKeywords.some(kw => description.includes(kw) || title.includes(kw))) {
      hours *= 0.7;
    }
    
    // Template-based adjustments
    const template = job.template?.name;
    const templateHours = {
      'Translation': 0.5,
      'Data Entry': 1,
      'Content Writing': 1.5,
      'Code Review': 1,
      'Bug Fix': 2,
      'API Integration': 3,
      'SEO Article': 2
    };
    
    if (template && templateHours[template]) {
      hours = templateHours[template];
    }
    
    return Math.max(0.25, Math.min(hours, this.maxEstimatedHours));
  }

  assessComplexity(job) {
    const description = (job.description || '').toLowerCase();
    let complexity = 0.5; // Medium by default
    
    const highComplexity = ['algorithm', 'optimization', 'architecture', 'security', 'blockchain'];
    const lowComplexity = ['copy', 'paste', 'simple', 'basic', 'straightforward'];
    
    if (highComplexity.some(kw => description.includes(kw))) {
      complexity = 0.8;
    } else if (lowComplexity.some(kw => description.includes(kw))) {
      complexity = 0.3;
    }
    
    return complexity;
  }

  assessFeasibility(job) {
    const description = (job.description || '').toLowerCase();
    let feasibility = 0.8; // High by default
    
    // Red flags
    const redFlags = [
      'urgent', 'asap', 'immediately', 'rush',
      'perfect', 'flawless', 'guaranteed',
      'unlimited revisions', 'ongoing', 'maintenance'
    ];
    
    if (redFlags.some(flag => description.includes(flag))) {
      feasibility -= 0.3;
    }
    
    // Green flags
    const greenFlags = [
      'clear requirements', 'well-defined', 'specific',
      'example provided', 'template', 'structured'
    ];
    
    if (greenFlags.some(flag => description.includes(flag))) {
      feasibility += 0.1;
    }
    
    return Math.max(0, Math.min(feasibility, 1));
  }

  calculateScore(metrics) {
    const {
      budget,
      hourlyRate,
      estimatedHours,
      complexity,
      feasibility
    } = metrics;
    
    // Weighted scoring
    let score = 0;
    
    // Budget score (20%)
    if (budget >= this.minBudget) {
      score += 0.2 * Math.min(budget / 100, 1);
    }
    
    // Hourly rate score (40%)
    if (hourlyRate >= this.minHourlyRate) {
      score += 0.4 * Math.min(hourlyRate / 50, 1);
    }
    
    // Time score (20%)
    if (estimatedHours <= this.maxEstimatedHours) {
      score += 0.2 * (1 - estimatedHours / this.maxEstimatedHours);
    }
    
    // Complexity score (10%) - prefer lower complexity
    score += 0.1 * (1 - complexity);
    
    // Feasibility score (10%)
    score += 0.1 * feasibility;
    
    return Math.max(0, Math.min(score, 1));
  }

  generateReasoning(score, hourlyRate, complexity, feasibility) {
    if (score >= 0.8) {
      return `Excellent opportunity: $${hourlyRate.toFixed(2)}/hr, low complexity, high feasibility`;
    } else if (score >= 0.6) {
      return `Good opportunity: $${hourlyRate.toFixed(2)}/hr, acceptable risk/reward`;
    } else if (hourlyRate < this.minHourlyRate) {
      return `Below minimum rate: $${hourlyRate.toFixed(2)}/hr < $${this.minHourlyRate}/hr`;
    } else if (complexity > 0.7) {
      return `Too complex for estimated budget`;
    } else if (feasibility < 0.5) {
      return `Low feasibility: unclear requirements or red flags`;
    } else {
      return `Score too low: ${(score * 100).toFixed(0)}% < 60% threshold`;
    }
  }
}
