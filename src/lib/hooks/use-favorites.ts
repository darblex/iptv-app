"use client";

import { useEffect, useState } from "react";
import type { StreamType } from "@/types/content";

export interface FavoriteItem {
  id: number;
  type: StreamType;
  name: string;
  poster?: string | null;
}

const STORAGE_KEY = "iptv-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFavorites(JSON.parse(stored));
    } catch (error) {
      console.error("לא ניתן לקרוא מועדפים", error);
    }
  }, []);

  const save = (data: FavoriteItem[]) => {
    setFavorites(data);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("לא ניתן לשמור מועדפים", error);
    }
  };

  const toggleFavorite = (item: FavoriteItem) => {
    const exists = favorites.some((fav) => fav.id === item.id && fav.type === item.type);
    const updated = exists
      ? favorites.filter((fav) => !(fav.id === item.id && fav.type === item.type))
      : [...favorites, item];
    save(updated);
  };

  const isFavorite = (id: number, type: StreamType) =>
    favorites.some((fav) => fav.id === id && fav.type === type);

  return { favorites, toggleFavorite, isFavorite };
}
