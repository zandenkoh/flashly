import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
    "https://flashly-edu.github.io/flashly/",
    "https://zandenkoh.github.io/flashly/",
    "file:///media/fuse/crostini_0faac8f53b8ab13cc97e797d409251b9ebf71a44_termina_penguin/flashly/"
];

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Support both JSON array 'GROQ_KEYS' or individual secrets 'GROQ_KEY_1', 'GROQ_KEY_2', etc.
function getApiKey() {
    const jsonPool = Deno.env.get('GROQ_KEYS');
    let keys: string[] = [];

    if (jsonPool) {
        try { keys = JSON.parse(jsonPool); } catch (e) { console.error("Error parsing GROQ_KEYS JSON pool"); }
    }

    // Also look for individual GROQ_KEY_... secrets
    const allEnv = Deno.env.toObject();
    Object.keys(allEnv).forEach(key => {
        if (key.startsWith('GROQ_KEY_')) {
            keys.push(allEnv[key]);
        }
    });

    if (keys.length === 0) return Deno.env.get('GROQ_API_KEY'); // Fallback to single key
    return keys[Math.floor(Math.random() * keys.length)];
}

// Optimization: Capture the most important parts of long docs while staying under token limits
function smartTruncate(text: string, maxChars = 15000) {
    if (text.length <= maxChars) return text;
    const half = Math.floor(maxChars / 2);
    return text.substring(0, half) + "\n\n[... content truncated for brevity ...]\n\n" + text.substring(text.length - half);
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { action, content, note_title, cardCount, difficulty } = await req.json();
        const authHeader = req.headers.get('Authorization')!;
        const referer = req.headers.get('referer') || req.headers.get('origin') || "";

        console.log("Incoming Request:", { action, referer });
        // Log all header keys for debugging
        console.log("Header Keys:", Array.from(req.headers.keys()).join(", "));

        // 1. ORIGIN SECURITY CHECK (Disabled to unblock local developer)
        // Security is maintained by the supabase.auth.getUser() session check below.

        const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
        const supabaseUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authUserErr } = await supabaseUser.auth.getUser();
        if (authUserErr || !user) {
            console.error("Auth User Error:", authUserErr);
            return new Response(JSON.stringify({ error: "Unauthorized - Session missing" }), { status: 401, headers: corsHeaders });
        }

        const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).single();
        const now = new Date();

        if (action === 'generate_deck' && profile.last_ai_deck_at) {
            const lastDeck = new Date(profile.last_ai_deck_at);
            if ((now.getTime() - lastDeck.getTime()) / (1000 * 3600 * 24) < 7) {
                return new Response(JSON.stringify({ error: "Limit: 1 AI deck per week." }), { status: 429, headers: corsHeaders });
            }
        }

        if (action === 'summarize') {
            const lastSummary = profile.last_summary_at ? new Date(profile.last_summary_at) : null;
            const isSameDay = lastSummary && lastSummary.toDateString() === now.toDateString();
            const currentCount = isSameDay ? (profile.daily_ai_summaries || 0) : 0;

            if (currentCount >= 5) {
                return new Response(JSON.stringify({ error: "Daily Limit: 5 AI summaries per day." }), { status: 429, headers: corsHeaders });
            }
        }

        const api_key = getApiKey();
        if (!api_key) throw new Error("No Groq API keys found in secrets.");

        // --- OPTIMIZATION: Shrink content to fit context window ---
        const optimizedContent = smartTruncate(content || "");

        let messages = [];
        if (action === 'generate_deck') {
            messages = [
                {
                    role: "system",
                    content: `You are an Elite Academic Tutor and Anki Specialist. 
                    YOUR TASK: Generate high-quality flashcards for active recall.
                    RULES:
                    1. ATOMICITY: Each card must cover exactly ONE concept. 
                    2. CLARITY: Questions must be unambiguous. Answers must be concise.
                    3. No generic cards. Focus on high-yield information.
                    4. FORMAT: You MUST return a JSON object with 'suggested_title' and 'cards' (array of {front, back}).
                    5. DIFFICULTY: Higher difficulty means more conceptual/analytical questions.`
                },
                { role: "user", content: `Generate ${cardCount} flashcards (${difficulty} level) from this text:\n\n${optimizedContent}` }
            ];
        } else {
            messages = [
                {
                    role: "system",
                    content: `You are an expert academic summarizer specializing in creating concise, high-impact study notes.
                    
                    TASK: Analyze the content and create a structured summary.
                    
                    OUTPUT FORMAT (JSON):
                    {
                        "title": "Brief descriptive title (3-5 words max)",
                        "key_points": [
                            "First key insight or concept",
                            "Second key insight or concept",
                            "Third key insight or concept",
                            "Fourth key insight or concept",
                            "Fifth key insight or concept"
                        ]
                    }
                    
                    RULES:
                    1. Extract EXACTLY 5 key points (no more, no less)
                    2. Each point should be ONE clear, complete sentence
                    3. Focus on the most important concepts, facts, or insights
                    4. Use clear, concise language (15-25 words per point)
                    5. DO NOT use bullet symbols (•, -, *) in the text
                    6. DO NOT use markdown formatting (**bold**, etc.)
                    7. Make each point actionable and memorable for studying
                    8. Return ONLY valid JSON with the exact structure shown above`
                },
                { role: "user", content: `Analyze and summarize the following academic content titled '${note_title}':\n\n${optimizedContent}` }
            ];
        }

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${api_key}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages,
                response_format: { type: "json_object" },
                temperature: 0.6
            })
        });

        const completion = await groqRes.json();

        // Robust Parsing
        let result;
        try {
            const rawContent = completion.choices[0].message.content;
            result = JSON.parse(rawContent);
        } catch (e) {
            console.error("JSON Parse Error:", completion.choices?.[0]?.message?.content);
            throw new Error("AI returned invalid data format. Please try again.");
        }

        // Limit Update
        const updates: any = action === 'generate_deck' ?
            { last_ai_deck_at: now.toISOString() } :
            {
                daily_ai_summaries: (profile.last_summary_at && new Date(profile.last_summary_at).toDateString() === now.toDateString()) ? (profile.daily_ai_summaries + 1) : 1,
                last_summary_at: now.toISOString()
            };

        await supabaseAdmin.from('profiles').update(updates).eq('id', user.id);

        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
});
