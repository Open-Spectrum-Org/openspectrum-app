import { useEffect, useState } from 'react';
import { SYSTEM_TAG_CATEGORIES, type FocusArea } from '../types/database';
import { categoryColor } from '../theme/colors';

interface FocusAreaSheetProps {
  visible: boolean;
  existing?: FocusArea | null;
  onSave: (
    title: string,
    description: string | null,
    relatedCategories: string[],
    questions: string[],
    status: FocusArea['status']
  ) => void;
  onDelete?: () => void;
  onClose: () => void;
}

function parseCats(json: string | null): string[] {
  try { return json ? JSON.parse(json) : []; } catch { return []; }
}

function parseQuestions(json: string | null): string[] {
  try {
    const parsed = json ? JSON.parse(json) : [];
    return parsed.length > 0 ? parsed : [''];
  } catch { return ['']; }
}

export function FocusAreaSheet({
  visible,
  existing,
  onSave,
  onDelete,
  onClose,
}: FocusAreaSheetProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [questions, setQuestions] = useState<string[]>(['']);
  const [status, setStatus] = useState<FocusArea['status']>('active');

  useEffect(() => {
    if (!visible) return;
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description ?? '');
      setStatus(existing.status);
      setSelectedCategories(new Set(parseCats(existing.related_categories)));
      setQuestions(parseQuestions(existing.questions));
    } else {
      setTitle('');
      setDescription('');
      setSelectedCategories(new Set());
      setQuestions(['']);
      setStatus('active');
    }
  }, [existing, visible]);

  if (!visible) return null;

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const updateQuestion = (i: number, val: string) =>
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? val : q)));

  const removeQuestion = (i: number) =>
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave(
      trimmed,
      description.trim() || null,
      [...selectedCategories],
      questions.map((q) => q.trim()).filter(Boolean),
      status
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <div className="bg-white rounded-t-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button onClick={onClose} className="text-sm text-text-secondary w-14">
            Cancel
          </button>
          <span className="text-sm font-semibold text-text-primary">
            {existing ? 'Edit Focus Area' : 'New Focus Area'}
          </span>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="text-sm font-semibold text-primary disabled:opacity-30 w-14 text-right"
          >
            Save
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-8">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Difficult mornings"
              className="mt-1 w-full border border-border rounded-[10px] px-3 py-2 text-base text-text-primary outline-none focus:border-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              What are you trying to understand?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional — describe your investigation"
              rows={2}
              className="mt-1 w-full border border-border rounded-[10px] px-3 py-2 text-sm text-text-primary outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Categories */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Relevant categories
            </label>
            <p className="text-xs text-text-muted mt-0.5 mb-2">
              Observations in these categories will be associated with this focus area.
            </p>
            <div className="flex flex-wrap gap-2">
              {SYSTEM_TAG_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.has(cat);
                const color = categoryColor(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className="px-3 py-1 rounded-full text-sm font-medium border capitalize transition-colors"
                    style={{
                      borderColor: color,
                      backgroundColor: isSelected ? color : 'transparent',
                      color: isSelected ? 'white' : color,
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Questions */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Questions to investigate
            </label>
            <div className="mt-2 space-y-2">
              {questions.map((q, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => updateQuestion(i, e.target.value)}
                    placeholder={`Question ${i + 1}`}
                    className="flex-1 border border-border rounded-[10px] px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                  />
                  {questions.length > 1 && (
                    <button
                      onClick={() => removeQuestion(i)}
                      className="w-7 h-7 flex items-center justify-center text-text-muted flex-shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {questions.length < 5 && (
                <button
                  onClick={() => setQuestions((prev) => [...prev, ''])}
                  className="text-sm text-primary font-medium"
                >
                  + Add question
                </button>
              )}
            </div>
          </div>

          {/* Status (edit mode only) */}
          {existing && (
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Status
              </label>
              <div className="mt-2 flex gap-2">
                {(['active', 'paused', 'completed'] as FocusArea['status'][]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border capitalize transition-colors ${
                      status === s
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-text-secondary'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Delete */}
          {existing && onDelete && (
            <div className="pt-2">
              <button
                onClick={onDelete}
                className="w-full py-2 text-sm font-medium text-danger border border-danger rounded-[10px]"
              >
                Delete focus area
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
