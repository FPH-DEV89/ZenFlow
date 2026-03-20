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
  recurrence?: 'daily' | 'weekly' | 'monthly';
  parent_task_id?: number | null;
  next_generation_date?: string | null;
  subtasks_total?: number;
  subtasks_completed?: number;
  reminder_offset?: number;
}

export interface UserSettings {
  user_id: string;
  morning_summary_enabled: boolean;
  morning_summary_time: string;
  evening_summary_enabled: boolean;
  evening_summary_time: string;
  default_reminder: number;
  push_enabled: boolean;
  sounds: boolean;
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

export interface SubTask {
  id: string;
  task_id: number;
  title: string;
  completed: boolean;
  position: number;
  created_at?: string;
}


const supabase = createClient();

export async function addTask(
  task: Omit<Task, 'id' | 'created_at' | 'completed' | 'user_id'>,
  subtasks?: string[]
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  let nextGenDate: string | null = null;
  if (task.recurrence) {
    const baseDate = task.due_date || new Date().toISOString().split('T')[0];
    const d = new Date(baseDate);
    if (task.recurrence === 'daily') d.setDate(d.getDate() + 1);
    else if (task.recurrence === 'weekly') d.setDate(d.getDate() + 7);
    else if (task.recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
    nextGenDate = d.toISOString().split('T')[0];
  }
  
  const { data: newTask, error } = await supabase
    .from('tasks')
    .insert({
      ...task,
      user_id: user.id,
      completed: false,
      next_generation_date: nextGenDate
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding task:', error.message);
    return;
  }

  if (subtasks && subtasks.length > 0 && newTask) {
    const subtasksToInsert = subtasks.map((title, index) => ({
      task_id: newTask.id,
      title,
      position: index,
      completed: false
    }));
    
    const { error: subError } = await supabase
      .from('subtasks')
      .insert(subtasksToInsert);
      
    if (subError) console.error('Error adding initial subtasks:', subError.message);
  }
}

export async function getAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('task_with_stats')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks from view:', error.message);
    // Fallback to table if view fails
    const { data: fallbackData } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    return fallbackData || [];
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

export async function getSubTasks(taskId: number): Promise<SubTask[]> {
  const { data, error } = await supabase
    .from('subtasks')
    .select('*')
    .eq('task_id', taskId)
    .order('position', { ascending: true });
    
  if (error) {
    console.error('Error fetching subtasks:', error.message);
    return [];
  }
  return data || [];
}

export async function addSubTask(taskId: number, title: string) {
  const { error } = await supabase
    .from('subtasks')
    .insert({ task_id: taskId, title });
    
  if (error) console.error('Error adding subtask:', error.message);
}

export async function toggleSubTask(id: string, currentStatus: boolean) {
  const { error } = await supabase
    .from('subtasks')
    .update({ completed: !currentStatus })
    .eq('id', id);
    
  if (error) console.error('Error toggling subtask:', error.message);
}

export async function deleteSubTask(id: string) {
  const { error } = await supabase
    .from('subtasks')
    .delete()
    .eq('id', id);
    
  if (error) console.error('Error deleting subtask:', error.message);
}

export async function getUserSettings(): Promise<UserSettings> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No user found");
  
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();
    
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user settings:', error.message);
  }
  
  return data || {
    user_id: user.id,
    morning_summary_enabled: true,
    morning_summary_time: '08:00',
    evening_summary_enabled: false,
    evening_summary_time: '21:00',
    default_reminder: 15,
    push_enabled: false,
    sounds: true
  };
}

export async function updateUserSettings(settings: Partial<UserSettings>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  const { error } = await supabase
    .from('user_settings')
    .upsert({ ...settings, user_id: user.id });
    
  if (error) console.error('Error updating settings:', error.message);
}
