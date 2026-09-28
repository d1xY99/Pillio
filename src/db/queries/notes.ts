import { eq } from 'drizzle-orm';

import { apiDelete, apiPatch, apiPost } from '@/api/client';
import { getDb } from '@/db/client';
import { notifyDbChanged } from '@/db/events';
import { createId } from '@/db/ids';
import { notes, type NewNote, type Note } from '@/db/schema';
import { keepLocalSlice } from '@/sync/cloud';

export type NoteInput = {
  title: string;
  body?: string | null;
  category: string;
  color: string;
  pinned?: boolean;
};

export function listNotes(archived = false): Note[] {
  return getDb()
    .select()
    .from(notes)
    .where(eq(notes.archived, archived))
    .all()
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
}

export function getNote(id: string): Note | undefined {
  return getDb().select().from(notes).where(eq(notes.id, id)).get();
}

export function createNote(input: NoteInput): Note {
  const id = createId();
  const now = Date.now();
  const row: NewNote = {
    id,
    title: input.title.trim() || 'Untitled',
    body: input.body?.trim() ?? '',
    category: input.category,
    color: input.color,
    pinned: input.pinned ?? false,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  getDb().insert(notes).values(row).run();
  keepLocalSlice('notes');
  notifyDbChanged();
  void apiPost('/notes', row).catch(() => undefined);
  return getNote(id)!;
}

export function updateNote(id: string, input: NoteInput): void {
  getDb()
    .update(notes)
    .set({
      title: input.title.trim() || 'Untitled',
      body: input.body?.trim() ?? '',
      category: input.category,
      color: input.color,
      pinned: input.pinned ?? false,
      updatedAt: Date.now(),
    })
    .where(eq(notes.id, id))
    .run();
  keepLocalSlice('notes');
  notifyDbChanged();
  void apiPatch(`/notes/${id}`, input).catch(() => undefined);
}

export function setNotePinned(id: string, pinned: boolean): void {
  getDb().update(notes).set({ pinned, updatedAt: Date.now() }).where(eq(notes.id, id)).run();
  keepLocalSlice('notes');
  notifyDbChanged();
  void apiPatch(`/notes/${id}`, { pinned }).catch(() => undefined);
}

export function setNoteArchived(id: string, archived: boolean): void {
  getDb().update(notes).set({ archived, updatedAt: Date.now() }).where(eq(notes.id, id)).run();
  keepLocalSlice('notes');
  notifyDbChanged();
  void apiPatch(`/notes/${id}`, { archived }).catch(() => undefined);
}

export function deleteNote(id: string): void {
  getDb().delete(notes).where(eq(notes.id, id)).run();
  keepLocalSlice('notes');
  notifyDbChanged();
  void apiDelete(`/notes/${id}`).catch(() => undefined);
}
