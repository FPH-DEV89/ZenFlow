import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { AiRequestSchema } from '@/lib/validation';

/**
 * Zenia AI - Powered by Xai (Grok-beta)
 * Migration status: Completed & Verified
 */

// Fonction simple pour nettoyer les entrées et éviter les injections basiques
function sanitizeInput(text: string): string {
  if (!text) return "";
  return text.replace(/<[^>]*>?/gm, '').trim();
}

export async function POST(req: Request) {
  console.log("[ZENIA DEBUG] Incoming POST request to /api/ai (XAI/Grok)");
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    
    // Validation avec Zod
    const validatedData = AiRequestSchema.parse(body);
    const { messages, tasks = [] } = validatedData;

    // Assainissement des tâches pour le contexte
    const sanitizedTasks = tasks.map((t: any) => ({
      due_date: t.due_date,
      priority: t.priority,
      category: t.category,
      title: sanitizeInput(t.title)
    }));
    
    const xaiApiKey = process.env.XAI_API_KEY;
    
    if (!xaiApiKey) {
      console.error("[ZENIA DEBUG] XAI_API_KEY is missing!");
      return NextResponse.json({ error: "Configuration IA (Xai) manquante." }, { status: 500 });
    }

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
${JSON.stringify(sanitizedTasks)}

Instructions importantes :
- Si la journée de l'utilisateur (tâches avec due_date === "${todayISO}") est vide, regarde impérativement s'il y a des tâches "hors-planning" (sans due_date).
- Suggère à l'utilisateur de planifier ces tâches orphelines ou de profiter de son temps libre pour en avancer une.
- Réponds toujours de manière concise, calme et encourageante.
- Si l'utilisateur demande d'ajouter une tâche, réponds en confirmant l'intention et utilise un format spécial en fin de message : [ACTION:ADD_TASK:{"title": "...", "category": "work|personal|shared", "priority": "low|high"}]
- Utilise le tutoiement pour créer une proximité zen.
`;

    // Préparation de l'historique pour l'API Xai (standard OpenAI)
    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content
      }))
    ];

    console.log("[ZENIA DEBUG] Sending request to Xai API (grok-beta)...");
    
    const xaiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${xaiApiKey}`
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!xaiResponse.ok) {
      const errorData = await xaiResponse.json();
      throw new Error(`Xai API Error: ${errorData.error?.message || xaiResponse.statusText}`);
    }

    const data = await xaiResponse.json();
    const text = data.choices[0].message.content;
    
    console.log("[ZENIA DEBUG] Xai response received successfully.");

    return NextResponse.json({ content: text });
  } catch (error: any) {
    console.error("[ZENIA DEBUG ERROR]", error);
    return NextResponse.json({ 
      error: `Erreur IA : ${error.message || "Inconnue"}` 
    }, { status: 500 });
  }
}
