

markdown#  Legal Code Assistant - 30-Day Master Plan

**Project:** AI-Powered Pakistani Legal Assistant
**Duration:** 30 Days (Start: Monday)
**Daily Hours:** 8-10 hours
**Goal:** Production SaaS + FYP A+ Grade

## ---

## ##  Project Overview

## ### What We're Building
- ✅ AI chatbot for Pakistani law (PPC, CrPC, QSO)
- ✅ FIR Generator (auto-generate FIR from user story)
- ✅ Voice Assistant (speak in Roman Urdu/English)
- ✅ Case Outcome Predictor (bail/conviction probability)
- ✅ Document Analyzer (upload FIR/contract → AI analysis)
- ✅ Payment System (JazzCash integration)

## ### Tech Stack
Frontend: Next.js 14 + TypeScript + Tailwind CSS + Shadcn/UI
Backend: Next.js API Routes + Supabase + Qdrant + Neo4j
AI: Groq (Llama 3.1-70B) - FREE
Payments: JazzCash Business API
Deploy: Vercel (Frontend) + Supabase Cloud (Backend)
Tools: Cursor AI (for coding)

## ### Success Targets
- ✅ Production app working
- ✅ 1000+ legal sections indexed
- ✅ 6 advanced features complete
- ✅ Payment integration live
- ✅ 100+ beta users
- ✅ Rs. 25K revenue in Month 1
- ✅ FYP A+ grade

## ---

## ##  HOW TO USE THIS PLAN

### With Cursor AI
- Open Cursor AI editor
- Read each step below
- Copy the **Cursor Prompt** from that step

- Paste in Cursor's AI chat
- Let Cursor generate the code
- Review and run the code

## ### Manual Tasks
- Steps marked **"MANUAL"** → You do yourself
- Steps marked **"Cursor Prompt"** → Give to Cursor AI

## ### Time Management
- Each step shows estimated time
- Work 8-10 hours daily
- Take 10-min breaks every 2 hours
- Balance with mids study (study mornings, code afternoons/nights)

## ---

## ##  COMPLETE STEP-BY-STEP BREAKDOWN

## ---

## STEP 1: Initial Setup (Day 1 - 3 hours)

## ### What You'll Do
Install tools, create Next.js project, setup folders

## ### Prerequisites
Make sure installed:
## - ✅ Node.js 18+ (check: `node --version`)
## - ✅ Git (check: `git --version`)
- ✅ VS Code or Cursor AI
## - ✅ Python 3.8+ (check: `python --version`)

## ### Manual Steps

## **1. Create Next.js Project**
## ```bash
# Open terminal and run:
npx create-next-app@latest legal-code-assistant --typescript --tailwind --app --use-npm

# When prompted:
# ✔ TypeScript? Yes
# ✔ ESLint? Yes
# ✔ Tailwind CSS? Yes
# ✔ src/ directory? No

## # ✔ App Router? Yes
# ✔ Import alias? No

cd legal-code-assistant
## ```

## **2. Install All Dependencies**
## ```bash
# Core packages
npm install @supabase/supabase-js groq-sdk @qdrant/js-client-rest
npm install lucide-react sonner zustand framer-motion
npm install neo4j-driver langchain recharts date-fns

# Shadcn UI setup
npx shadcn-ui@latest init
# Choose: Default style, Slate color, CSS variables: yes

# Install UI components (one command)
npx shadcn-ui@latest add button input textarea card badge dialog dropdown-menu tabs toast
avatar select separator
## ```

## **3. Create Folder Structure**
## ```bash
mkdir -p data/raw-pdfs
mkdir -p data/scripts
mkdir -p data/extracted
mkdir -p data/processed
mkdir -p lib
mkdir -p components
## ```

## **4. Setup Git**
## ```bash
git init
git add .
git commit -m "Initial setup"

# Create repo on GitHub first, then:
git remote add origin YOUR_GITHUB_URL
git push -u origin main
## ```

## **5. Create Environment Variables**


Create `.env.local` file in root folder:
## ```env
# Groq API
## GROQ_API_KEY=

## # Supabase
## NEXT_PUBLIC_SUPABASE_URL=
## NEXT_PUBLIC_SUPABASE_ANON_KEY=
## SUPABASE_SERVICE_ROLE_KEY=

## # Qdrant
## QDRANT_URL=
## QDRANT_API_KEY=

## # Neo4j
## NEO4J_URI=
NEO4J_USERNAME=neo4j
## NEO4J_PASSWORD=

# JazzCash (add later)
## JAZZCASH_MERCHANT_ID=
## JAZZCASH_PASSWORD=
## JAZZCASH_SALT=

## # App
NEXT_PUBLIC_URL=http://localhost:3000
## ```

**✅ Step 1 Complete!** You now have basic project structure.

## ---

## STEP 2: Create All Accounts (Day 1 - 2 hours)

## ### What You'll Do
Sign up for all free services we need

### Manual Steps (Do these now)

**1. Groq (FREE AI API)**
- Go to: https://console.groq.com
- Click "Sign in with Google"
- Go to API Keys → Create API Key

- Copy key → Paste in `.env.local` as `GROQ_API_KEY`

**2. Supabase (FREE Database)**
- Go to: https://supabase.com
- Sign up with GitHub
- Click "New Project"
- Choose organization → Create project
- Wait 2 minutes for setup
- Go to Settings → API
- Copy `URL` → Paste in `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`
- Copy `anon public` key → Paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy `service_role` key → Paste as `SUPABASE_SERVICE_ROLE_KEY`

**3. Qdrant Cloud (FREE Vector DB)**
- Go to: https://qdrant.tech
- Sign up (free account)
- Create Cluster → Choose "Free tier" (1GB)
- Wait for cluster creation
- Click on cluster → Get API credentials
- Copy `Cluster URL` → Paste in `.env.local` as `QDRANT_URL`
- Copy `API Key` → Paste as `QDRANT_API_KEY`

**4. Neo4j Aura (FREE Graph DB)**
- Go to: https://neo4j.com/cloud/aura-free/
- Sign up
## - Create Free Instance
- Choose region closest to you
- Download credentials (IMPORTANT: save the password!)
- Copy `URI` → Paste in `.env.local` as `NEO4J_URI`
- Username is always `neo4j`
- Copy password → Paste as `NEO4J_PASSWORD`

