
import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

export async function POST(request: Request) {
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
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's subscription from DB
    const { data: subData, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', user.id)
      .single();

    if (error || !subData) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const payload = JSON.stringify({
      title: 'ZenFlow Test 🧘',
      body: 'Ceci est une notification de test ! Si vous la voyez, bravo.',
      url: '/'
    });

    console.log('Attempting to send notification to user:', user.id);
    await webpush.sendNotification(subData.subscription, payload);
    console.log('Notification sent successfully to user:', user.id);

    return NextResponse.json({ success: true, message: 'Notification envoyée avec succès.' });
  } catch (err: any) {
    console.error('Error sending test notification:', err);
    return NextResponse.json({ 
      error: 'Échec de l\'envoi de la notification', 
      details: err.message,
      statusCode: err.statusCode || 500
    }, { status: 500 });
  }
}
