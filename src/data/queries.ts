import { supabase, uint8ArrayToBytea, byteaToUint8Array } from '../api/supabase';
import { 
  EntryPlain, 
  EntryEncrypted, 
  ConversationPlain, 
  ConversationEncrypted,
  MessagePlain,
  MessageEncrypted,
  EntryCreate,
  ConversationCreate,
  MessageCreate
} from './schemas';
import { encrypt, decrypt } from '../crypto/encryption';
import { CryptoKey } from '../utils/types';

/**
 * Entry queries
 */
export class EntryQueries {
  /**
   * Get all entries for a user (encrypted)
   */
  static async getEntries(userId: string, limit = 100, offset = 0): Promise<EntryEncrypted[]> {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('entry_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return data.map(row => ({
      id: row.id,
      user_id: row.user_id,
      created_at: row.created_at,
      entry_at: row.entry_at,
      mood: row.mood,
      title_enc: byteaToUint8Array(row.title_enc),
      body_enc: byteaToUint8Array(row.body_enc),
      iv: byteaToUint8Array(row.iv),
      tags_enc: row.tags_enc ? byteaToUint8Array(row.tags_enc) : undefined,
      deleted_at: row.deleted_at
    }));
  }

  /**
   * Create a new entry
   */
  static async createEntry(
    userId: string, 
    entry: EntryCreate, 
    encryptionKey: CryptoKey
  ): Promise<EntryEncrypted> {
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    // Encrypt fields
    const titleEncrypted = await encrypt(entry.title, encryptionKey, iv);
    const bodyEncrypted = await encrypt(entry.body, encryptionKey, iv);
    const tagsEncrypted = entry.tags.length > 0 
      ? await encrypt(JSON.stringify(entry.tags), encryptionKey, iv)
      : undefined;

    const { data, error } = await supabase
      .from('entries')
      .insert([{
        user_id: userId,
        entry_at: entry.entry_at || new Date().toISOString(),
        mood: entry.mood,
        title_enc: uint8ArrayToBytea(titleEncrypted.ciphertext),
        body_enc: uint8ArrayToBytea(bodyEncrypted.ciphertext),
        iv: uint8ArrayToBytea(iv),
        tags_enc: tagsEncrypted ? uint8ArrayToBytea(tagsEncrypted.ciphertext) : null
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      user_id: data.user_id,
      created_at: data.created_at,
      entry_at: data.entry_at,
      mood: data.mood,
      title_enc: byteaToUint8Array(data.title_enc),
      body_enc: byteaToUint8Array(data.body_enc),
      iv: byteaToUint8Array(data.iv),
      tags_enc: data.tags_enc ? byteaToUint8Array(data.tags_enc) : undefined,
      deleted_at: data.deleted_at
    };
  }

  /**
   * Update an entry
   */
  static async updateEntry(
    entryId: string,
    updates: Partial<EntryCreate>,
    encryptionKey: CryptoKey
  ): Promise<EntryEncrypted> {
    const updateData: any = {};

    if (updates.entry_at !== undefined) updateData.entry_at = updates.entry_at;
    if (updates.mood !== undefined) updateData.mood = updates.mood;

    // If any encrypted fields are being updated, we need to re-encrypt
    if (updates.title || updates.body || updates.tags) {
      const { data: existing } = await supabase
        .from('entries')
        .select('iv')
        .eq('id', entryId)
        .single();

      if (!existing) throw new Error('Entry not found');

      const iv = byteaToUint8Array(existing.iv);

      if (updates.title) {
        const encrypted = await encrypt(updates.title, encryptionKey, iv);
        updateData.title_enc = uint8ArrayToBytea(encrypted.ciphertext);
      }

      if (updates.body) {
        const encrypted = await encrypt(updates.body, encryptionKey, iv);
        updateData.body_enc = uint8ArrayToBytea(encrypted.ciphertext);
      }

      if (updates.tags) {
        const encrypted = await encrypt(JSON.stringify(updates.tags), encryptionKey, iv);
        updateData.tags_enc = uint8ArrayToBytea(encrypted.ciphertext);
      }
    }

    const { data, error } = await supabase
      .from('entries')
      .update(updateData)
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      user_id: data.user_id,
      created_at: data.created_at,
      entry_at: data.entry_at,
      mood: data.mood,
      title_enc: byteaToUint8Array(data.title_enc),
      body_enc: byteaToUint8Array(data.body_enc),
      iv: byteaToUint8Array(data.iv),
      tags_enc: data.tags_enc ? byteaToUint8Array(data.tags_enc) : undefined,
      deleted_at: data.deleted_at
    };
  }

  /**
   * Soft delete an entry
   */
  static async deleteEntry(entryId: string): Promise<void> {
    const { error } = await supabase
      .from('entries')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', entryId);

    if (error) throw error;
  }

  /**
   * Decrypt an entry
   */
  static async decryptEntry(
    encryptedEntry: EntryEncrypted, 
    encryptionKey: CryptoKey
  ): Promise<EntryPlain> {
    const title = await decrypt({ ciphertext: encryptedEntry.title_enc, iv: encryptedEntry.iv }, encryptionKey);
    const body = await decrypt({ ciphertext: encryptedEntry.body_enc, iv: encryptedEntry.iv }, encryptionKey);
    
    let tags: string[] = [];
    if (encryptedEntry.tags_enc) {
      const tagsJson = await decrypt({ ciphertext: encryptedEntry.tags_enc, iv: encryptedEntry.iv }, encryptionKey);
      tags = JSON.parse(tagsJson);
    }

    return {
      id: encryptedEntry.id,
      user_id: encryptedEntry.user_id,
      created_at: encryptedEntry.created_at,
      entry_at: encryptedEntry.entry_at,
      mood: encryptedEntry.mood,
      title,
      body,
      tags,
      deleted_at: encryptedEntry.deleted_at
    };
  }

  /**
   * Decrypt multiple entries
   */
  static async decryptEntries(
    encryptedEntries: EntryEncrypted[],
    encryptionKey: CryptoKey
  ): Promise<EntryPlain[]> {
    return Promise.all(
      encryptedEntries.map(entry => this.decryptEntry(entry, encryptionKey))
    );
  }
}

