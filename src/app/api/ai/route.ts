import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { AiRequestSchema } from '@/lib/validation';

/**
 * Assainit une chaîne de caractères pour éviter les injections simples ou les caractères de contrôle.
 */
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  // Supprime les balises HTML potentielles et les caractères de contrôle suspects
  return input
    .replace(/<[^>]*>?/gm, '')
    .substring(0, 500); // Limite raisonnable pour un titre/message
}

export async function POST(req: Request) {
  console.log("[ZENIA DEBUG] Incoming POST request to /api/ai");
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn("Unauthorized AI attempt.");
      return NextResponse.json({ error: "Authentification requise pour utiliser Zenia." }, { status: 401 });
    }

    const body = await req.json();
    
    // Validation Zod
    const validation = AiRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Format de requête invalide.", 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const { messages: rawMessages, tasks: rawTasks } = validation.data;

    const messages = (rawMessages || []).map((m: any) => ({
      ...m,
      content: sanitizeInput(m.content)
    }));
    
    // On assainit aussi les titres des tâches passées en contexte
    const tasks = (rawTasks || []).map((t: any) => ({
      ...t,
      title: sanitizeInput(t.title)
    }));
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    if (!apiKey) {
      console.error("[ZENIA DEBUG] GOOGLE_GENERATIVE_AI_API_KEY is missing!");
      return NextResponse.json({ error: "Configuration IA manquante." }, { status: 500 });
    }

    console.log("[ZENIA DEBUG] API Key OK (starts with:", apiKey.substring(0, 4) + ")");

    const genAI = new GoogleGenerativeAI(apiKey);
    
    const nowInParis = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
    const todayISO = new Date().toISOString().split('T')[0];

    const systemPrompt = `Tu es Zenia, une assistante IA spécialisée dans la réduction de la charge mentale pour l'application ZenFlow.
Date et heure actuelles (Paris) : ${nowInParis}

Tes objectifs :
1. Analyser les tâches de l'utilisateur pour évaluer sa charge mentale.
2. Donner des conseils bienveillants et zen.
3. Aider l'utilisateur à prioriser ou planifier.
4. Tu peux suggérer des actions techniques (ex: "Je vais ajouter cette tâche pour toi").

Contexte des tâches :
${JSON.stringify(tasks)}

Instructions importantes :
- Si la journée de l'utilisateur (tâches avec due_date === "${todayISO}") est vide, regarde impérativement s'il y a des tâches "hors-planning" (sans due_date).
- Suggère à l'utilisateur de planifier ces tâches orphelines ou de profiter de son temps libre pour en avancer une.
- Réponds toujours de manière concise, calme et encourageante.
- Si l'utilisateur demande d'ajouter une tâche, réponds en confirmant l'intention et utilise un format spécial en fin de message si tu veux que l'interface le fasse : [ACTION:ADD_TASK:{"title": "...", "category": "work|personal|shared", "priority": "low|medium|high"}]
- Utilise le tutoiement pour créer une proximité zen.
`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: {
        role: "system",
        parts: [{ text: systemPrompt }]
      }
    });

    const chatHistory = messages.slice(0, -1)
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

    // Gemini requires the first message in history to be from 'user'
    // If our history starts with 'model', we remove it
    if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      console.log("[ZENIA DEBUG] Shifting history to start with user message.");
      chatHistory.shift();
    }

    console.log("[ZENIA DEBUG] Chat History items:", chatHistory.length);
    if (chatHistory.length > 0) {
      console.log("[ZENIA DEBUG] First message role after shift:", chatHistory[0].role);
    }

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.7,
      },
    });

    const userMessage = messages[messages.length - 1].content;
    console.log("[ZENIA DEBUG] Sending user message length:", userMessage.length);
    
    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const text = response.text();
    console.log("[ZENIA DEBUG] Success! Response length:", text.length);
    console.log("Gemini response received.");

    return NextResponse.json({ content: text });
  } catch (error: any) {
    console.error("AI Error Details:", error.message || error);
    return NextResponse.json({ 
      error: "Désolé, Zenia se repose un instant.",
      details: error.message 
    }, { status: 500 });
  }
}
