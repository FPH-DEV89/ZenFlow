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

Tes missions : Analyser les tâches, donner des conseils zen, et aider à la planification.
Réponds toujours de manière concise, calme et tutoyante.
Si l'utilisateur demande d'ajouter une tâche, utilise le format : [ACTION:ADD_TASK:{"title": "...", "category": "...", "priority": "..."}] en fin de message.

Voici les tâches actuelles de l'utilisateur :
${sanitizedTasks.map(t => `- ${t.title} (${t.priority}, ${t.due_date || 'Sans date'})`).join('\n')}
`;

    // Préparation de l'historique (Xai/OpenAI requièrent un premier message 'user' après 'system')
    let formattedMessages = messages
      .filter((m: any) => m.content && m.content.trim() !== "")
      .map((m: any) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content
      }));

    // Si le premier message n'est pas 'user', on le retire pour éviter le Bad Request
    while (formattedMessages.length > 0 && formattedMessages[0].role !== 'user') {
      formattedMessages.shift();
    }

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...formattedMessages
    ];

    console.log("[ZENIA DEBUG] Sending request to Xai API (grok-3)...");
    
    const xaiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${xaiApiKey}`
      },
      body: JSON.stringify({
        model: "grok-3", // Seul modèle confirmé fonctionnel via audit EPI Manager
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!xaiResponse.ok) {
      const errorData = await xaiResponse.json();
      console.error("[ZENIA DEBUG] XAI API ERROR:", errorData);
      const errorMsg = errorData.error?.message || JSON.stringify(errorData);
      throw new Error(`Xai API Error: ${errorMsg}`);
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
