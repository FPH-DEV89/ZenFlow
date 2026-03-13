import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { PushSubscriptionSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validation Zod
    const validation = PushSubscriptionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Format de souscription invalide.", 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const subscription = validation.data;
    const supabase = createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete existing subscription for this user to avoid duplicates
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id);

    // Insert new subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: user.id,
        subscription: subscription,
      });

    if (error) {
      console.error('Error saving push subscription:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Invalid request body:', err);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
