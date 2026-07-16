import React, { useState, useRef } from "react";
import {
  X, Plus, Trash2, GripVertical, ChevronUp, ChevronDown,
  Check, Palette
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { iconMap, iconNames } from "../lib/iconMap";
import { Category } from "../types";

const colorOptions = [
  { name: 'red', bg: 'bg-red-100', text: 'text-red-600', ring: 'ring-red-300' },
  { name: 'amber', bg: 'bg-amber-100', text: 'text-amber-600', ring: 'ring-amber-300' },
  { name: 'blue', bg: 'bg-blue-100', text: 'text-blue-600', ring: 'ring-blue-300' },
  { name: 'teal', bg: 'bg-teal-100', text: 'text-teal-600', ring: 'ring-teal-300' },
  { name: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-600', ring: 'ring-emerald-300' },
  { name: 'slate', bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-300' },
  { name: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-600', ring: 'ring-indigo-300' },
  { name: 'rose', bg: 'bg-rose-100', text: 'text-rose-600', ring: 'ring-rose-300' },
  { name: 'purple', bg: 'bg-purple-100', text: 'text-purple-600', ring: 'ring-purple-300' },
  { name: 'orange', bg: 'bg-orange-100', text: 'text-orange-600', ring: 'ring-orange-300' },
];

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAdd: (name: string, icon: string, color: string) => void;
  onUpdate: (cat: Category) => void;
  onDelete: (id: string) => void;
  onReorder: (ids: string[]) => void;
}

export default function CategoryManager({
  isOpen, onClose, categories, onAdd, onUpdate, onDelete, onReorder
}: CategoryManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("Tag");
  const [newColor, setNewColor] = useState("slate");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const sorted = [...categories].sort((a, b) => a.order - b.order);

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim(), newIcon, newColor);
    setNewName("");
    setNewIcon("Tag");
    setNewColor("slate");
    setShowAddForm(false);
  };

  const handleDelete = (_id: string, name: string) => {
    if (confirm(`Xóa danh mục "${name}"?`)) {
      onDelete(_id);
    }
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const ids = sorted.map(c => c._id);
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    onReorder(ids);
  };

  const moveDown = (idx: number) => {
    if (idx === sorted.length - 1) return;
    const ids = sorted.map(c => c._id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    onReorder(ids);
  };

  const handleDragStart = (idx: number) => { setDragIdx(idx); };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const ids = sorted.map(c => c._id);
    const [moved] = ids.splice(dragIdx, 1);
    ids.splice(idx, 0, moved);
    onReorder(ids);
    setDragIdx(idx);
  };
  const handleDragEnd = () => { setDragIdx(null); };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md cursor-pointer"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="relative w-full max-w-md bg-white rounded-t-[32px] shadow-xl p-6 max-h-[90vh] overflow-y-auto z-10"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-slate-900 rounded-full" />
                <h2 className="text-base font-bold text-slate-800">Quản lý danh mục</h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {showAddForm ? (
              <div className="space-y-4">
                {/* Icon grid */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Chọn biểu tượng
                  </label>
                  <div className="grid grid-cols-7 gap-1.5 max-h-40 overflow-y-auto p-1">
                    {iconNames.map(iconName => {
                      const Icon = iconMap[iconName];
                      const isSelected = newIcon === iconName;
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setNewIcon(iconName)}
                          className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white ring-2 ring-slate-900 scale-110'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-500'
                          }`}
                          title={iconName}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color picker */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Màu sắc
                  </label>
                  <div className="flex gap-2">
                    {colorOptions.map(c => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setNewColor(c.name)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${c.bg} ${
                          newColor === c.name ? `ring-2 ring-offset-2 ${c.ring}` : ''
                        }`}
                      >
                        {newColor === c.name && <Check className={`w-4 h-4 ${c.text}`} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name input */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Tên danh mục
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="VD: Ăn uống"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[16px] text-[16px] focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-3 rounded-[20px] text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 cursor-pointer transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!newName.trim()}
                    className="flex-1 py-3 rounded-[20px] text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 cursor-pointer transition-all"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full py-3 mb-4 rounded-[20px] text-xs font-bold bg-slate-50 border border-dashed border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm danh mục mới</span>
                </button>

                <div ref={listRef} className="space-y-1">
                  {sorted.map((cat, idx) => {
                    const Icon = iconMap[cat.icon] || iconMap.Tag;
                    const color = colorOptions.find(c => c.name === cat.color) || colorOptions[5];
                    return (
                      <div
                        key={cat._id}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-2 p-3 rounded-[16px] transition-all ${
                          dragIdx === idx ? 'opacity-50 bg-slate-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className={`w-9 h-9 rounded-xl ${color.bg} ${color.text} flex items-center justify-center shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="flex-1 text-xs font-bold text-slate-700">{cat.name}</span>
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => moveUp(idx)} disabled={idx === 0} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 disabled:opacity-20 cursor-pointer">
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => moveDown(idx)} disabled={idx === sorted.length - 1} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 disabled:opacity-20 cursor-pointer">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button onClick={() => handleDelete(cat._id, cat.name)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 cursor-pointer transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
