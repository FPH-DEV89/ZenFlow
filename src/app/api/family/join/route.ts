import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { groupId, userId } = await request.json();

    if (!groupId || !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabaseAdmin = createAdminSupabaseClient();

    // 1. Vérifier si le groupe existe
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('id')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
        return NextResponse.json({ error: 'Invalid group' }, { status: 404 });
    }

    // 2. Vérifier si l'utilisateur est déjà membre
    const { data: existingMember } = await supabaseAdmin
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
        return NextResponse.json({ success: true, message: 'Already a member' });
    }

    // 3. Ajouter l'utilisateur
    const { error: insertError } = await supabaseAdmin
      .from('group_members')
      .insert({
          group_id: groupId,
          user_id: userId,
          role: 'member'
      });

    if (insertError) {
        throw insertError;
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erreur Join Group:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