/**
 * Conversation queries
 */
export class ConversationQueries {
  /**
   * Get all conversations for a user
   */
  static async getConversations(userId: string): Promise<ConversationEncrypted[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(row => ({
      id: row.id,
      user_id: row.user_id,
      created_at: row.created_at,
      title_enc: row.title_enc ? byteaToUint8Array(row.title_enc) : undefined,
      iv: byteaToUint8Array(row.iv)
    }));
  }

  /**
   * Create a new conversation
   */
  static async createConversation(
    userId: string,
    conversation: ConversationCreate,
    encryptionKey: CryptoKey
  ): Promise<ConversationEncrypted> {
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    const insertData: any = {
      user_id: userId,
      iv: uint8ArrayToBytea(iv)
    };

    if (conversation.title) {
      const titleEncrypted = await encrypt(conversation.title, encryptionKey, iv);
      insertData.title_enc = uint8ArrayToBytea(titleEncrypted.ciphertext);
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      user_id: data.user_id,
      created_at: data.created_at,
      title_enc: data.title_enc ? byteaToUint8Array(data.title_enc) : undefined,
      iv: byteaToUint8Array(data.iv)
    };
  }

  /**
   * Decrypt a conversation
   */
  static async decryptConversation(
    encryptedConversation: ConversationEncrypted,
    encryptionKey: CryptoKey
  ): Promise<ConversationPlain> {
    let title: string | undefined;
    
    if (encryptedConversation.title_enc) {
      title = await decrypt(
        { ciphertext: encryptedConversation.title_enc, iv: encryptedConversation.iv }, 
        encryptionKey
      );
    }

    return {
      id: encryptedConversation.id,
      user_id: encryptedConversation.user_id,
      created_at: encryptedConversation.created_at,
      title
    };
  }

  /**
   * Delete a conversation
   */
  static async deleteConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  }
}

/**
 * Message queries
 */
export class MessageQueries {
  /**
   * Get messages for a conversation
   */
  static async getMessages(conversationId: string): Promise<MessageEncrypted[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map(row => ({
      id: row.id,
      conversation_id: row.conversation_id,
      user_id: row.user_id,
      created_at: row.created_at,
      role: row.role as 'user' | 'assistant',
      body_enc: byteaToUint8Array(row.body_enc),
      iv: byteaToUint8Array(row.iv)
    }));
  }

  /**
   * Create a new message
   */
  static async createMessage(
    userId: string,
    message: MessageCreate,
    encryptionKey: CryptoKey
  ): Promise<MessageEncrypted> {
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    const bodyEncrypted = await encrypt(message.body, encryptionKey, iv);

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: message.conversation_id,
        user_id: userId,
        role: message.role,
        body_enc: uint8ArrayToBytea(bodyEncrypted.ciphertext),
        iv: uint8ArrayToBytea(iv)
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      conversation_id: data.conversation_id,
      user_id: data.user_id,
      created_at: data.created_at,
      role: data.role as 'user' | 'assistant',
      body_enc: byteaToUint8Array(data.body_enc),
      iv: byteaToUint8Array(data.iv)
    };
  }

  /**
   * Decrypt a message
   */
  static async decryptMessage(
    encryptedMessage: MessageEncrypted,
    encryptionKey: CryptoKey
  ): Promise<MessagePlain> {
    const body = await decrypt(
      { ciphertext: encryptedMessage.body_enc, iv: encryptedMessage.iv },
      encryptionKey
    );

    return {
      id: encryptedMessage.id,
      conversation_id: encryptedMessage.conversation_id,
      user_id: encryptedMessage.user_id,
      created_at: encryptedMessage.created_at,
      role: encryptedMessage.role,
      body
    };
  }

  /**
   * Decrypt multiple messages
   */
  static async decryptMessages(
    encryptedMessages: MessageEncrypted[],
    encryptionKey: CryptoKey
  ): Promise<MessagePlain[]> {
    return Promise.all(
      encryptedMessages.map(message => this.decryptMessage(message, encryptionKey))
    );
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  }
}
