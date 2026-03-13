'use client';

import { createClient } from './supabase';

export interface Task {
  id?: number;
  user_id?: string;
  group_id?: string;
  title: string;
  category: 'work' | 'personal' | 'shared';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  due_time?: string;
  created_at?: string;
  completed: boolean;
  notification_sent?: boolean;
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  created_at: string;
}


const supabase = createClient();

export async function addTask(task: Omit<Task, 'id' | 'created_at' | 'completed' | 'user_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  const { error } = await supabase
    .from('tasks')
    .insert({
      ...task,
      user_id: user.id,
      completed: false,
    });
  
  if (error) console.error('Error adding task:', error.message);
}

export async function getAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error.message);
    return [];
  }
  return data || [];
}

export async function getTask(id: number): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching task:', error.message);
    return null;
  }
  return data;
}

export async function toggleTaskCompletion(id: number, currentStatus: boolean) {
  const { error } = await supabase
    .from('tasks')
    .update({ completed: !currentStatus })
    .eq('id', id);

  if (error) console.error('Error toggling task:', error.message);
}

export async function deleteTask(id: number) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) console.error('Error deleting task:', error.message);
}

export async function updateTask(id: number, updates: Partial<Omit<Task, 'id' | 'created_at' | 'user_id'>>) {
  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id);

  if (error) console.error('Error updating task:', error.message);
}

export async function createGroup(name: string): Promise<Group | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('groups')
    .insert({ name, created_by: user.id })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating group:', error.message);
    return null;
  }
  return data;
}

export async function getUserGroups(): Promise<Group[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching groups:', error.message);
    return [];
  }
  return data || [];
}
