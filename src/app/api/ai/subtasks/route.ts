import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { title } = await req.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: "Titre de tâche invalide" }, { status: 400 });
    }

    const xaiApiKey = process.env.XAI_API_KEY;
    if (!xaiApiKey) {
      return NextResponse.json({ error: "Clé API XAI manquante" }, { status: 500 });
    }

    const systemPrompt = `Tu es Zenia, l'assistante ultra-compétente de l'application ZenFlow. L'utilisateur veut accomplir la tâche suivante : "${title}". 
Ta mission est de découper cette tâche en 3 à 5 sous-tâches logiques, chronologiques et très concises (moins de 10 mots par sous-tâche).
IMPORTANT : Tu dois renvoyer UNIQUEMENT un tableau JSON valide contenant des chaînes de caractères, rien d'autre. Pas de markdown, pas de texte avant ou après.
Exemple de réponse attendue:
["Préparer le matériel", "Réaliser le travail", "Vérifier le résultat"]`;

    const xaiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${xaiApiKey}`
      },
      body: JSON.stringify({
        model: "grok-3",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Découpe la tâche : ${title}` }],
        temperature: 0.3, // Température basse pour avoir un format JSON stable
        max_tokens: 200
      })
    });

    if (!xaiResponse.ok) {
      const err = await xaiResponse.text();
      console.error("[ZENIA SUBTASKS ERROR]", err);
      return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
    }

    const data = await xaiResponse.json();
    let text = data.choices[0].message.content.trim();
    
    // Nettoyage au cas où Grok rajouterait des backticks markdown (ex: ```json [...] ```)
    text = text.replace(/```json|```/g, '').trim();

    try {
      const subtasks = JSON.parse(text);
      if (!Array.isArray(subtasks)) {
        throw new Error("L'IA n'a pas renvoyé un tableau.");
      }
      return NextResponse.json({ subtasks });
    } catch (parseError) {
      console.error("[ZENIA SUBTASKS PARSE ERROR]", parseError, "Texte reçu:", text);
      return NextResponse.json({ error: "Format inattendu de l'IA" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("[ZENIA API ERROR]", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
