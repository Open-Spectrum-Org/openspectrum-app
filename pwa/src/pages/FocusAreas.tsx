import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FocusAreaSheet } from '../components/FocusAreaSheet';
import { useFocusAreas } from '../hooks/useFocusAreas';
import { useChild } from '../hooks/useChild';
import { getObservationCategoryCountsByDateRange } from '../db/queries/observations';
import { addDays, todayDateString } from '../utils/date';
import { categoryColor } from '../theme/colors';
import type { FocusArea } from '../types/database';

const STATUS_LABEL: Record<FocusArea['status'], string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
};

const STATUS_COLOR: Record<FocusArea['status'], string> = {
  active: '#22C55E',
  paused: '#F59E0B',
  completed: '#9CA3AF',
};

function parseCats(json: string | null): string[] {
  try { return json ? JSON.parse(json) : []; } catch { return []; }
}

function parseQuestions(json: string | null): string[] {
  try { return json ? JSON.parse(json) : []; } catch { return []; }
}

interface FocusAreaCardProps {
  area: FocusArea;
  count: number;
  onEdit: () => void;
  onViewTimeline: () => void;
}

function FocusAreaCard({ area, count, onEdit, onViewTimeline }: FocusAreaCardProps) {
  const categories = parseCats(area.related_categories);
  const questions = parseQuestions(area.questions);
  const statusColor = STATUS_COLOR[area.status];

  return (
    <div className="bg-white rounded-[10px] mx-4 my-2 shadow-sm overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: statusColor }}
              />
              <span className="text-xs font-medium" style={{ color: statusColor }}>
                {STATUS_LABEL[area.status]}
              </span>
            </div>
            <h3 className="text-base font-semibold text-text-primary">{area.title}</h3>
          </div>
          <button
            onClick={onEdit}
            className="text-xs text-primary font-medium px-2 py-1 border border-primary rounded-full flex-shrink-0"
          >
            Edit
          </button>
        </div>

        {/* Description */}
        {area.description && (
          <p className="text-sm text-text-secondary">{area.description}</p>
        )}

        {/* Questions */}
        {questions.length > 0 && (
          <div className="space-y-1">
            {questions.map((q, i) => (
              <p key={i} className="text-xs text-text-muted italic">› {q}</p>
            ))}
          </div>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <span
                key={cat}
                className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
                style={{
                  backgroundColor: `${categoryColor(cat)}22`,
                  color: categoryColor(cat),
                }}
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-text-muted">
            {count} observation{count !== 1 ? 's' : ''} in last 30 days
          </span>
          {categories.length > 0 && (
            <button
              onClick={onViewTimeline}
              className="text-xs text-primary font-medium"
            >
              View in Timeline →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FocusAreas() {
  const navigate = useNavigate();
  const { child } = useChild();
  const { areas, create, update, remove } = useFocusAreas();
  const [showSheet, setShowSheet] = useState(false);
  const [editing, setEditing] = useState<FocusArea | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // Load 30-day category counts once
  useEffect(() => {
    if (!child) return;
    const startDate = addDays(todayDateString(), -29);
    getObservationCategoryCountsByDateRange(child.id, startDate, todayDateString())
      .then(setCategoryCounts);
  }, [child?.id, areas]);

  // Compute per-focus-area observation counts
  const areaCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const area of areas) {
      const cats = parseCats(area.related_categories);
      if (cats.length === 0) {
        map[area.id] = 0;
      } else {
        map[area.id] = cats.reduce((sum, cat) => sum + (categoryCounts[cat] ?? 0), 0);
      }
    }
    return map;
  }, [areas, categoryCounts]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setShowSheet(true);
  }, []);

  const openEdit = useCallback((area: FocusArea) => {
    setEditing(area);
    setShowSheet(true);
  }, []);

  const handleSave = useCallback(
    async (
      title: string,
      description: string | null,
      relatedCategories: string[],
      questions: string[],
      status: FocusArea['status']
    ) => {
      if (editing) {
        await update(editing.id, title, description, relatedCategories, questions, status);
      } else {
        await create(title, description, relatedCategories, questions);
      }
      setShowSheet(false);
      setEditing(null);
    },
    [editing, create, update]
  );

  const handleDelete = useCallback(async () => {
    if (!editing) return;
    await remove(editing.id);
    setShowSheet(false);
    setEditing(null);
  }, [editing, remove]);

  const activeAreas = areas.filter((a) => a.status === 'active');
  const pausedAreas = areas.filter((a) => a.status === 'paused');
  const completedAreas = areas.filter((a) => a.status === 'completed');

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-border">
        <span className="text-lg font-semibold text-text-primary">Focus Areas</span>
        <button
          onClick={openCreate}
          className="w-8 h-8 flex items-center justify-center bg-primary rounded-full"
        >
          <span className="text-white text-xl leading-none">+</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {areas.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-4 px-8 text-center">
            <span className="text-5xl">🎯</span>
            <p className="text-base font-semibold text-text-primary">No focus areas yet</p>
            <p className="text-sm text-text-secondary">
              A focus area tracks an active investigation — something you're trying to understand
              about your child's patterns over time.
            </p>
            <button
              onClick={openCreate}
              className="mt-2 bg-primary text-white px-5 py-2.5 rounded-[10px] text-sm font-semibold"
            >
              Create your first focus area
            </button>
          </div>
        ) : (
          <>
            {activeAreas.length > 0 && (
              <div>
                <div className="px-4 pt-4 pb-1">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Active
                  </span>
                </div>
                {activeAreas.map((area) => (
                  <FocusAreaCard
                    key={area.id}
                    area={area}
                    count={areaCountMap[area.id] ?? 0}
                    onEdit={() => openEdit(area)}
                    onViewTimeline={() =>
                      navigate('/timeline', { state: { focusAreaId: area.id } })
                    }
                  />
                ))}
              </div>
            )}

            {pausedAreas.length > 0 && (
              <div>
                <div className="px-4 pt-4 pb-1">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Paused
                  </span>
                </div>
                {pausedAreas.map((area) => (
                  <FocusAreaCard
                    key={area.id}
                    area={area}
                    count={areaCountMap[area.id] ?? 0}
                    onEdit={() => openEdit(area)}
                    onViewTimeline={() =>
                      navigate('/timeline', { state: { focusAreaId: area.id } })
                    }
                  />
                ))}
              </div>
            )}

            {completedAreas.length > 0 && (
              <div>
                <div className="px-4 pt-4 pb-1">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Completed
                  </span>
                </div>
                {completedAreas.map((area) => (
                  <FocusAreaCard
                    key={area.id}
                    area={area}
                    count={areaCountMap[area.id] ?? 0}
                    onEdit={() => openEdit(area)}
                    onViewTimeline={() =>
                      navigate('/timeline', { state: { focusAreaId: area.id } })
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <FocusAreaSheet
        visible={showSheet}
        existing={editing}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
        onClose={() => {
          setShowSheet(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
