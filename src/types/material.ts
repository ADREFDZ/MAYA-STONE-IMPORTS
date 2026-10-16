// src/types/material.ts

export interface MaterialRender {
  id: string;
  product_sku: string;
  render_url: string;
  application: string;
  sort_order?: number;
}

export interface Material {
  id: string;
  sku: string;
  name: string;
  aka?: string;
  category: string;
  stone_type?: string;
  type?: string;
  kind?: string;
  origin: string;
  status?: string;
  description?: string;
  image?: string | null;
  formats?: string[];
  finishes?: string[];
  uses?: string[];
  renders?: MaterialRender[];
  colorDescription?: string;
}

export interface CollectionItem {
  id: string;
  slug: string;
  title_es: string;
  title_en?: string;
  subtitle_es?: string;
  subtitle_en?: string;
  description_es?: string;
  description_en?: string;
  cover_image?: string;
  is_active: boolean;
  sort_order: number;
  materials?: Material[];
}
