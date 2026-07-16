import { useState, useEffect, useCallback } from "react";
import { Category } from "../types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/.netlify/functions/categories");
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const addCategory = async (name: string, icon: string, color: string) => {
    const res = await fetch("/.netlify/functions/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, icon, color }),
    });
    const cat = await res.json();
    setCategories(prev => [...prev, cat]);
    return cat;
  };

  const updateCategory = async (cat: Category) => {
    const res = await fetch("/.netlify/functions/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cat),
    });
    const updated = await res.json();
    setCategories(prev => prev.map(c => c._id === updated._id ? updated : c));
    return updated;
  };

  const deleteCategory = async (_id: string) => {
    await fetch("/.netlify/functions/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id }),
    });
    setCategories(prev => prev.filter(c => c._id !== _id));
  };

  const reorderCategories = async (orderedIds: string[]) => {
    await fetch("/.netlify/functions/categories/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    });
    setCategories(prev => {
      const map = new Map(prev.map(c => [c._id, c]));
      return orderedIds.map((id, i) => ({ ...map.get(id)!, order: i }));
    });
  };

  return { categories, loading, addCategory, updateCategory, deleteCategory, reorderCategories };
}
