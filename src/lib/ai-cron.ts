import { Task } from './db';

const XAI_API_KEY = process.env.XAI_API_KEY;

export async function generateSmartSummary(tasks: Partial<Task>[], type: 'morning' | 'evening'): Promise<string> {
  const fallbackMorning = "Ouvrez ZenFlow pour voir ce qui vous attend aujourd'hui. 🌅";
  const fallbackEvening = "Regardez ce que vous avez accompli et planifiez demain. 🌇";
  const fallback = type === 'morning' ? fallbackMorning : fallbackEvening;

  if (!XAI_API_KEY) {
    console.warn("XAI_API_KEY manquante, utilisation du texte par défaut.");
    return fallback;
  }

  const nowInParis = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
  
  let instructions = "";
  let tasksContext = "";

  if (type === 'morning') {
    instructions = `Tu es Zenia, une assistante IA zen. C'est le matin. Voici les tâches prévues aujourd'hui. Rédige une très courte notification (max 110 caractères) pour souhaiter une bonne journée et motiver l'utilisateur. Tu peux mentionner une tâche clé. Reste naturel et ultra-concis. Signe avec "🌸 Zenia".`;
    tasksContext = tasks.length > 0 
      ? tasks.map(t => `- ${t.title} (${t.priority || 'medium'})`).join('\\n')
      : "Aucune tâche prévue aujourd'hui. Suggère de se reposer ou d'en ajouter une.";
  } else {
    instructions = `Tu es Zenia, une assistante IA zen. C'est le soir. Voici les tâches accomplies aujourd'hui. Rédige une très courte notification (max 110 caractères) pour féliciter l'utilisateur de ses accomplissements. Si aucune, encourage pour demain. Reste très concis. Signe avec "🌸 Zenia".`;
    tasksContext = tasks.length > 0 
      ? tasks.map(t => `- ${t.title}`).join('\\n')
      : "Aucune tâche complétée aujourd'hui.";
  }

  const systemPrompt = `${instructions}
Date et heure : ${nowInParis}
Tâches :
${tasksContext}`;

  try {
    const xaiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "grok-3",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: "Génère la notification." }],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!xaiResponse.ok) {
      console.error("[ZENIA CRON ERROR]", await xaiResponse.text());
      return fallback;
    }

    const data = await xaiResponse.json();
    let text = data.choices[0].message.content.trim();
    // Nettoyer les guillemets si l'IA en met
    text = text.replace(/^["']|["']$/g, '');
    return text || fallback;

  } catch (error) {
    console.error("[ZENIA CRON EXCEPTION]", error);
    return fallback;
  }
}
