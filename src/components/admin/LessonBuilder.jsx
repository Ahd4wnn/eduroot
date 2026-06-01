import React, { useState } from 'react'
import { GripVertical, ChevronDown, ChevronUp, Trash2, PlusCircle, Plus } from 'lucide-react'
import VideoUrlInput from './VideoUrlInput'

export function LessonBuilder({ 
  modules = [], 
  onModulesChange, 
  onModuleDelete, 
  onLessonDelete 
}) {
  const [expandedModules, setExpandedModules] = useState({})

  // Toggle module expansion
  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: prev[moduleId] === false ? true : false // default to expanded (true) if undefined
    }))
  };

  const isModuleExpanded = (moduleId) => {
    return expandedModules[moduleId] !== false; // expanded by default
  };

  // Add a new module
  const addModule = () => {
    const tempId = `temp-module-${Date.now()}`
    const newModule = {
      id: tempId,
      title: '',
      order_index: modules.length,
      isNew: true,
      lessons: []
    }
    const updated = [...modules, newModule]
    onModulesChange(updated)
    setExpandedModules(prev => ({ ...prev, [tempId]: true })) // expand new module
  }

  // Remove a module
  const removeModule = (moduleId, e) => {
    e.stopPropagation()
    const module = modules.find(m => m.id === moduleId)
    if (!module) return

    if (module.lessons && module.lessons.length > 0) {
      if (!window.confirm('Deleting this module will remove all its lessons. Are you sure?')) {
        return
      }
    }

    // If it's a persisted module, track its deletion
    if (!module.isNew && onModuleDelete) {
      onModuleDelete(module.id)
      // Also track deletion of all its existing lessons
      if (module.lessons) {
        module.lessons.forEach(l => {
          if (!l.isNew && onLessonDelete) {
            onLessonDelete(l.id)
          }
        })
      }
    }

    const updated = modules.filter(m => m.id !== moduleId).map((m, idx) => ({
      ...m,
      order_index: idx
    }))
    onModulesChange(updated)
  }

  // Update module title
  const updateModuleTitle = (moduleId, title) => {
    const updated = modules.map(m => {
      if (m.id === moduleId) {
        return { ...m, title }
      }
      return m
    })
    onModulesChange(updated)
  }

  // Add a lesson to a module
  const addLesson = (moduleId) => {
    const updated = modules.map(m => {
      if (m.id === moduleId) {
        const tempId = `temp-lesson-${Date.now()}`
        const newLesson = {
          id: tempId,
          title: '',
          video_url: '',
          duration_mins: 0,
          is_preview: false,
          order_index: m.lessons.length,
          isNew: true
        }
        return {
          ...m,
          lessons: [...m.lessons, newLesson]
        }
      }
      return m
    })
    onModulesChange(updated)
  }

  // Remove a lesson
  const removeLesson = (moduleId, lessonId) => {
    const updated = modules.map(m => {
      if (m.id === moduleId) {
        const lesson = m.lessons.find(l => l.id === lessonId)
        if (lesson && !lesson.isNew && onLessonDelete) {
          onLessonDelete(lesson.id)
        }
        return {
          ...m,
          lessons: m.lessons.filter(l => l.id !== lessonId).map((l, idx) => ({
            ...l,
            order_index: idx
          }))
        }
      }
      return m
    })
    onModulesChange(updated)
  }

  // Update lesson fields
  const updateLessonField = (moduleId, lessonId, field, val) => {
    const updated = modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map(l => {
            if (l.id === lessonId) {
              return { ...l, [field]: val }
            }
            return l
          })
        }
      }
      return m
    })
    onModulesChange(updated)
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Modules list */}
      <div className="flex flex-col gap-3">
        {modules.map((module) => {
          const expanded = isModuleExpanded(module.id)
          const lessons = module.lessons || []

          return (
            <div 
              key={module.id} 
              className="bg-[#F8F6F2] rounded-xl border border-gray-200 overflow-hidden text-left"
            >
              {/* Module Header */}
              <div 
                onClick={() => toggleModule(module.id)}
                className="px-4 py-3 flex items-center gap-3 bg-white border-b border-gray-100 cursor-pointer hover:bg-gray-50/80 transition-colors select-none"
              >
                <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0 cursor-grab" />
                {expanded ? (
                  <ChevronUp className="w-4 h-4 text-[#0F3D2E] flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#0F3D2E] flex-shrink-0" />
                )}
                
                <input
                  type="text"
                  value={module.title}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateModuleTitle(module.id, e.target.value)}
                  placeholder="Module title..."
                  className="border-none bg-transparent font-semibold text-sm text-[#111111] focus:outline-none focus:bg-gray-50 rounded px-1.5 py-0.5 flex-1 min-w-0"
                />

                <span className="text-xs text-[#5F6368] font-medium whitespace-nowrap ml-2">
                  ({lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'})
                </span>

                <button
                  type="button"
                  onClick={(e) => removeModule(module.id, e)}
                  className="p-1 text-gray-300 hover:text-red-500 transition-colors ml-2"
                  title="Delete Module"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Lessons List container (collapsible) */}
              {expanded && (
                <div className="flex flex-col">
                  {lessons.map((lesson) => (
                    <div 
                      key={lesson.id}
                      className="flex flex-wrap md:flex-nowrap items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 bg-white/40 hover:bg-white/60 transition-colors"
                    >
                      <GripVertical className="w-3.5 h-3.5 text-gray-200 flex-shrink-0 cursor-grab" />
                      
                      {/* Lesson title input */}
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) => updateLessonField(module.id, lesson.id, 'title', e.target.value)}
                        placeholder="Lesson title..."
                        className="border-none bg-transparent text-sm text-[#111111] focus:outline-none focus:bg-gray-50 rounded px-1.5 py-0.5 flex-1 min-w-[150px]"
                      />

                      {/* Video URL Input */}
                      <VideoUrlInput
                        value={lesson.video_url || ''}
                        onChange={(val) => updateLessonField(module.id, lesson.id, 'video_url', val)}
                        compact
                      />

                      {/* Duration Input */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={lesson.duration_mins || ''}
                          onChange={(e) => updateLessonField(module.id, lesson.id, 'duration_mins', parseInt(e.target.value) || 0)}
                          placeholder="min"
                          className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center font-medium focus:outline-none focus:border-[#0F3D2E] focus:ring-2 focus:ring-[#0F3D2E]/10 transition-all"
                        />
                        <span className="text-xs text-gray-400 font-medium">min</span>
                      </div>

                      {/* Preview toggle badge */}
                      <button
                        type="button"
                        onClick={() => updateLessonField(module.id, lesson.id, 'is_preview', !lesson.is_preview)}
                        className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all duration-150 flex-shrink-0 ${
                          lesson.is_preview
                            ? 'bg-[#C8A96B]/15 text-[#C8A96B] border-[#C8A96B]/30 hover:bg-[#C8A96B]/25'
                            : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        Preview
                      </button>

                      {/* Delete lesson */}
                      <button
                        type="button"
                        onClick={() => removeLesson(module.id, lesson.id)}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors ml-auto"
                        title="Delete Lesson"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add Lesson row */}
                  <div 
                    onClick={() => addLesson(module.id)}
                    className="px-4 py-2.5 flex items-center gap-2 text-xs text-[#5F6368] hover:text-[#0F3D2E] cursor-pointer transition-colors bg-white/20 select-none hover:bg-white/40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="font-semibold">Add Lesson</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Module button */}
      <button
        type="button"
        onClick={addModule}
        className="border-2 border-dashed border-gray-200 rounded-xl py-3.5 w-full flex items-center justify-center gap-2 text-sm font-semibold text-[#5F6368] hover:border-[#0F3D2E] hover:text-[#0F3D2E] bg-white/20 hover:bg-white/50 transition-all duration-200"
      >
        <PlusCircle className="w-4 h-4" />
        <span>Add Module</span>
      </button>
    </div>
  )
}

export default LessonBuilder
