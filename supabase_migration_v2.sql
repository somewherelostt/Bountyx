-- Add cryptographic anchoring fields to submissions table
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS content_hash text,
ADD COLUMN IF NOT EXISTS block_timestamp bigint; -- Storing block timestamp usually more useful for ordering than number, or store both?
-- Plan said block_number. Let's start with block_number as it's a discrete point in time for "soft anchoring".
-- Actually, timestamp is better for "when did this happen". Block number is better for "what was the chain state".
-- Let's stick to the plan: content_hash and block_number.

ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS block_number bigint;

COMMENT ON COLUMN submissions.content_hash IS 'SHA-256 hash of the submission content + contact';
COMMENT ON COLUMN submissions.block_number IS 'Arbitrum Sepolia block number at time of submission';

-- Create AI Reviews Audit Table
CREATE TABLE IF NOT EXISTS ai_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid REFERENCES submissions(id) ON DELETE CASCADE,
  bounty_id uuid REFERENCES bounties(id) ON DELETE CASCADE,
  model_name text NOT NULL,
  prompt_snapshot text, -- Full prompt used (optional, or just strict version)
  raw_response text, -- Full unmodified JSON/text from Gemini
  score integer,
  reasoning text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS (public read, service-only write)
ALTER TABLE ai_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reviews are viewable by everyone" ON ai_reviews FOR SELECT USING (true);
-- Write policy handles by service role, no public insert.

