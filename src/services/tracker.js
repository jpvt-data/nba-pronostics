// src/services/tracker.js
import { supabase } from '../lib/supabase'

/**
 * Enregistre un event utilisateur.
 * @param {string} userId
 * @param {string} eventType  — 'page_view' | 'clic_prono' | 'clic_match' | etc.
 * @param {string} page       — '/accueil' | '/mes-pronos' | etc.
 * @param {object} meta       — données contextuelles libres
 */
export const track = async (userId, eventType, page = '', meta = {}) => {
  if (!userId) return
  try {
    await supabase.from('events').insert({ user_id: userId, event_type: eventType, page, meta })
  } catch (e) {
    // Silencieux — le tracking ne doit jamais bloquer l'UI
  }
}