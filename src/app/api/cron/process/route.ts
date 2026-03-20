import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

export async function GET(request: Request) {
  // 1. Vérification stricte du secret (Protection de la route)
  const authHeader = request.headers.get('Authorization');
  const CRON_SECRET = process.env.CRON_SECRET || 'zenflow_cron_pass_2026';
  
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized CRON execution' }, { status: 401 });
  }

  // 2. Initialisation Web-Push
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BJFlZ3Y1r7eeYxEX-A3XVhQMA5sUseRaxHOz_rQRqXNe4jcier3BkE29IBbYRnB4OV792buEaPsIba-MtllwDas';
  const privateKey = process.env.VAPID_PRIVATE_KEY || 'XWmKBo_pov0m7h9U8wEf9hYmaxvEcQyHvBoGPcjVhNo';

  webpush.setVapidDetails(
    'mailto:test@example.com',
    publicKey,
    privateKey
  );

  try {
    const supabase = createAdminSupabaseClient();
    
    // 3. Calcul du temps précis en Europe/Paris (pour Vercel UTC)
    const now = new Date();
    const parisFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });
    
    const parts = parisFormatter.formatToParts(now);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
    
    const todayStr = `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
    const currentH = Number(getPart('hour'));
    const currentM = Number(getPart('minute'));
    const nowInMins = currentH * 60 + currentM;
    
    // 4. Récupérer les tâches de la journée, non terminées, dont on n'a pas encore envoyé de notif
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('completed', false)
      .eq('due_date', todayStr)
      .neq('notification_sent', true); // .neq true = false ou null (anciennes tâches)
      
    if (tasksError) throw tasksError;
    
    const tasksToNotify = [];
    
    // 5. Filtrage précis de l'imminence (15-16 minutes)
    for (const task of tasks || []) {
       if (task.due_time) {
          const [taskH, taskM] = task.due_time.split(':').map(Number);
          const taskInMins = taskH * 60 + taskM;
          
          const offset = task.reminder_offset ?? 15;
          const targetMins = taskInMins - offset;
          
          // Différence en minutes par rapport à l'heure de Paris
          const diffMins = targetMins - nowInMins;
          
          // Si on est dans la fenêtre (-15 à +15 mins du moment de rappel)
          if (diffMins <= 15 && diffMins >= -15) {
             tasksToNotify.push(task);
          }
       }
    }

    let sentCount = 0;

    // 5. Envoi groupé des notifications Push
    const userIds = Array.from(new Set(tasksToNotify.map(t => t.user_id)));
    
    if (userIds.length > 0) {
      // Récupérer les tokens Push des utilisateurs concernés
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', userIds);
        
      const subMap = new Map();
      subs?.forEach(s => subMap.set(s.user_id, s.subscription));
      
      for (const task of tasksToNotify) {
        const subscription = subMap.get(task.user_id);
        if (subscription) {
           const payload = JSON.stringify({
             title: `Rappel Imminent: ${task.title} ⏰`,
             body: task.priority === 'high' ? 'Cette tâche urgente demande votre attention !' : "Il est bientôt l'heure de s'y mettre.",
             url: '/'
           });
           
           try {
             await webpush.sendNotification(subscription, payload);
             
             // 6. Marquer comme "envoyée" pour ne plus spammer
             await supabase
               .from('tasks')
               .update({ notification_sent: true })
               .eq('id', task.id);
               
             sentCount++;
           } catch (e: any) {
             console.error(`Échec Push user ${task.user_id} - task ${task.id}`, e);
             // Si l'abonnement est expiré, on pourrait le supprimer de la BDD ici (erreur 410)
             if (e.statusCode === 410) {
               await supabase.from('push_subscriptions').delete().eq('user_id', task.user_id);
             }
           }
        }
      }
    }

    // 6.5. Rapports Quotidiens (Matin / Soir)
    let reportsCount = 0;
    const { data: settingsData } = await supabase.from('user_settings').select('*');
    
    if (settingsData && settingsData.length > 0) {
      // Récupération des souscriptions de tous les utilisateurs
      const { data: allSubs } = await supabase.from('push_subscriptions').select('*');
      const allSubMap = new Map();
      allSubs?.forEach(s => allSubMap.set(s.user_id, s.subscription));

      for (const setting of settingsData) {
         const subscription = allSubMap.get(setting.user_id);
         if (!subscription) continue;

         let needsMorning = false;
         let needsEvening = false;

         // Résumé Matin
         if (setting.morning_summary_enabled && setting.last_morning_summary_date !== todayStr) {
            const [mH, mM] = (setting.morning_summary_time || '08:00').split(':').map(Number);
            if (nowInMins >= (mH * 60 + mM)) {
              needsMorning = true;
            }
         }

         // Bilan Soir
         if (setting.evening_summary_enabled && setting.last_evening_summary_date !== todayStr) {
            const [eH, eM] = (setting.evening_summary_time || '21:00').split(':').map(Number);
            if (nowInMins >= (eH * 60 + eM)) {
              needsEvening = true;
            }
         }

         const pushPromises = [];
         const updates = {};

         if (needsMorning) {
            const payload = JSON.stringify({
               title: `🌅 Bonjour ! Voici votre programme`,
               body: `Ouvrez ZenFlow pour voir ce qui vous attend aujourd'hui.`,
               url: '/'
            });
            pushPromises.push(webpush.sendNotification(subscription, payload).catch(e => console.error('Push Matin failed', e)));
            Object.assign(updates, { last_morning_summary_date: todayStr });
            reportsCount++;
         }

         if (needsEvening) {
            const payload = JSON.stringify({
               title: `🌇 Bilan de la journée`,
               body: `Regardez ce que vous avez accompli et planifiez demain.`,
               url: '/'
            });
            pushPromises.push(webpush.sendNotification(subscription, payload).catch(e => console.error('Push Soir failed', e)));
            Object.assign(updates, { last_evening_summary_date: todayStr });
            reportsCount++;
         }

         if (pushPromises.length > 0) {
            await Promise.all(pushPromises);
            await supabase.from('user_settings').update(updates).eq('user_id', setting.user_id);
         }
      }
    }

    // 7. Gestion des Tâches Récurrentes (Génération automatique)
    const { data: recurringMasters, error: recurringError } = await supabase
      .from('tasks')
      .select('*')
      .not('recurrence', 'is', null)
      .lte('next_generation_date', todayStr);
      
    if (recurringError) throw recurringError;

    let recurringCount = 0;
    for (const master of recurringMasters || []) {
       // Création de l'instance pour la date prévue
       const { error: insertError } = await supabase
         .from('tasks')
         .insert({
           user_id: master.user_id,
           group_id: master.group_id,
           title: master.title,
           category: master.category,
           priority: master.priority,
           due_date: master.next_generation_date,
           due_time: master.due_time,
           parent_task_id: master.id,
           completed: false
         });
         
       if (!insertError) {
          // Calcul de la date SUIVANTE
          const d = new Date(master.next_generation_date);
          if (master.recurrence === 'daily') d.setDate(d.getDate() + 1);
          else if (master.recurrence === 'weekly') d.setDate(d.getDate() + 7);
          else if (master.recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
          
          await supabase
            .from('tasks')
            .update({ next_generation_date: d.toISOString().split('T')[0] })
            .eq('id', master.id);
            
          recurringCount++;
       } else {
          console.error(`Erreur génération tâche récurrente ${master.id}:`, insertError);
       }
    }

    return NextResponse.json({ 
      success: true, 
      processedTasks: sentCount, 
      evaluatedTasks: tasksToNotify.length,
      generatedRecurringTasks: recurringCount,
      dailyReportsSent: reportsCount
    });

  } catch (error: any) {
    console.error('Erreur Critique CRON:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
