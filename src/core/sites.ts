import data from '../data/sites.json';

export interface SitePhoto {
  file: string;
  nasaId: string;
  title: string;
  credit: string;
  caption: string;
  w: number;
  h: number;
  page: string;
}

export interface Site {
  level: number;
  id: string;
  name: string;
  body: string;
  place: string;
  when: string;
  coords: { text: string; note: string; source: string };
  photo: SitePhoto;
}

const urls = import.meta.glob('../assets/sites/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const SITES = data.sites as Site[];

export const siteFor = (level: number): Site | undefined => SITES.find((s) => s.level === level);

export const photoUrl = (file: string): string => urls[`../assets/sites/${file}`] ?? '';
