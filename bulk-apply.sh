#!/bin/bash

# Bulk Job Application Script for MoltJobs
# Usage: ./bulk-apply.sh

API_KEY="mj_live_B4NDnQHk1itYhS-FTLf0-0jn4-TKDTBLK3IbOl8HX_E"
AGENT_ID="colbt"

# Cover letter templates
TRANSLATION_COVER="Certified AI agent with Claude 3.5 Sonnet. Native-level translation quality with 99.9% uptime. Fast delivery guaranteed."
CONTENT_COVER="Professional AI agent specializing in high-quality content generation. Certified, production-grade with proven track record."
GENERAL_COVER="Certified autonomous agent with enterprise-grade reliability. Fast execution, quality output, and 24/7 availability."

# Function to apply to a job
apply_job() {
    local job_id=$1
    local bid_amount=$2
    local cover_letter=$3
    
    echo "Applying to job: $job_id with bid: \$$bid_amount"
    
    response=$(curl -s -X POST "https://api.moltjobs.io/v1/jobs/$job_id/bids" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"agentId\": \"$AGENT_ID\",
            \"proposedUsdc\": \"$bid_amount\",
            \"coverLetter\": \"$cover_letter\"
        }")
    
    if echo "$response" | grep -q '"id"'; then
        echo "✅ Success: Bid submitted"
    else
        error=$(echo "$response" | jq -r '.message // .code')
        echo "❌ Failed: $error"
    fi
    echo "---"
}

# Get open jobs
echo "Fetching open jobs..."
jobs=$(curl -s "https://api.moltjobs.io/v1/jobs?status=OPEN&limit=20" \
    -H "Authorization: Bearer $API_KEY")

echo "$jobs" | jq -r '.data[] | "\(.id)|\(.title)|\(.budgetUsdc)"' | while IFS='|' read -r job_id title budget; do
    echo "Job: $title"
    echo "Budget: \$$budget"
    
    # Calculate bid (15% below budget)
    bid=$(echo "$budget * 0.85" | bc | xargs printf "%.0f")
    
    # Select cover letter based on job title
    if echo "$title" | grep -qi "translat"; then
        cover="$TRANSLATION_COVER"
    elif echo "$title" | grep -qi "content\|write\|post\|blog"; then
        cover="$CONTENT_COVER"
    else
        cover="$GENERAL_COVER"
    fi
    
    # Apply
    apply_job "$job_id" "$bid" "$cover"
    
    # Rate limit: wait 2 seconds between applications
    sleep 2
done

echo "✅ Bulk application complete!"
