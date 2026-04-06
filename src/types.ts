export type FileType = 'pdf' | 'image';

export interface SheetMusic {
  id: string;
  title: string;
  coverUrl: string;
  isFavorite: boolean;
  type: FileType;
  pages: string[];
}

export interface Playlist {
  id: string;
  title: string;
  sheetMusicIds: string[];
}

export type AppView = 'library' | 'playlists' | 'playlistDetail' | 'reader' | 'favorites';
