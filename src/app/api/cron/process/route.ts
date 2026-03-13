import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

export async function GET(request: Request) {
  // 1. Vérification stricte du secret (Protection de la route)
  const authHeader = request.headers.get('Authorization');
  const CRON_SECRET = process.env.CRON_SECRET;
  
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized CRON execution' }, { status: 401 });
  }

  // 2. Initialisation Web-Push
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 });
  }

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
          
          // Différence en minutes par rapport à l'heure de Paris
          const diffMins = taskInMins - nowInMins;
          
          // Si la tâche arrive dans <= 16 minutes, ou est en retard depuis moins de 60 minutes
          if (diffMins <= 16 && diffMins >= -60) {
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

    return NextResponse.json({ success: true, processedTasks: sentCount, evaluatedTasks: tasksToNotify.length });

  } catch (error: any) {
    console.error('Erreur Critique CRON:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