**5. Vercel (FREE Hosting)**
- Go to: https://vercel.com
- Sign up with GitHub
- No setup needed now (we'll use later)

**6. Create GitHub Repository**
- Go to: https://github.com/new
## - Name: `legal-code-assistant`
- Public repository
- Don't initialize with README
- Create repository
- Copy the URL (you already added in Step 1)


**✅ Step 2 Complete!** All accounts created, credentials saved.

## ---

## STEP 3: Data Collection (Day 1-2 - 5 hours)

## ### What You'll Do
Download Pakistani law PDFs manually

## ### MANUAL WORK - YOU MUST DO THIS

**Option A: Download PDFs (Recommended)**

- **Pakistan Penal Code (PPC 1860)**
- Go to: http://www.pakistancode.gov.pk/
- Navigate: "Laws" → "Pakistan Penal Code 1860"
- Download complete PDF
- Save as: `data/raw-pdfs/ppc.pdf`
- Size: ~5-10 MB
## - Sections: 1-511

- **Code of Criminal Procedure (CrPC 1898)**
- Same website
- Navigate: "Laws" → "Code of Criminal Procedure 1898"
- Download complete PDF
- Save as: `data/raw-pdfs/crpc.pdf`
## - Sections: 1-565

- **Qanun-e-Shahadat Order (QSO 1984)**
- Same website
- Navigate: "Ordinances" → "Qanun-e-Shahadat Order 1984"
- Download complete PDF
- Save as: `data/raw-pdfs/qso.pdf`
## - Articles: 1-165

**Option B: Alternative Sources (if main site down)**

Try these:
- Supreme Court: https://www.supremecourt.gov.pk/
- Pakistan Law Site: http://www.pakistanlawsite.com/
- Google: "Pakistan Penal Code PDF free download"
- Ask law students for PDFs


**Option C: Manual Text Copy (Last Resort)**

If PDFs not available:
- Copy text section by section from websites
- Save in text files:
data/raw-text/ppc.txt
data/raw-text/crpc.txt
data/raw-text/qso.txt
- Format each section clearly

**Verification**
After download, check:
## ```bash
ls -lh data/raw-pdfs/
# Should show:
# ppc.pdf (5-10 MB)
# crpc.pdf (3-5 MB)
# qso.pdf (1-2 MB)
## ```

**✅ Step 3 Complete!** You have all legal PDFs.

## ---

## STEP 4: Extract Text from PDFs (Day 2 - 4 hours)

## ### What You'll Do
Use Python script to extract sections from PDFs

## ### Manual: Install Python Libraries
## ```bash
pip install pdfplumber pandas
# or
pip3 install pdfplumber pandas
## ```

## ### Cursor Prompt

Copy this **exact prompt** and paste in Cursor AI:
Create a comprehensive Python script at data/scripts/extract_sections.py that extracts legal
sections from PDF files.
## Requirements:

Use pdfplumber library to read PDFs

Extract text from all pages with progress logging
Parse sections using regex patterns:

For PPC/CrPC: Match "Section XXX. Title" followed by content
For QSO: Match "Article XXX. Title" followed by content
Handle variations: "SECTION", "Section", different spacing


For each section, extract:

section_number (e.g., "302", "154")
title (e.g., "Punishment for murder")
text (full section content, max 2000 chars)
statute (PPC, CrPC, or QSO)
Create unique id (e.g., "PPC-302")
full_reference (e.g., "Section 302 PPC")


Clean text:

Remove extra whitespace
Remove page numbers
Fix line breaks


Save output:

data/extracted/ppc_sections.json
data/extracted/crpc_sections.json
data/extracted/qso_sections.json
data/processed/all_legal_data.json (combined)


JSON structure for each section:
## {
"id": "PPC-302",
## "section_number": "302",
"title": "Punishment for murder",
"text": "Whoever commits murder shall be punished...",
"statute": "PPC",
"full_reference": "Section 302 PPC"
## }
Error handling:


Try-catch for file operations
Validate PDF exists before processing
Log errors with details


Progress display:

Show which PDF is being processed
Show page count
Show sections extracted
Print final statistics


At end, print:

Total sections extracted
Breakdown by statute
File locations



Make code clean, well-commented, production-ready.

## ### Manual Steps

**1. Run the Script**
## ```bash
cd data/scripts
python extract_sections.py
## ```

## **2. Expected Output**
Processing PPC...
✓ Extracted text from 250 pages
✓ Parsed 511 sections
Saved to data/extracted/ppc_sections.json
Processing CrPC...
✓ Extracted text from 200 pages
✓ Parsed 565 sections
Saved to data/extracted/crpc_sections.json
Processing QSO...
✓ Extracted text from 80 pages
✓ Parsed 165 sections
Saved to data/extracted/qso_sections.json

## ✅ COMPLETE
Total: 1241 sections
Combined: data/processed/all_legal_data.json

## **3. Verify Output**
## ```bash
# Check if files created
ls data/processed/

# View first section
cat data/processed/all_legal_data.json | head -n 30
## ```

**If extraction fails:**
- Check if PDFs are in correct folder
- Check if PDFs are readable (open manually)
- Try different regex patterns
- Ask me for help with error message

**✅ Step 4 Complete!** You have 1200+ sections in JSON format.

## ---

## STEP 5: Create Vector Embeddings (Day 2-3 - 4 hours)

## ### What You'll Do
Convert text to vectors and upload to Qdrant

## ### Manual: Install Python Libraries
## ```bash
pip install sentence-transformers qdrant-client python-dotenv tqdm
## ```

## ### Cursor Prompt
Create data/scripts/create_embeddings.py that creates vector embeddings and uploads to
## Qdrant Cloud.
## Requirements:

Load data/processed/all_legal_data.json
Import libraries:

sentence_transformers (SentenceTransformer)
qdrant_client (QdrantClient)
dotenv (load environment variables)

tqdm (progress bar)


Load environment variables from .env file (create data/scripts/.env with QDRANT_URL and
## QDRANT_API_KEY)
## Initialize:

Model: SentenceTransformer('all-MiniLM-L6-v2')
Qdrant client with URL and API key


Create collection:

## Name: "legal_sections"
Vector size: 384 (model output dimension)
## Distance: Cosine
Check if exists first, recreate if needed


For each section:

Combine title + text for embedding
Create embedding vector
Create PointStruct with:

id: unique integer (use enumerate index)
vector: embedding as list
payload: full section data (id, section_number, title, text, statute, full_reference)




Upload in batches:

Batch size: 100 sections
Use tqdm progress bar
Show: "Uploading batch X/Y"


Error handling:

Try-catch for Qdrant connection
Validate data before upload
Retry failed batches



At end, print:

Total sections uploaded
Collection name
Vector size
Test query result (search for "murder")



Make it robust with detailed logging.

## ### Manual Steps

**1. Create .env file in data/scripts/**
## ```bash
cd data/scripts
nano .env
# or use any text editor

# Add these lines:
QDRANT_URL=your_qdrant_url_from_step_2
QDRANT_API_KEY=your_qdrant_api_key_from_step_2
## ```

## **2. Run Script**
## ```bash
python create_embeddings.py
## ```

## **3. Expected Output**
Loading sections... ✓ 1241 sections
Initializing model... ✓ all-MiniLM-L6-v2
Connecting to Qdrant... ✓ Connected
Creating collection... ✓ legal_sections
Creating embeddings:
## 100%|████████████| 1241/1241 [02:15<00:00]
Uploading to Qdrant:
## Batch 1/13 ✓
## Batch 2/13 ✓
## ...
## Batch 13/13 ✓
## ✅ COMPLETE

Uploaded: 1241 sections
Collection: legal_sections
Vector size: 384
Test search for "murder":

Section 302 PPC - Punishment for murder (score: 0.89)
Section 300 PPC - Culpable homicide (score: 0.76)


**If upload fails:**
- Check Qdrant credentials
- Check internet connection
- Try smaller batch size (50 instead of 100)
- Check Qdrant dashboard for collection

**✅ Step 5 Complete!** Vectors uploaded to cloud.

## ---

## STEP 6: Build Search Function (Day 3 - 3 hours)

## ### What You'll Do
Create TypeScript function to search Qdrant

## ### Cursor Prompt
Create lib/qdrant.ts with vector search functionality.
## Requirements:

Import QdrantClient from @qdrant/js-client-rest
Initialize client:

URL from process.env.QDRANT_URL
API key from process.env.QDRANT_API_KEY


TypeScript interface for LegalSection:
## {
id: string
section_number: string
title: string
text: string
statute: string
full_reference: string
## }

TypeScript interface for SearchResult:
## {
section: LegalSection
score: number
## }
Main function: searchLegalSections(query: string, limit: number = 5)

Takes search query
Creates embedding (call to Groq or use local)
For now: use simple text search as fallback
Searches Qdrant collection "legal_sections"
Returns array of SearchResult


Error handling:

Try-catch for network errors
Return empty array if fails
Log errors to console


## Export:

searchLegalSections function
LegalSection type
SearchResult type



Make it type-safe and production-ready.

## ### Manual Steps

**1. Test the Function**

Create `test-search.ts` in root:
## ```typescript
import { searchLegalSections } from './lib/qdrant';

async function test() {
console.log('Testing search...');

const results = await searchLegalSections("murder punishment");


console.log(`Found ${results.length} results:\n`);

results.forEach((result, i) => {
console.log(`${i + 1}. ${result.section.full_reference}`);
console.log(`   ${result.section.title}`);
console.log(`   Score: ${result.score}\n`);
## });
## }

test();
## ```

## **2. Run Test**
## ```bash
npx tsx test-search.ts
## ```

## **3. Expected Output**
Testing search...
Found 5 results:

Section 302 PPC
Punishment for murder
## Score: 0.89
Section 300 PPC
Culpable homicide
## Score: 0.76
## ...


**✅ Step 6 Complete!** Search function working.

## ---

## STEP 7: Build RAG Chat API (Day 3-4 - 4 hours)

## ### What You'll Do
Create API that combines search + AI generation

## ### Cursor Prompt
Create app/api/chat/route.ts with RAG (Retrieval-Augmented Generation) implementation.
## Requirements:

Next.js 14 App Router API route

Handle POST requests only
Request body: { message: string }
## Import:

Groq from 'groq-sdk'
searchLegalSections from '@/lib/qdrant'


## Steps:
a. Extract message from request
b. Search Qdrant for top 5 relevant sections
c. Build context from search results:

Format: "Section XXX (Statute): Title\nText content\n\n"
Combine all 5 sections
d. Create system prompt:
"You are a Pakistani legal expert assistant. Answer questions ONLY based on the provided legal
sections from PPC, CrPC, and QSO.

## IMPORTANT RULES:

If answer is not in the context, say 'I cannot find this information in the provided sections.'
Always cite section numbers in your answer
Use a mix of Roman Urdu and English for clarity
Be precise and accurate
Format section references as 'Section XXX Statute'

## Provided Legal Sections:
## {context}"
e. Call Groq API:

## Model: 'llama-3.1-70b-versatile'
## Temperature: 0.3
Max tokens: 1000
Messages: [system prompt, user message]
f. Return JSON response:
## {
answer: string,
sections: Array<{number, title, statute}>
## }


Error handling:


Validate request body
Try-catch for API calls
Return proper error messages
Status codes: 200 (success), 400 (bad request), 500 (server error)


CORS headers for development
TypeScript types for all functions

Make it production-ready with comprehensive error handling.

## ### Manual Steps

**1. Test the API**
## ```bash
# Start dev server
npm run dev

# In another terminal:
curl -X POST http://localhost:3000/api/chat \
-H "Content-Type: application/json" \
-d '{"message":"What is the punishment for murder in Pakistan?"}'
## ```

## **2. Expected Response**
## ```json
## {
"answer": "Section 302 PPC ke mutabiq, jis shakhs ne qatl kiya hai, usko saza-e-maut ya umer
qaid ho sakti hai, aur saath mein jurmana bhi. Yeh Section 302 PPC (Punishment for murder)
mein likha hai.",
## "sections": [
## {
## "number": "302",
"title": "Punishment for murder",
"statute": "PPC"
## },
## {
## "number": "300",
"title": "Culpable homicide",
"statute": "PPC"
## }
## ]
## }
## ```


**✅ Step 7 Complete!** RAG API working.

## ---

## STEP 8: Build Chat UI (Day 4-5 - 6 hours)

## ### What You'll Do
Create beautiful chat interface

## ### Cursor Prompt #1: Main Chat Component
Create app/page.tsx with a modern chat interface.
## Requirements:

'use client' component
## Import:

useState from 'react'
Button, Input, Card, Badge from '@/components/ui'
Loader2 icon from 'lucide-react'


## State:

messages: Array<{role: 'user'|'assistant', content: string, sections?: Section[]}>
input: string
loading: boolean


## Layout:

Header: "Legal Code Assistant" with subtitle
Main chat area (flex-1, overflow-auto)
Input area (sticky bottom)


Message display:

User messages: right-aligned, blue background
Assistant messages: left-aligned, gray background
Show sections as badges below assistant message
Click section badge to see full text (modal)



## Features:

Send on Enter key
Send button disabled when loading
Clear input after send
Auto-scroll to bottom on new message
Loading indicator (three dots animation)
Example questions as buttons
Empty state when no messages


## Styling:

Clean, modern design
Mobile responsive
Tailwind CSS
Smooth animations
Professional color scheme


Error handling:

Show error toast if API fails
Retry button on error



Make it look like a professional ChatGPT-style interface.

## ### Cursor Prompt #2: Layout & Styling
Update app/layout.tsx with professional styling.
## Requirements:

## Metadata:

title: "Legal Code Assistant - Pakistani Law Made Simple"
description: "AI-powered assistant for PPC, CrPC, QSO"
keywords: "pakistani law, ppc, crpc, legal assistant"


Font: Inter from next/font/google
Add Toaster component from sonner
Professional color theme
Responsive viewport meta tags

Favicon setup

Make it SEO-friendly and professional.

## ### Cursor Prompt #3: Example Questions Component
Create components/ExampleQuestions.tsx with quick start questions.
## Requirements:

Array of example questions:

"What is the punishment for theft?"
"How to file an FIR?"
"What is Section 302 PPC?"
"What is bailable vs non-bailable?"
"What are the rights during arrest?"


Display as clickable cards
When clicked, fill the input
Hide after first question asked
Beautiful grid layout
Mobile responsive

Make it engaging and user-friendly.

## ### Manual Steps

## **1. Start Dev Server**
## ```bash
npm run dev
## ```

## **2. Open Browser**
http://localhost:3000

## **3. Test Chat**
- Type: "What is murder punishment?"
## - Press Enter
- Wait for response
- Check if sections display
- Try clicking a section badge

**✅ Step 8 Complete!** Chat UI working beautifully.


## ---

## STEP 9: Authentication Setup (Day 5-6 - 5 hours)

## ### What You'll Do
Add user login/signup with Supabase

## ### Manual: Create Database Tables

- Go to Supabase Dashboard
- Click SQL Editor
- Run this SQL:

## ```sql
-- Queries table
CREATE TABLE queries (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
query TEXT NOT NULL,
response TEXT,
sections JSONB,
created_at TIMESTAMP DEFAULT NOW()
## );

## -- Row Level Security
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own queries"
ON queries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own queries"
ON queries FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Subscriptions table
CREATE TABLE subscriptions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
plan TEXT DEFAULT 'free',
status TEXT DEFAULT 'active',
current_period_end TIMESTAMP,
created_at TIMESTAMP DEFAULT NOW()
## );


ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Usage tracking
CREATE TABLE usage (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
query_count INTEGER DEFAULT 0,
date DATE DEFAULT CURRENT_DATE,
UNIQUE(user_id, date)
## );

ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own usage"
ON usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users update own usage"
ON usage FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own usage"
ON usage FOR INSERT
WITH CHECK (auth.uid() = user_id);
## ```

## ### Cursor Prompt #1: Supabase Client
Create lib/supabase.ts with Supabase client and helper functions.
## Requirements:

Import createClient from @supabase/supabase-js
Initialize client with env variables
Helper functions:

getCurrentUser() - returns current user or null
signUp(email, password) - creates account
signIn(email, password) - logs in
signOut() - logs out
saveQuery(query, response, sections) - saves to database

getUserQueries(limit) - gets user's query history
checkDailyLimit() - checks if user exceeded free tier limit
incrementUsage() - increments query count


TypeScript types for all functions
Error handling
Export everything

Make it type-safe and well-documented.

## ### Cursor Prompt #2: Auth Page
Create app/auth/page.tsx with authentication UI.
## Requirements:

Tabs component from Shadcn
Two tabs: "Sign In" and "Sign Up"
## Sign In Form:

Email input (validated)
Password input
Sign In button
Loading state
Error display


## Sign Up Form:

Email input (validated)
Password input (min 6 chars)
Confirm password
Sign Up button
Loading state
Error display


Use Supabase helper functions
Redirect to home after successful auth
Show success/error toasts
Professional design
Mobile responsive

Make it clean and user-friendly.


## ### Cursor Prompt #3: Protected Navbar
Create components/Navbar.tsx with user authentication state.
## Requirements:

Check if user is logged in
If logged in:

Show user avatar
Dropdown menu:

## View Profile
## Query History
## Subscription
## Sign Out




If not logged in:

Show "Sign In" button (links to /auth)


Logo on left
Mobile responsive (hamburger menu)
Use Shadcn DropdownMenu and Avatar
Handle sign out

Make it professional and smooth.

## ### Manual Steps

**1. Update app/layout.tsx**
Add `<Navbar />` before `{children}`

## **2. Test Authentication**
- Go to `/auth`
- Create account with email/password
- Verify you can sign in
- Check if navbar shows user
- Try signing out

**✅ Step 9 Complete!** Authentication working.


## ---

## STEP 10: Usage Limits & Tracking (Day 6 - 3 hours)

## ### What You'll Do
Implement free tier limits (10 queries/day)

## ### Cursor Prompt
Update app/api/chat/route.ts to implement usage tracking and limits.
## Requirements:

## Import:

getCurrentUser from '@/lib/supabase'
checkDailyLimit, incrementUsage from '@/lib/supabase'


At start of POST handler:
a. Get current user
b. If user exists:

Check subscription plan
If plan === 'free':

Check daily limit (10 queries)
If exceeded, return error:
## {
error: "Daily limit reached",
message: "You've used 10/10 free queries today. Upgrade to Pro for unlimited queries.",
upgrade_url: "/pricing"
## }
Status 429 (Too Many Requests)
c. Continue with normal RAG flow
d. After successful response:


Save query to database
Increment usage count


Add rate limiting headers:

X-RateLimit-Limit: 10
X-RateLimit-Remaining: (10 - current_count)

X-RateLimit-Reset: (tomorrow midnight timestamp)


For non-authenticated users:

Allow 3 queries total (use IP-based tracking or session)
Show "Sign up for 10 free queries daily"



Make limiting clear and user-friendly.

## ### Manual Steps

## **1. Test Limits**
- Create free account
- Send 11 queries
- Verify 11th shows upgrade message

## **2. Check Database**
- Go to Supabase Dashboard
- Check `usage` table
- Verify counts are correct

**✅ Step 10 Complete!** Usage limits enforced.

## ---

## STEP 11: FIR Generator Feature (Day 7-8 - 8 hours)

## ### What You'll Do
Build automated FIR generation system

### Cursor Prompt #1: FIR Generation API
Create app/api/generate-fir/route.ts with multi-step FIR generation.
## Requirements:

Handle POST with:

story: string (user's incident description)
userDetails: {name, father_name, address, cnic, district, station}


FIR Template (constant):


## FIRST INFORMATION REPORT
(Under Section 154 Cr.P.C.)

## District: {district}
## Police Station: {station}
FIR No.: _______
## Date: {date}
## Time: {time}

## COMPLAINANT DETAILS:
## Name: {name}
Father's/Husband's Name: {father_name}
## Address: {address}
CNIC: {cnic}

## STATEMENT OF COMPLAINANT:
## {statement}

## DETAILS OF OCCURRENCE:
Place of Occurrence: {place}
Date & Time of Occurrence: {occurrence_time}

## ACCUSED PERSON(S):
## {accused_details}

PROPERTY INVOLVED (if any):
## {property_details}

## OFFENCE(S) ALLEGED:
## {sections}

## NATURE OF OFFENCE:
## Cognizable: {cognizable}
## Bailable: {bailable}

## ___________________          ___________________
## Complainant Signature         Officer Signature

Step 1 - Extract Information (Groq call):

Prompt: "Extract structured information from this incident: {story}. Return JSON with:
crime_type, place, time, accused_description, property_details, estimated_value"
Parse JSON response



Step 2 - Identify Sections (Groq call):

Prompt: "Based on this crime: {crime_type}, identify exact PPC sections. Return JSON with:
sections (array), cognizable (bool), bailable (bool), punishment_range"
Use RAG search for accuracy


Step 3 - Generate Statement (Groq call):

Prompt: "Write formal FIR statement from this: {extracted_info}. Use professional legal
language. Mix English and Roman Urdu. Be detailed and chronological."
Get formatted statement


Fill template with all extracted data
## Return:
## {
fir_text: string,
sections: array,
extracted_info: object,
downloadable: true
## }
Error handling at each step
Timeout: 60 seconds total
Save generated FIR to database

Make it accurate and professional.

### Cursor Prompt #2: FIR Generator UI
Create app/fir/page.tsx with step-by-step FIR generator.
## Requirements:

Multi-step form (3 steps)
## Step 1: Describe Incident

Large textarea (10 rows)
Placeholder with example:
"Example: Kal raat 10 baje mere mobile phone ki chori hui DHA market mein. Phone iPhone 13
Pro tha, qeemat 150,000 rupay. Chori karne wala ek 25 saal ka ladka tha, blue shirt pehne hua."
Character count (min 50 chars)
Next button
Example stories (clickable to fill)



## Step 2: Your Details

## Name (required)
Father's/Husband's Name (required)
## Address (required)
CNIC (format: 12345-1234567-1, validated)
District (dropdown: Lahore, Karachi, Islamabad, etc.)
Police Station (text input)
Back and Generate buttons


Step 3: Generated FIR

Display formatted FIR (monospace font)
Sections highlighted
Action buttons:

Print FIR
Download as PDF
## Copy Text
## Generate New


Show extracted sections with details


Loading states:

"Analyzing incident..." (2 sec)
"Identifying sections..." (2 sec)
"Generating FIR..." (3 sec)
Progress bar


Error handling:

Show error message
Retry button


Professional design
Mobile responsive


Make it intuitive and helpful.

### Cursor Prompt #3: PDF Download
Install jspdf and create lib/pdf-generator.ts.
First run: npm install jspdf
## Requirements:

Function: generateFIRPDF(firText: string, filename: string)
Uses jsPDF library
A4 size paper
Proper margins
Professional font
Page breaks if needed
Returns blob for download
Browser download trigger

Export function for use in FIR page.

## ### Manual Steps

**1. Test FIR Generator**
- Go to `/fir`
- Step 1: Enter test incident
- Step 2: Fill your details
- Step 3: Verify FIR generated
- Test PDF download
- Test print

## **2. Verify Quality**
- Check if sections are correct
- Check if format is professional
- Check if Urdu/English mix is good

**✅ Step 11 Complete!** FIR Generator working.

## ---

## STEP 12: Voice Assistant (Day 9 - 5 hours)

## ### What You'll Do
Add voice input/output feature

## ### Cursor Prompt #1: Voice Hook

Create hooks/useVoiceAssistant.ts with voice functionality.
## Requirements:

Use Web Speech API (browser native)
Check browser compatibility
## Speech Recognition:

Create webkitSpeechRecognition instance
Set language: 'ur-PK' for Urdu, fallback 'en-US'
continuous: false
interimResults: false
onresult: get transcript
onerror: handle errors


Text-to-Speech:

Use SpeechSynthesis API
Function: speak(text: string)
Set voice (prefer Urdu if available)
rate: 0.9
pitch: 1
volume: 1


## State:

isListening: boolean
transcript: string
isSpeaking: boolean
error: string | null


## Functions:

startListening()
stopListening()
speak(text)
stopSpeaking()


Return all state and functions
TypeScript types


Export custom hook.

## ### Cursor Prompt #2: Voice Page
Create app/voice/page.tsx with voice interface.
## Requirements:

Use useVoiceAssistant hook
## Layout:

Center: Large microphone button (icon changes when active)
Top: Instructions "Tap mic and speak your question"
Middle: Transcript display (what you said)
Bottom: AI response (what AI said)


Microphone button:

Size: 120px circle
Blue when inactive
Red pulsing when listening
Disabled when speaking
Click to start/stop listening


## Flow:

User clicks mic
Start listening
Show pulsing animation
Display transcript as it comes
When user stops (or 5 sec silence)
Send transcript to chat API
Display AI response
Speak AI response aloud


## Features:

Volume indicator (visual)
Retry button if error
Clear button
Text fallback if voice not supported



Framer Motion animations:

Pulse effect when listening
Fade in for text
Smooth transitions


Mobile optimized

Make it visually appealing and smooth.

## ### Manual Steps

## **1. Test Voice**
- Go to `/voice`
- Click microphone
- Allow microphone permission
- Say: "Section 302 kya hai?"
- Verify transcript appears
- Verify AI responds
- Verify voice speaks answer

**2. Test on Mobile**
- Open on phone
- Test voice input
- Verify speaker output

**✅ Step 12 Complete!** Voice assistant working.

## ---

## STEP 13: Case Predictor (Day 10 - 6 hours)

## ### What You'll Do
Build ML-based case outcome predictor

## ### Cursor Prompt #1: Predictor Logic
Create lib/case-predictor.ts with rule-based prediction system.
## Requirements:

Interface CaseDetails:
## {
section_number: string
evidence_type: 'eyewitness' | 'circumstantial' | 'forensic' | 'confession'

accused_record: number (previous convictions)
witnesses_count: number
weapon_recovered: boolean
victim_statement: boolean
## }
Function: predictBailProbability(details: CaseDetails): number

## Rules:

Non-bailable sections (302, 392, etc.) → base 15%
Bailable sections → base 70%
Strong evidence → -20%
Weak evidence → +15%
First-time offender → +10%
Multiple convictions → -25%
If weapon recovered → -10%


## Return 0-100


Function: predictConvictionProbability(details): number

## Rules:

Eyewitness + forensic → 85%
Only circumstantial → 45%
## Confession → 90%
Multiple witnesses (3+) → +15%
Previous record → +10%
Weak evidence → -20%


## Return 0-100


Function: findSimilarCases(section): array

Mock data for now (3-5 cases)
Structure: {citation, outcome, similarity, year}


Function: getCriticalFactors(details): array


Identify most important factors
Rank by impact
Return top 3


Function: getRecommendations(bail_prob, conviction_prob): array

Smart suggestions based on probabilities



Export all functions with types.

### Cursor Prompt #2: Predictor API
Create app/api/predict-case/route.ts for case predictions.
## Requirements:

POST endpoint
Body: { caseDetails: CaseDetails }
## Steps:
a. Validate input
b. Call predictBailProbability
c. Call predictConvictionProbability
d. Find similar cases
e. Get critical factors
f. Get recommendations
g. Use Groq to explain in simple Urdu:

Why these probabilities?
What factors matter most?
What should accused do?


## Return:
## {
bail_probability: number,
conviction_probability: number,
similar_cases: array,
critical_factors: array,
recommendations: array,
explanation: string
## }
Error handling
Response time: < 5 seconds


Make it accurate and helpful.

### Cursor Prompt #3: Predictor UI
Create app/predictor/page.tsx with case prediction interface.
## Requirements:

Form with fields:

Section number (searchable dropdown)
Evidence type (radio buttons with icons)
Number of previous convictions (number input)
Number of witnesses (number input)
Weapon recovered? (checkbox)
Victim statement available? (checkbox)


Predict button (disabled until form valid)
Results display:

Two circular progress indicators:

## Bail Probability (blue)
## Conviction Probability (red)


Similar cases table (clickable rows)
Critical factors (ranked list with impact bars)
Recommendations (card with bullets)
AI Explanation (expandable text)


## Features:

Form validation
Loading animation
Results appear with fade-in
Download report button


Use recharts for progress circles
Professional design
Mobile responsive


Make it data-driven and insightful.

## ### Manual Steps

## **1. Test Predictor**
- Go to `/predictor`
## - Select Section 302
- Choose "Circumstantial" evidence
- Set 0 previous convictions
- Set 1 witness
- No weapon
## - Click Predict
- Verify probabilities make sense

**✅ Step 13 Complete!** Case predictor working.

## ---

## STEP 14: Document Analyzer (Day 11 - 6 hours)

## ### What You'll Do
Upload and analyze legal documents

## ### Manual: Install Library
## ```bash
npm install pdf-parse multer
npm install @types/multer --save-dev
## ```

### Cursor Prompt #1: Document Analysis API
Create app/api/analyze-document/route.ts with document analysis.
## Requirements:

Accept multipart/form-data (file upload)
Support PDF files only
Max file size: 10MB
Extract text from PDF using pdf-parse
Determine document type:

If contains "FIR" or "First Information Report" → FIR
If contains "agreement" or "contract" → Contract
If contains "notice" → Legal Notice
## Else → General Document



For FIR Analysis (Groq):

Extract: FIR number, date, sections, parties, incident summary
Identify: Strengths, weaknesses, missing info
Check: Proper format, required fields, legal compliance
Suggest: Improvements, additional sections


For Contract Analysis (Groq):

Extract: Parties, date, terms, clauses
Identify: Risky clauses, missing standard clauses
Check: Ambiguous language, unfair terms
Suggest: Amendments, additional protections


Return structured JSON:
## {
document_type: string,
analysis: {
summary: string,
extracted_data: object,
strengths: string[],
weaknesses: string[],
missing_elements: string[],
recommendations: string[],
risk_level: 'low' | 'medium' | 'high'
## }
## }
Save analysis to database
Error handling for corrupt PDFs

Make analysis comprehensive and actionable.

### Cursor Prompt #2: Document Analyzer UI
Create app/analyzer/page.tsx with document upload and analysis UI.
## Requirements:

File upload area:

Drag & drop zone
Or click to browse
Show file name after selection

File size limit warning
Only PDF accepted


Document type selector (optional override)
Analyze button
Loading state:

"Uploading document..."
"Extracting text..."
"Analyzing content..."
Progress percentage


Results display:

Document summary card
Extracted data table
Strengths (green cards with checkmarks)
Weaknesses (red cards with warnings)
Missing elements (yellow cards)
Recommendations (blue cards with suggestions)
Risk level badge (color-coded)


## Actions:

Download analysis report
Analyze another document
Share analysis (copy link)


Example documents (downloadable samples)
Professional design
Mobile responsive

Make it professional and thorough.

## ### Manual Steps

**1. Create Sample FIR PDF**
- Create a simple FIR in Word/Google Docs
- Export as PDF
- Save as `sample-fir.pdf`


## **2. Test Analyzer**
- Go to `/analyzer`
- Upload sample FIR
- Wait for analysis
- Verify results make sense
- Check all sections appear

**✅ Step 14 Complete!** Document analyzer working.

## ---

## STEP 15: Payment System - Part 1 (Day 12-13 - 8 hours)

## ### What You'll Do
Integrate JazzCash payment gateway

### Manual: JazzCash Setup

**1. Register for JazzCash Sandbox**
- Go to: https://sandbox.jazzcash.com.pk/
- Create merchant account
- Complete verification
- Get credentials:
- Merchant ID
## - Password
## - Integrity Salt

**2. Add to .env.local**
## ```env
## JAZZCASH_MERCHANT_ID=MC12345
JAZZCASH_PASSWORD=your_password
JAZZCASH_SALT=your_salt
JAZZCASH_RETURN_URL=http://localhost:3000/payment/callback
## ```

### Cursor Prompt #1: JazzCash Library
Create lib/jazzcash.ts with JazzCash payment integration.
## Requirements:

Import crypto for hash generation
Function: generatePaymentHash(data: object, salt: string)

Sorts data alphabetically by key

Concatenates values with &
Creates HMAC-SHA256 hash
Returns uppercase hex string


Function: generatePaymentForm(amount: number, orderId: string, email: string)

Current timestamp (YYYYMMDDHHmmss format)
Expiry: 24 hours from now
## Parameters:

pp_Version: '1.1'
pp_TxnType: 'MWALLET'
pp_Language: 'EN'
pp_MerchantID: from env
pp_Password: from env
pp_TxnRefNo: orderId
pp_Amount: amount * 100 (paisa)
pp_TxnCurrency: 'PKR'
pp_TxnDateTime: timestamp
pp_BillReference: orderId
pp_Description: 'Legal Assistant Subscription'
pp_TxnExpiryDateTime: expiry
pp_ReturnURL: callback URL
pp_SecureHash: generated hash


Returns all parameters as object


Function: verifyCallback(data: object): boolean

Extracts received hash
Generates expected hash
Compares both
Returns true if match


TypeScript interfaces
Sandbox vs Production mode switch

Export all functions.

### Cursor Prompt #2: Create Order API

Create app/api/payment/create/route.ts for payment initiation.
## Requirements:

POST endpoint
Body: { plan: 'pro' | 'enterprise' }
## Pricing:

pro: 499 PKR
enterprise: 9999 PKR


Get current user
Create order in Supabase:

Table: orders
Columns: id (UUID), user_id, plan, amount, status (pending), created_at


Generate JazzCash form using lib function
Return form parameters
Error handling

Make it secure and validated.

**Manual: Create Orders Table**
Go to Supabase SQL Editor, run:
## ```sql
CREATE TABLE orders (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
plan TEXT NOT NULL,
amount INTEGER NOT NULL,
status TEXT DEFAULT 'pending',
transaction_id TEXT,
created_at TIMESTAMP DEFAULT NOW()
## );

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);
## ```


## ### Cursor Prompt #3: Payment Callback
Create app/api/payment/callback/route.ts for JazzCash callback.
## Requirements:

POST endpoint (receives data from JazzCash)
Extract all parameters from form data
Verify hash using verifyCallback function
Check pp_ResponseCode:

## '000' = Success
## Others = Failed


If success:
a. Find order by pp_TxnRefNo
b. Update order status to 'completed'
c. Save transaction_id
d. Create/update subscription:

plan: from order
status: 'active'
current_period_end: 30 days from now
e. Redirect to /success?order={id}


If failed:
a. Update order status to 'failed'
b. Redirect to /failed?reason={code}
Log all transactions
Email user (optional)

CRITICAL: Always verify hash to prevent fraud.

## ### Cursor Prompt #4: Pricing Page
Create app/pricing/page.tsx with pricing plans.
## Requirements:

Three plans in cards:
FREE (Left card):

Rs. 0 / forever
10 queries per day
Basic legal search
Section lookup

Community support
"Get Started" button (goes to /auth)

PRO (Center card - highlighted):

Rs. 499 / month
"Most Popular" badge
Unlimited queries
FIR Generator
## Voice Assistant
## Case Predictor
## Document Analyzer
Query history
Priority support
"Subscribe Now" button

ENTERPRISE (Right card):

Rs. 9,999 / month
Everything in Pro
API access
Custom integrations
White-label option
Dedicated support
Training sessions
"Contact Sales" button


## Features:

Comparison table below cards
FAQ section
Testimonials (mock for now)
Money-back guarantee badge


Subscribe button:

## Calls /api/payment/create
Gets form data
Submits to JazzCash in new window


Professional design

Mobile responsive

Make it conversion-optimized.

## ### Manual Steps

## **1. Test Payment Flow**
- Go to `/pricing`
- Click "Subscribe Now" on Pro
- Should redirect to JazzCash sandbox
- Use test card details (provided by JazzCash)
- Complete payment
- Should redirect back to success page

## **2. Verify Database**
- Check orders table
- Check subscriptions table
- Verify status updated

**✅ Step 15 Complete!** Payment integration working.

## ---

## STEP 16: Subscription Management (Day 14 - 4 hours)

## ### What You'll Do
Manage user subscriptions and feature gates

## ### Cursor Prompt #1: Subscription Checker
Create lib/subscription.ts with subscription helper functions.
## Requirements:

Function: getUserSubscription(userId: string)

Query subscriptions table
Return current plan and status
Check if expired (current_period_end < now)
If expired, set status to 'expired'


Function: isFeatureAllowed(userId: string, feature: string)

## Features:


'chat' → Free: 10/day, Pro: unlimited
'fir_generator' → Pro only
'voice_assistant' → Pro only
'case_predictor' → Pro only
'document_analyzer' → Pro only


Return boolean


Function: getRemainingQueries(userId: string)

Check today's usage
Return number remaining


Function: canUpgrade(currentPlan: string)

Return available upgrade options


TypeScript types

Export all functions.

## ### Cursor Prompt #2: Feature Gates
Create middleware.ts in root for route protection.
## Requirements:

Check authentication for protected routes:

## /dashboard
## /history
## /fir
## /predictor
## /analyzer


Check subscription for premium features:

/fir → requires Pro
/predictor → requires Pro
/analyzer → requires Pro



Redirect to /auth if not logged in
Redirect to /pricing if subscription needed
Add user info to request headers

Use Next.js middleware pattern.

## ### Cursor Prompt #3: Upgrade Modal
Create components/UpgradeModal.tsx for upgrade prompts.
## Requirements:

Modal component using Shadcn Dialog
Props: feature name, isOpen, onClose
## Content:

Icon for locked feature
"Upgrade to Pro" heading
Feature benefits list
Current plan vs Pro comparison
"Upgrade Now" button → /pricing
"Maybe Later" button


Variants for different features
Professional design
Mobile friendly

Make it persuasive but not annoying.

## ### Manual Steps

## **1. Test Feature Gates**
- Sign in with free account
- Try to access `/fir`
- Should see upgrade modal
- Click upgrade
- Complete payment
- Verify `/fir` now accessible

**✅ Step 16 Complete!** Subscription system working.

## ---

## STEP 17: User Dashboard (Day 15 - 5 hours)


## ### What You'll Do
Build comprehensive user dashboard

## ### Cursor Prompt
Create app/dashboard/page.tsx with user dashboard.
## Requirements:

Protected route (require auth)
Layout sections:
## Header:

Welcome message with user name
Current plan badge

## Subscription Card:

Plan name (Free/Pro/Enterprise)
Status (Active/Expired)
Expiry date (if Pro)
Upgrade button (if Free)
Manage button (if Pro)

## Usage Statistics Card:

Queries this month (chart)
FIRs generated
Documents analyzed
Most queried sections (top 5)

## Quick Actions:

## Ask Question (→ /)
Generate FIR (→ /fir)
## Analyze Document (→ /analyzer)
## View History (→ /history)

## Recent Activity:

Last 10 queries
## Timestamps
Click to view details



## Features:

Real data from Supabase
Charts using recharts
Responsive grid layout
Loading skeletons
Empty states


Professional analytics dashboard style

Make it informative and actionable.

## ### Manual Steps

## **1. Test Dashboard**
- Sign in
- Go to `/dashboard`
- Verify all stats load
- Check charts render
- Test quick actions

**✅ Step 17 Complete!** Dashboard complete.

## ---

## STEP 18: Query History (Day 15 - 3 hours)

## ### What You'll Do
Build searchable query history

## ### Cursor Prompt
Create app/history/page.tsx with query history interface.
## Requirements:

Protected route
Fetch user's queries from Supabase
Display in table:

Date/Time
## Question
## Sections Found
Actions (View, Delete)



## Features:

Search/filter queries
Date range filter
Section filter
Sort by date
Pagination (20 per page)
Export as CSV


Click row to expand:

Full question
AI response
Cited sections
Copy button


Delete query confirmation
Empty state
Loading state
Mobile responsive table

Make it searchable and organized.

## ### Manual Steps

## **1. Test History**
- Ask several questions
- Go to `/history`
- Verify all queries appear
- Test search
- Test delete

**✅ Step 18 Complete!** History page done.

## ---

## STEP 19: Neo4j Graph Integration (Day 16 - 6 hours)

## ### What You'll Do
Add graph database for better relationships


### Manual: Load Data to Neo4j

**1. Go to Neo4j Browser**
- Open your Neo4j Aura instance
- Click "Query" tab

## **2. Create Constraints**
## ```cypher
CREATE CONSTRAINT section_id IF NOT EXISTS
FOR (s:Section) REQUIRE s.id IS UNIQUE;
## ```

## ### Cursor Prompt #1: Graph Import Script
Create data/scripts/import_to_neo4j.py that imports legal data to Neo4j.
## Requirements:

Load all_legal_data.json
Connect to Neo4j using credentials from .env
For each section:

Create node: (s:Section {id, number, title, statute, text})


Create relationships:

If section text mentions another section → [:REFERENCES]
PPC sections → CrPC sections (procedures) → [:PROCEDURE]
Sections → QSO articles (evidence) → [:EVIDENCE_RULE]
Sections with similar topics → [:RELATED_TO]


Batch processing (100 nodes at a time)
Progress bar
Print statistics
Error handling

Use neo4j-driver library.

**Manual: Run Script**
## ```bash
pip install neo4j python-dotenv
python data/scripts/import_to_neo4j.py
## ```


## ### Cursor Prompt #2: Graph Query Functions
Create lib/neo4j.ts with graph query functions.
## Requirements:

Connect to Neo4j
## Functions:

findRelatedSections(sectionId: string)

Returns sections connected by any relationship
Max depth: 2


getProcedureChain(ppcSection: string)

Finds CrPC procedures for PPC section


getEvidenceRequirements(section: string)

Finds QSO articles related to section


getSectionPath(from: string, to: string)

Finds shortest path between sections




Return structured data
Connection pooling
Error handling
TypeScript types

Export all functions.

### Cursor Prompt #3: Update Chat API
Enhance app/api/chat/route.ts with graph data.
After RAG search:

Call findRelatedSections for each result
Include related sections in context
Mention in system prompt: "Also consider these related sections"

Return related_sections in response

This improves answer quality.

## ### Manual Steps

## **1. Test Graph Queries**
- Ask about Section 302
- Verify related sections appear
- Check procedure chain shows CrPC sections

**✅ Step 19 Complete!** Graph database integrated.

## ---

## STEP 20: Performance Optimization (Day 17 - 4 hours)

## ### What You'll Do
Optimize speed and caching

## ### Cursor Prompt #1: Add Caching
Create lib/cache.ts with response caching.
## Requirements:

Use Map for in-memory cache
## Functions:

get(key: string)
set(key, value, ttl_seconds)
delete(key)
clear()


Auto-cleanup expired entries
Max cache size (1000 entries)
LRU eviction policy

Export cache instance.

### Cursor Prompt #2: Optimize API Routes
Update app/api/chat/route.ts with caching.

Generate cache key from user query
Check cache first

If hit, return cached response
If miss:

Process normally
Cache result (TTL: 1 hour)


Add header: X-Cache-Status (hit/miss)

Keep cache fresh while reducing API calls.

## ### Cursor Prompt #3: Add Rate Limiting
Install Upstash Redis: npm install @upstash/ratelimit @upstash/redis
Create lib/rate-limit.ts with rate limiting.
## Requirements:

Use Upstash Redis (free tier)
## Limits:

Free users: 10 requests per day
Pro users: 1000 requests per day
Anonymous: 3 requests per session


Sliding window algorithm
Return: { success: boolean, remaining: number, reset: timestamp }
Different limits for different endpoints

Export rateLimit function.

**Manual: Setup Upstash**
- Go to: https://upstash.com
- Create free Redis database
- Add credentials to .env.local

## ### Manual Steps

## **1. Test Performance**
- Ask same question twice
- Second should be instant (cached)
- Check Network tab for response times

**✅ Step 20 Complete!** Performance optimized.


## ---

## STEP 21: Error Handling & Logging (Day 17 - 3 hours)

## ### What You'll Do
Add comprehensive error tracking

## ### Manual: Setup Sentry
## ```bash
npm install @sentry/nextjs

## # Initialize
npx @sentry/wizard@latest -i nextjs
## ```

## ### Cursor Prompt
Configure Sentry for error tracking.
## Requirements:

Add Sentry to:

app/layout.tsx (global)
All API routes
Error boundaries


## Capture:

API errors
Client errors
Performance issues


Add context:

User ID
Request info
Custom tags


Setup source maps
Configure error filtering

Make errors trackable and debuggable.


## ### Manual Steps

**1. Get Sentry DSN**
- Create project at sentry.io
- Copy DSN to .env.local

## **2. Test Error Tracking**
- Trigger test error
- Check Sentry dashboard

**✅ Step 21 Complete!** Error tracking setup.

## ---

## STEP 22: SEO & Meta Tags (Day 18 - 3 hours)

## ### What You'll Do
Optimize for search engines

## ### Cursor Prompt #1: Meta Tags
Update app/layout.tsx with comprehensive SEO.
## Requirements:

## Metadata:

title: "Legal Code Assistant - AI Pakistani Law Helper"
description: "AI-powered assistant for Pakistani law. Get instant answers about PPC, CrPC,
QSO. Generate FIRs, predict case outcomes, analyze documents."
keywords: "pakistani law, ppc, crpc, qso, legal assistant, fir generator, ai lawyer"


OpenGraph tags:

og:title, og:description, og:image
og:url, og:type


## Twitter Card:

twitter:card, twitter:title, twitter:description


Structured data (JSON-LD):


Organization schema
WebApplication schema


Favicon setup
## Robots.txt
## Sitemap.xml

Make it SEO-friendly.

## ### Cursor Prompt #2: Blog Setup
Create app/blog structure for SEO content.

Create app/blog/page.tsx (blog list)
Create app/blog/[slug]/page.tsx (blog post)
Sample posts:

"Understanding PPC Section 302"
"How to File FIR in Pakistan"
"Bailable vs Non-Bailable Offenses"
"Your Rights During Police Arrest"


Markdown content
SEO optimized
Share buttons

Generate 5 sample blog posts.

## ### Manual Steps

## **1. Create Logo**
- Design simple logo (or use Canva)
- Save as `public/logo.png`

**2. Create OG Image**
- 1200x630px image
- Save as `public/og-image.png`

**✅ Step 22 Complete!** SEO optimized.

## ---


## STEP 23: Mobile App (PWA) (Day 18 - 3 hours)

## ### What You'll Do
Make it installable as app

## ### Cursor Prompt
Convert to Progressive Web App (PWA).
## Requirements:

Create public/manifest.json:

name: "Legal Code Assistant"
short_name: "Legal Assistant"
icons: 192x192, 512x512
start_url: "/"
display: "standalone"
theme_color: "#3B82F6"
background_color: "#FFFFFF"


Create app/service-worker.js:

Cache static assets
Offline fallback
Cache API responses (1 hour)


Update app/layout.tsx:

Link to manifest
Meta tags for PWA


Add install prompt:

Detect if installable
Show install button
Handle beforeinstallprompt


Create offline page
Test on mobile

Make it installable on phones.


## ### Manual Steps

## **1. Create Icons**
- 192x192px icon
- 512x512px icon
- Save in `public/icons/`

**2. Test PWA**
- Open on mobile Chrome
- Check if install prompt appears
- Install app
- Test offline mode

**✅ Step 23 Complete!** PWA ready.

## ---

## STEP 24: Testing & Bug Fixes (Day 19-20 - 12 hours)

## ### What You'll Do
Comprehensive testing and fixes

## ### Manual Testing Checklist

**Authentication:**
- [ ] Sign up works
- [ ] Email validation works
- [ ] Sign in works
- [ ] Password reset works
- [ ] Sign out works
- [ ] Protected routes redirect

**Chat:**
- [ ] Send message works
- [ ] Receives AI response
- [ ] Sections display correctly
- [ ] Loading states work
- [ ] Error handling works
- [ ] Message history saves

**FIR Generator:**
- [ ] Step 1 validation
- [ ] Step 2 form validation

- [ ] FIR generates correctly
- [ ] Sections are accurate
- [ ] PDF download works
- [ ] Print works

**Voice Assistant:**
- [ ] Microphone permission
- [ ] Speech recognition works
- [ ] Transcript displays
- [ ] AI responds
- [ ] Text-to-speech works

**Case Predictor:**
- [ ] Form validation
- [ ] Predictions make sense
- [ ] Charts render
- [ ] Recommendations helpful

**Document Analyzer:**
- [ ] File upload works
- [ ] PDF parsing works
- [ ] Analysis is accurate
- [ ] Download report works

**Payments:**
- [ ] Pricing page loads
- [ ] Payment form generates
- [ ] JazzCash redirect works
- [ ] Callback processes
- [ ] Subscription activates
- [ ] Feature gates work

**Dashboard:**
- [ ] Stats load correctly
- [ ] Charts display
- [ ] Quick actions work

**Mobile:**
- [ ] Responsive on phone
- [ ] Touch interactions work
- [ ] PWA installs
- [ ] Offline mode works

## ### Bug Tracking


Create `BUGS.md`:
## ```markdown
## # Bug List

## ## High Priority
## - [ ] Bug 1: Description
## - [ ] Bug 2: Description

## ## Medium Priority
## - [ ] Bug 3: Description

## ## Low Priority
## - [ ] Bug 4: Description

## ## Fixed
- [x] Bug 5: Description - Fixed on Day X
## ```

Fix all High and Medium priority bugs.

**✅ Step 24 Complete!** Most bugs fixed.

## ---

## STEP 25: Deploy to Production (Day 21 - 4 hours)

## ### What You'll Do
Deploy live to internet

## ### Manual Steps

**1. Prepare for Deploy**
## ```bash
# Update dependencies
npm update

# Build test
npm run build

# Fix any build errors
## ```

## **2. Environment Variables**

- Copy all from .env.local
- Prepare for Vercel

**3. Deploy to Vercel**
## ```bash
# Install Vercel CLI
npm i -g vercel

## # Login
vercel login

## # Deploy
vercel --prod
## ```

Follow prompts:
- Link to GitHub repo
- Add environment variables
## - Deploy

**4. Custom Domain (Optional)**
- Buy domain (.pk from PKNIC)
- Add to Vercel
- Configure DNS

**5. Update JazzCash**
- Change return URL to production
- Test live payment

**6. Post-Deploy Checks**
- [ ] Site loads
- [ ] Auth works
- [ ] Database connects
- [ ] APIs respond
- [ ] Payments work
- [ ] All features functional

**✅ Step 25 Complete!** LIVE IN PRODUCTION! 

## ---

## STEP 26: Launch Marketing (Day 22 - 6 hours)

## ### What You'll Do

Get first users

## ### Manual Tasks

## **1. Product Hunt Launch**
- Create account
## - Prepare:
- Screenshot galleries
- Demo video (2 min)
- Product description
- Tagline: "Pakistani Law Made Simple with AI"
- Launch on weekday morning
- Share link everywhere

## **2. Social Media**

**LinkedIn Post:**
##  Launching Legal Code Assistant!
As a CS student, I was frustrated seeing people struggle with Pakistani law.
So I built an AI assistant that:
✅ Answers legal questions in Roman Urdu
✅ Generates FIRs automatically
✅ Predicts case outcomes
✅ Analyzes legal documents
Built with Next.js, AI, and 30 days of hard work.
Try it free: [your-url]
#LegalTech #Pakistan #AI #FYP

**Twitter Thread:**
I spent 30 days building an AI legal assistant for Pakistan  
Here's what it does: 淋
1/ Answers any question about PPC, CrPC, QSO in simple Roman Urdu
2/ Generates complete FIRs from your story
3/ Predicts bail/conviction probability
4/ Analyzes legal documents
Try it: [url]

## **3. University Launch**
- Email to law faculty
- Post in student groups
- Demo at law society

## **4. Law Firm Outreach**
Email template:

Subject: Free Legal AI Assistant for Your Firm
Dear [Name],
I've developed an AI tool that helps with:

Quick legal research (PPC/CrPC/QSO)
FIR drafting
Document analysis

Free tier available. Would you like a demo?
[Your name]
[Link]

## **5. Press Release**
Send to:
## - Dawn Tech
- ProPakistani
- TechJuice
## - Startup Pakistan

## **6. Reddit**
Post in:
- r/pakistan
- r/LegalAdvice
- r/SideProject

## **7. Analytics Setup**
## - Add Google Analytics
## - Add Facebook Pixel
- Track conversions

**Target: 100 signups in 7 days**

**✅ Step 26 Complete!** Marketing started.

## ---

## STEP 27: User Feedback & Iteration (Day 23-25 - 18 hours)

## ### What You'll Do
Collect feedback and improve

## ### Manual Process

## **1. User Interviews**

- Message first 10 users
- Schedule 15-min calls
## - Ask:
- What do you like?
- What's confusing?
- What's missing?
- Would you pay?
- What price is fair?

## **2. Analytics Review**
- Which features used most?
- Where do users drop off?
- What queries are common?
- What errors occur?

## **3. Feature Improvements**
Based on feedback:
- Fix top 3 complaints
- Improve top 2 confusing parts
- Add most requested feature

## **4. Content Addition**
- Add 10 more blog posts
- Create tutorial videos
- Write FAQs

## **5. Performance Tuning**
- Optimize slow pages
- Reduce bundle size
- Improve API response times

**Target: 4.5+ star rating, <5% churn**

**✅ Step 27 Complete!** Product improved.

## ---

## STEP 28: FYP Documentation (Day 26-27 - 12 hours)

## ### What You'll Do
Complete all FYP paperwork

### Cursor Prompt #1: Generate SRS

Based on the complete codebase, generate a comprehensive Software Requirements
Specification (SRS) document following IEEE 830 standard.
## Include:

## Introduction

## Purpose
## Scope
## Definitions
## References


## Overall Description

## Product Perspective
## Product Functions
## User Characteristics
## Constraints


## System Features

Functional Requirements (all 6 features)
## Use Cases
## Sequence Diagrams


## External Interface Requirements

## User Interfaces
## Hardware Interfaces
## Software Interfaces


Non-Functional Requirements

## Performance
## Security
## Usability
## Reliability


## Appendices


Format as professional academic document.

## ### Cursor Prompt #2: Generate Architecture Doc
Create System Architecture Document with:

High-Level Architecture Diagram
## Component Descriptions
Data Flow Diagrams (Levels 0, 1, 2)
Database Schema (ER Diagrams)
API Documentation
## Deployment Architecture
## Security Architecture
## Technology Stack Justification

Include professional diagrams and explanations.

## ### Manual Documents

## **1. User Manual**
- Screenshots of each feature
- Step-by-step tutorials
- Troubleshooting guide
## - FAQ

## **2. Testing Report**
- Test cases (50+)
- Test results
- Bug reports
- Performance benchmarks

## **3. Project Report**
## - Abstract
## - Introduction
## - Literature Review
## - Methodology
## - Implementation
## - Results
## - Conclusion
## - Future Work
- References (IEEE format)

## **4. Presentation**
- PowerPoint (20 slides)
- Demo video (5 min)

- Live demo script

**Tools:**
- Diagrams: draw.io or Lucidchart
- Documentation: Google Docs → PDF
- Presentation: PowerPoint/Canva

**✅ Step 28 Complete!** Documentation done.

## ---

## STEP 29: Final Polish & Prep (Day 28-29 - 12 hours)

## ### What You'll Do
Final touches before submission

## ### Checklist

**Code Quality:**
- [ ] All code commented
- [ ] README.md complete
- [ ] Environment variables documented
- [ ] Setup instructions clear
- [ ] Code formatted (Prettier)
- [ ] No console.errors
- [ ] All TypeScript errors fixed

**Documentation:**
- [ ] All documents proofread
- [ ] Diagrams clear and labeled
- [ ] References formatted
- [ ] Page numbers added
- [ ] Table of contents generated
- [ ] Printed and bound

**Presentation:**
- [ ] Slides polished
- [ ] Demo tested
- [ ] Talking points prepared
- [ ] Timing practiced (15 min)
- [ ] Backup plan if demo fails

**Deployment:**
- [ ] Production stable

- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Analytics working
- [ ] Monitoring setup

**FYP Requirements:**
- [ ] All forms filled
- [ ] Supervisor signature
- [ ] Plagiarism check (<20%)
- [ ] Submission deadline noted

**✅ Step 29 Complete!** Ready to submit!

## ---

## STEP 30: Submission & Demo Day (Day 30)

## ### What You'll Do
Submit FYP and present

## ### Timeline

**Morning (9 AM - 12 PM): Final Checks**
- Test live site one last time
- Verify all documents in order
- Print extra copies
- Prepare demo backup (video)

**Afternoon (12 PM - 2 PM): Submission**
- Submit documents to department
- Get submission receipt
- Confirm demo time slot

**Evening (3 PM - 5 PM): Demo Preparation**
- Setup laptop
- Test internet connection
- Test screen sharing
- Practice demo flow
- Prepare for questions

**Demo Day:**
- Introduction (2 min)
- Problem statement
- Solution overview

- Live Demo (8 min)
- Chat feature
- FIR generator
- Voice assistant
- Case predictor
- Payment flow
- Technical Overview (3 min)
## - Architecture
- Tech stack
- Challenges solved
- Results (2 min)
- User stats
## - Revenue
## - Impact
- Q&A (5 min)

**Common Questions to Prepare:**
- Why this project?
- How does RAG work?
- How accurate is the AI?
- What if AI gives wrong answer?
- How did you prevent hallucinations?
- How is this better than ChatGPT?
- What's the business model?
- What's next for the product?
- What challenges did you face?
- How scalable is it?

## **✅ STEP 30 COMPLETE!**
## **✅ FYP SUBMITTED!**
## **✅ PROJECT LIVE!**
## **✅ CONGRATS! **

## ---

## ##  POST-SUBMISSION: GROWTH PHASE

## ### Month 2-3 Goals

**Product:**
- Add 10 more features from user requests
- Improve AI accuracy to 95%+
- Add multilanguage (full Urdu support)
- Build mobile apps (React Native)


**Business:**
- Reach 1000 users
- Get 50 paying customers
- Rs. 25K monthly revenue
- Breakeven on costs

**Growth:**
- Partner with law firms
- Get featured in media
- Win startup competitions
- Raise seed funding (optional)

## ---

## ##  SUCCESS METRICS

## ### By Day 30:
- ✅ Production app live
- ✅ 6 features working
- ✅ 100+ users signed up
- ✅ 10+ paying customers
- ✅ Rs. 5K+ revenue
- ✅ FYP submitted
- ✅ A+ grade worthy

## ### Key Performance Indicators:
- Response time: <3 seconds
## - Uptime: >99%
- User satisfaction: 4.5+ stars
- Query accuracy: >85%
- Daily active users: 20+
- Conversion rate: >5%

## ---

## ##  TOOLS SUMMARY

## ### Development:
- Cursor AI (coding assistant)
## - Next.js 14 (framework)
## - Supabase (database)
- Groq (AI API)
- Qdrant (vector DB)

- Neo4j (graph DB)

## ### Design:
- Shadcn/UI (components)
- Tailwind CSS (styling)
## - Lucide (icons)
## - Framer Motion (animations)

## ### Deployment:
## - Vercel (hosting)
- GitHub (version control)
- Sentry (error tracking)
## - Google Analytics

## ### Payments:
- JazzCash (Pakistani market)
- Stripe (international - optional)

## ---

## ## ⚠ COMMON PITFALLS TO AVOID

- **Perfectionism**
- Don't spend 3 days on one feature
- Ship fast, iterate faster
- 80% done is better than 0% perfect

- **Scope Creep**
- Stick to 6 core features
- Say no to "nice to have"
- You can add later

- **Over-engineering**
- Use simple solutions first
- Don't build what you can buy/use
- Optimize only when needed

- **Ignoring Users**
- Talk to users weekly
- Fix what they complain about
- Build what they ask for

- **Neglecting FYP**
- Keep docs updated as you build

- Don't leave all documentation for last week
- Supervisor meetings matter

- **Burnout**
- Take breaks
- Sleep 6+ hours
- Balance with mids study
- It's a marathon, not sprint

## ---

## ##  PRO TIPS FOR SUCCESS

### With Cursor AI:
- **Be Specific**
- Bad: "Create a login page"
- Good: "Create app/auth/page.tsx with email/password login using Supabase, include
validation, error handling, loading states, use Shadcn UI components"

- **Iterate**
- Generate code
## - Review
- Ask for improvements
- Repeat until perfect

- **Learn**
- Read generated code
- Understand what it does
- Ask Cursor to explain
- You'll become better developer

## ### Time Management:
- **Morning**: Study for mids (2-3 hours)
- **Afternoon**: Code (4-5 hours)
- **Evening**: Study (1 hour)
- **Night**: Code (2-3 hours)

## ### When Stuck:
- Read error message carefully
- Google the error
- Ask Cursor AI
- Check documentation
- Ask me (come back to this chat)
- Ask classmates/supervisor

- StackOverflow (last resort)

## ---

## ##  SUPPORT

## ### If Something Doesn't Work:

**Step 1: Debug**
- Check browser console (F12)
- Check terminal for errors
- Check network tab
- Check Supabase logs

**Step 2: Search**
- Google the exact error
- Check GitHub issues
- Check documentation

**Step 3: Ask**
- Come back to this chat
- Show me the error
- I'll help debug

## ### Resources:
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- Groq Docs: https://console.groq.com/docs
- Cursor AI: https://cursor.sh/docs

## ---

## ##  FINAL WORDS

**This plan is aggressive but doable.**

30 days × 9 hours = 270 hours of work
Most final year projects = 100-150 hours
You're doing 2x work = 2x results

**You'll have:**
- Production SaaS product
- Real users
- Real revenue

- Amazing portfolio piece
- A+ grade
- Startup potential

**Keys to success:**
- Start Monday (no delay)
- Follow steps in order
- Don't skip manual tasks
- Use Cursor AI heavily
- Ship fast, iterate
- Talk to users
- Balance with mids
- Don't give up

**Believe in yourself.**

This is not just FYP.
This is your startup.
This is your future.

Let's build something amazing! 

## ---

## **REMEMBER:**
- Copy each "Cursor Prompt" exactly
- Do all "Manual" tasks yourself
- Test after each step
- Commit to Git daily
- Deploy often
- Ask for help when stuck

**Good luck! You got this! **

## ---

**Created by:** Claude (Anthropic)
**For:** Ali Shiar's FYP
**Project:** Legal Code Assistant
**Duration:** 30 Days
**Status:** Ready to Execute

**Version:** 1.0
**Last Updated:** Today


## ---

## **START TOMORROW. LAUNCH IN 30 DAYS. CHANGE PAKISTAN'S LEGAL SYSTEM. У**

