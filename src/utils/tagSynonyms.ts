/**
 * Maps tag names (lowercase) to arrays of synonym phrases.
 * When searching, if the query matches any synonym, the tag is included.
 */
const TAG_SYNONYMS: Record<string, string[]> = {
  // Behavior
  meltdown: ['tantrum', 'outburst', 'breakdown', 'explosion', 'freakout', 'losing it'],
  calm: ['relaxed', 'peaceful', 'chill', 'settled', 'quiet', 'at ease'],
  aggressive: ['hitting', 'biting', 'kicking', 'violent', 'angry', 'attack', 'push', 'threw'],
  focused: ['concentrating', 'paying attention', 'engaged', 'on task'],
  stim: ['stimming', 'flapping', 'rocking', 'spinning', 'hand flapping', 'fidgeting', 'repetitive'],
  anxious: ['worried', 'nervous', 'scared', 'fearful', 'panicking', 'panic', 'stress', 'tense'],
  shutdown: ['unresponsive', 'withdrawn', 'zoned out', 'checked out', 'non-verbal', 'froze'],
  crying: ['tears', 'sobbing', 'weeping', 'upset', 'cried'],
  eloping: ['ran away', 'running away', 'bolted', 'bolting', 'fled', 'escape', 'wandered off', 'took off'],
  'self-harm': ['hurting self', 'head banging', 'scratching', 'self injury', 'self injurious', 'hitting self', 'biting self'],

  // Food
  'ate well': ['good appetite', 'ate everything', 'finished meal', 'eating well', 'good eating'],
  'refused food': ['not eating', 'won\'t eat', 'skipped meal', 'picky', 'didn\'t eat', 'no appetite'],
  dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'ice cream', 'lactose'],
  sugar: ['candy', 'sweets', 'chocolate', 'dessert', 'juice', 'soda', 'treat'],

  // Medication
  taken: ['took medicine', 'had meds', 'dosed', 'administered', 'gave medicine'],
  missed: ['forgot medicine', 'skipped dose', 'no meds', 'didn\'t take'],
  'side effect': ['reaction', 'adverse', 'side effects', 'drowsy', 'nausea'],

  // Emotion
  happy: ['joyful', 'smiling', 'laughing', 'cheerful', 'glad', 'excited', 'pleased', 'content'],
  irritated: ['annoyed', 'frustrated', 'grumpy', 'cranky', 'agitated', 'moody', 'fussy'],
  tired: ['exhausted', 'sleepy', 'fatigued', 'drowsy', 'worn out', 'low energy', 'lethargic'],
  overwhelmed: ['overstimulated', 'too much', 'can\'t cope', 'sensory overload', 'flooded'],

  // Sleep
  'slept well': ['good sleep', 'rested', 'full night', 'slept through'],
  'poor sleep': ['bad sleep', 'insomnia', 'woke up', 'restless', 'nightmares', 'didn\'t sleep', 'night waking'],
  nap: ['napped', 'daytime sleep', 'rest', 'dozed'],

  // Sensory
  'sensory overload': ['overstimulated', 'too loud', 'too bright', 'sensory', 'overwhelmed', 'covering ears'],
  'sensory seeking': ['seeking input', 'crashing', 'jumping', 'spinning', 'deep pressure', 'proprioceptive'],

  // Transitions
  'good transition': ['smooth transition', 'transitioned well', 'handled change', 'adapted'],
  'difficult transition': ['hard transition', 'struggled with change', 'resisted transition', 'refused to move'],

  // Successes
  'success moment': ['win', 'achievement', 'proud', 'milestone', 'breakthrough', 'good moment', 'progress'],

  // Triggers
  noise: ['loud', 'sound', 'noisy', 'auditory'],
  hunger: ['hungry', 'starving', 'needs food', 'hangry'],
  transition: ['change', 'switching', 'moving on', 'new activity'],
  school: ['class', 'classroom', 'teacher', 'recess', 'homework', 'learning'],
  'screen time': ['tv', 'tablet', 'ipad', 'phone', 'video', 'youtube', 'screen'],
  'social situation': ['social', 'friends', 'people', 'group', 'play date', 'party', 'interaction'],
  'change in routine': ['routine change', 'unexpected', 'different schedule', 'disruption', 'surprise'],
  unknown: ['not sure', 'unclear', 'no idea', 'don\'t know'],
};

/**
 * Check if a tag name matches a search query, using both substring
 * matching on the tag name and synonym lookup.
 */
export function tagMatchesQuery(tagName: string, query: string): boolean {
  const lowerTag = tagName.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) return true;

  // Direct substring match on tag name
  if (lowerTag.includes(lowerQuery)) return true;

  // Check if query matches any synonym for this tag
  const synonyms = TAG_SYNONYMS[lowerTag];
  if (synonyms) {
    for (const synonym of synonyms) {
      if (synonym.includes(lowerQuery) || lowerQuery.includes(synonym)) return true;
    }
  }

  return false;
}
