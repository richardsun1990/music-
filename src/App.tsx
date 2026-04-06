/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  X,
  Settings,
  Library,
  ListMusic,
  SkipForward,
  SkipBack,
  FileText,
  Image as ImageIcon,
  ArrowLeft,
  Upload,
  Trash2,
  Edit3,
  Check,
  LayoutGrid,
  List,
  GripVertical,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SheetMusic, Playlist, AppView, FileType } from './types';

// --- 初始示例数据 ---
const INITIAL_SCORES: SheetMusic[] = [
  {
    id: '1',
    title: '月光奏鸣曲 (示例)',
    coverUrl: 'https://picsum.photos/seed/piano1/400/600',
    isFavorite: true,
    type: 'pdf',
    pages: [
      'https://picsum.photos/seed/p1/800/1200',
      'https://picsum.photos/seed/p2/800/1200',
    ]
  },
  {
    id: '2',
    title: '奇异恩典 (示例)',
    coverUrl: 'https://picsum.photos/seed/hymn1/400/600',
    isFavorite: false,
    type: 'image',
    pages: [
      'https://picsum.photos/seed/p4/800/1200',
    ]
  }
];

export default function App() {
  // --- 状态管理 ---
  const [view, setView] = useState<AppView>('library');
  const [libraryViewMode, setLibraryViewMode] = useState<'grid' | 'list'>('grid');
  const [isManageMode, setIsManageMode] = useState(false);

  const [scores, setScores] = useState<SheetMusic[]>(INITIAL_SCORES);
  const [playlists, setPlaylists] = useState<Playlist[]>([
    { id: 'pl1', title: '周日演出曲目', sheetMusicIds: ['1'] }
  ]);
  
  const [currentScore, setCurrentScore] = useState<SheetMusic | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2); 
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState<string | null>(null);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [draggedScoreIndex, setDraggedScoreIndex] = useState<number | null>(null);
  const [draggedPlaylistSongIndex, setDraggedPlaylistSongIndex] = useState<number | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; message: string; onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => {} });

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 自动滚动逻辑 ---
  useEffect(() => {
    let interval: number;
    if (isAutoScrolling && view === 'reader') {
      interval = window.setInterval(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop += scrollSpeed;
        }
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isAutoScrolling, scrollSpeed, view]);

  // --- 核心操作 ---
  const openReader = (score: SheetMusic, playlist: Playlist | null = null) => {
    if (isManageMode) return;
    setCurrentScore(score);
    setCurrentPlaylist(playlist);
    setCurrentPage(0);
    setIsAutoScrolling(false);
    setView('reader');
  };

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScores(prev => prev.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s));
    if (currentScore?.id === id) {
      setCurrentScore(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newScores: SheetMusic[] = [];

    Array.from(files).forEach((file: File) => {
      const isPDF = file.type === 'application/pdf';
      const fileUrl = URL.createObjectURL(file);
      
      const newScore: SheetMusic = {
        id: Math.random().toString(36).substr(2, 9),
        title: file.name.replace(/\.[^/.]+$/, ""),
        coverUrl: isPDF ? 'https://picsum.photos/seed/pdf/400/600' : fileUrl,
        isFavorite: false,
        type: isPDF ? 'pdf' : 'image',
        pages: [fileUrl]
      };
      newScores.push(newScore);
    });

    setScores(prev => [...newScores, ...prev]);
    setShowImportModal(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('导入成功！');
  };

  // --- 乐谱管理 ---
  const handleDeleteScore = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      message: "确定要删除这本乐谱吗？",
      onConfirm: () => {
        setScores(prev => prev.filter(s => s.id !== id));
        setPlaylists(prev => prev.map(p => ({
          ...p,
          sheetMusicIds: p.sheetMusicIds.filter(sid => sid !== id)
        })));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const startEditing = (score: SheetMusic, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingScoreId(score.id);
    setNewTitle(score.title);
  };

  const saveTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingScoreId && newTitle.trim() !== "") {
      setScores(prev => prev.map(s => s.id === editingScoreId ? { ...s, title: newTitle } : s));
      setEditingScoreId(null);
    }
  };

  const handleDropScore = (index: number) => {
    if (draggedScoreIndex === null || draggedScoreIndex === index) return;
    const newScores = [...scores];
    const [draggedItem] = newScores.splice(draggedScoreIndex, 1);
    newScores.splice(index, 0, draggedItem);
    setScores(newScores);
    setDraggedScoreIndex(null);
  };

  // --- 歌单管理 ---
  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim() === '') return;
    const newPlaylist: Playlist = {
      id: Math.random().toString(36).substr(2, 9),
      title: newPlaylistName,
      sheetMusicIds: []
    };
    setPlaylists(prev => [...prev, newPlaylist]);
    setNewPlaylistName('');
    setShowCreatePlaylistModal(false);
    showToast('歌单创建成功！');
  };

  const handleDeletePlaylist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      message: "确定要删除这个歌单吗？",
      onConfirm: () => {
        setPlaylists(prev => prev.filter(p => p.id !== id));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAddToPlaylist = (playlistId: string) => {
    if (!showAddToPlaylistModal) return;
    setPlaylists(prev => prev.map(pl => 
      pl.id === playlistId && !pl.sheetMusicIds.includes(showAddToPlaylistModal)
        ? { ...pl, sheetMusicIds: [...pl.sheetMusicIds, showAddToPlaylistModal] } 
        : pl
    ));
    setShowAddToPlaylistModal(null);
    showToast('已成功加入歌单！');
  };

  const handleRemoveFromPlaylist = (scoreId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPlaylist) return;
    const updatedPlaylist = {
      ...currentPlaylist,
      sheetMusicIds: currentPlaylist.sheetMusicIds.filter(id => id !== scoreId)
    };
    setCurrentPlaylist(updatedPlaylist);
    setPlaylists(prev => prev.map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p));
  };

  const handleDragStartPlaylistSong = (index: number) => {
    setDraggedPlaylistSongIndex(index);
  };

  const handleDropPlaylistSong = (index: number) => {
    if (draggedPlaylistSongIndex === null || draggedPlaylistSongIndex === index || !currentPlaylist) return;
    const newIds = [...currentPlaylist.sheetMusicIds];
    const [draggedItem] = newIds.splice(draggedPlaylistSongIndex, 1);
    newIds.splice(index, 0, draggedItem);
    
    const updatedPlaylist = { ...currentPlaylist, sheetMusicIds: newIds };
    setCurrentPlaylist(updatedPlaylist);
    setPlaylists(prev => prev.map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p));
    setDraggedPlaylistSongIndex(null);
  };

  const nextSong = () => {
    if (!currentPlaylist || !currentScore) return;
    const idx = currentPlaylist.sheetMusicIds.indexOf(currentScore.id);
    if (idx < currentPlaylist.sheetMusicIds.length - 1) {
      const nextId = currentPlaylist.sheetMusicIds[idx + 1];
      const nextScore = scores.find(s => s.id === nextId);
      if (nextScore) openReader(nextScore, currentPlaylist);
    }
  };

  const prevSong = () => {
    if (!currentPlaylist || !currentScore) return;
    const idx = currentPlaylist.sheetMusicIds.indexOf(currentScore.id);
    if (idx > 0) {
      const prevId = currentPlaylist.sheetMusicIds[idx - 1];
      const prevScore = scores.find(s => s.id === prevId);
      if (prevScore) openReader(prevScore, currentPlaylist);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // --- UI 组件 ---
  const Header = ({ title, showBack = false, onBack = () => {}, rightElement }: { title: string, showBack?: boolean, onBack?: () => void, rightElement?: React.ReactNode }) => (
    <div className="h-24 bg-white border-b-4 border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {showBack && (
          <button 
            onClick={onBack}
            className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-2xl active:bg-gray-200"
          >
            <ArrowLeft size={40} />
          </button>
        )}
        <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {rightElement}
        <button onClick={() => setShowSettingsModal(true)} className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-2xl active:bg-gray-200">
          <Settings size={36} className="text-gray-600" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans select-none flex flex-col">
      
      {/* 隐藏的文件上传控件 */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*,application/pdf"
        multiple
        onChange={handleFileUpload}
      />

      {/* 提示 Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 bg-green-500 text-white px-8 py-4 rounded-full shadow-2xl text-2xl font-bold z-[100] flex items-center gap-3"
          >
            <CheckCircle2 size={32} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          
          {/* 乐谱库/收藏 视图 */}
          {(view === 'library' || view === 'favorites') && (
            <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Header 
                title={view === 'library' ? "我的乐谱库" : "我的收藏"} 
                rightElement={
                  <div className="flex items-center gap-4">
                    <div className="flex bg-gray-100 rounded-2xl p-1">
                      <button 
                        onClick={() => setLibraryViewMode('grid')}
                        className={`w-14 h-14 flex items-center justify-center rounded-xl transition-colors ${libraryViewMode === 'grid' ? 'bg-white shadow' : 'text-gray-400'}`}
                      >
                        <LayoutGrid size={32} />
                      </button>
                      <button 
                        onClick={() => setLibraryViewMode('list')}
                        className={`w-14 h-14 flex items-center justify-center rounded-xl transition-colors ${libraryViewMode === 'list' ? 'bg-white shadow' : 'text-gray-400'}`}
                      >
                        <List size={32} />
                      </button>
                    </div>
                    {view === 'library' && (
                      <button 
                        onClick={() => setIsManageMode(!isManageMode)}
                        className={`px-6 py-2 rounded-xl text-xl font-bold transition-colors ${isManageMode ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {isManageMode ? '完成管理' : '管理乐谱'}
                      </button>
                    )}
                  </div>
                }
              />
              <div className={`p-8 pb-32 ${libraryViewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'flex flex-col gap-4'}`}>
                {scores.filter(s => view === 'library' || s.isFavorite).length === 0 ? (
                  <div className="col-span-full py-20 text-center text-gray-400">
                    <p className="text-2xl">{view === 'library' ? '乐谱库为空，请点击右下角导入' : '暂无收藏的乐谱'}</p>
                  </div>
                ) : (
                  scores.filter(s => view === 'library' || s.isFavorite).map((score, index) => (
                    <div 
                      key={score.id} 
                      draggable={isManageMode}
                      onDragStart={() => setDraggedScoreIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDropScore(index)}
                      className={`bg-white rounded-[32px] overflow-hidden shadow-xl border-4 transition-all ${isManageMode ? 'border-blue-200 cursor-move' : editingScoreId === score.id ? 'border-blue-500' : 'border-transparent active:border-blue-500'} ${libraryViewMode === 'list' ? 'flex items-center p-4' : ''}`}
                      onClick={() => openReader(score)}
                    >
                    {isManageMode && libraryViewMode === 'list' && (
                      <GripVertical size={40} className="text-gray-300 mr-4" />
                    )}
                    <div className={`relative ${libraryViewMode === 'list' ? 'w-32 h-32 rounded-2xl overflow-hidden shrink-0' : 'aspect-[3/4]'}`}>
                      <img src={score.coverUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      {!isManageMode && libraryViewMode === 'grid' && (
                        <button 
                          onClick={(e) => toggleFavorite(score.id, e)}
                          className="absolute top-4 right-4 w-16 h-16 bg-white/90 rounded-full shadow-lg flex items-center justify-center"
                        >
                          <Star size={40} className={score.isFavorite ? "text-yellow-500 fill-yellow-500" : "text-gray-300"} />
                        </button>
                      )}
                      {isManageMode && libraryViewMode === 'grid' && (
                        <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center gap-4">
                          <button 
                            onClick={(e) => handleDeleteScore(score.id, e)}
                            className="w-20 h-20 bg-red-500 text-white rounded-full shadow-xl flex items-center justify-center active:bg-red-600"
                          >
                            <Trash2 size={40} />
                          </button>
                          <button 
                            onClick={(e) => startEditing(score, e)}
                            className="w-20 h-20 bg-blue-500 text-white rounded-full shadow-xl flex items-center justify-center active:bg-blue-600"
                          >
                            <Edit3 size={40} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className={`p-6 flex-1 ${libraryViewMode === 'list' ? 'flex items-center justify-between' : ''}`}>
                      {editingScoreId === score.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <input 
                            autoFocus
                            className="flex-1 text-2xl font-bold border-b-4 border-blue-500 outline-none p-2"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button 
                            onClick={saveTitle}
                            className="p-3 bg-green-500 text-white rounded-xl"
                          >
                            <Check size={32} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-4">
                            {!isManageMode && libraryViewMode === 'list' && (
                              <button onClick={(e) => toggleFavorite(score.id, e)}>
                                <Star size={40} className={score.isFavorite ? "text-yellow-500 fill-yellow-500" : "text-gray-300"} />
                              </button>
                            )}
                            <h2 className="text-3xl font-bold truncate">{score.title}</h2>
                          </div>
                          
                          {!isManageMode && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setShowAddToPlaylistModal(score.id); }}
                              className={`${libraryViewMode === 'grid' ? 'mt-4 w-full' : 'w-48'} py-4 bg-blue-50 text-blue-600 rounded-2xl text-xl font-bold active:bg-blue-100 flex items-center justify-center gap-2`}
                            >
                              <Plus size={24} /> 加入歌单
                            </button>
                          )}

                          {isManageMode && libraryViewMode === 'list' && (
                            <div className="flex gap-4">
                              <button 
                                onClick={(e) => startEditing(score, e)}
                                className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center active:bg-blue-200"
                              >
                                <Edit3 size={32} />
                              </button>
                              <button 
                                onClick={(e) => handleDeleteScore(score.id, e)}
                                className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center active:bg-red-200"
                              >
                                <Trash2 size={32} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )))}
              </div>
            </motion.div>
          )}

          {/* 歌单视图 */}
          {view === 'playlists' && (
            <motion.div key="playlists" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Header title="我的歌单" />
              <div className="p-8 flex flex-col gap-6">
                <button 
                  onClick={() => setShowCreatePlaylistModal(true)} 
                  className="w-full p-8 bg-green-500 text-white rounded-[32px] text-3xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-4"
                >
                  <Plus size={48} strokeWidth={3} /> 创建新歌单
                </button>
                {playlists.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => { setCurrentPlaylist(p); setView('playlistDetail'); }}
                    className="bg-white p-8 rounded-[32px] shadow-md flex items-center justify-between border-4 border-transparent active:border-blue-500"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                        <ListMusic size={48} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold">{p.title}</h2>
                        <p className="text-xl text-gray-400">{p.sheetMusicIds.length} 首乐谱</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={(e) => handleDeletePlaylist(p.id, e)}
                        className="p-4 text-red-400 active:text-red-600"
                      >
                        <Trash2 size={36} />
                      </button>
                      <ChevronRight size={48} className="text-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 歌单详情视图 */}
          {view === 'playlistDetail' && currentPlaylist && (
            <motion.div key="pdetail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Header title={currentPlaylist.title} showBack onBack={() => setView('playlists')} />
              <div className="p-8 flex flex-col gap-4">
                {currentPlaylist.sheetMusicIds.length === 0 ? (
                  <div className="py-20 text-center text-gray-400">
                    <p className="text-2xl">歌单里还没有乐谱</p>
                    <button 
                      onClick={() => setView('library')}
                      className="mt-6 px-8 py-4 bg-blue-500 text-white rounded-2xl text-xl font-bold"
                    >
                      去乐谱库添加
                    </button>
                  </div>
                ) : (
                  currentPlaylist.sheetMusicIds.map((sid, index) => {
                    const score = scores.find(s => s.id === sid);
                    if (!score) return null;
                    return (
                      <div 
                        key={sid}
                        draggable
                        onDragStart={() => handleDragStartPlaylistSong(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDropPlaylistSong(index)}
                        onClick={() => openReader(score, currentPlaylist)}
                        className="bg-white p-6 rounded-3xl shadow flex items-center gap-6 active:bg-gray-50 cursor-move"
                      >
                        <GripVertical size={32} className="text-gray-300" />
                        <span className="text-4xl font-black text-gray-200 w-12">{index + 1}</span>
                        <img src={score.coverUrl} className="w-20 h-20 rounded-xl object-cover" />
                        <h2 className="text-2xl font-bold flex-1">{score.title}</h2>
                        <button 
                          onClick={(e) => handleRemoveFromPlaylist(sid, e)}
                          className="p-4 text-red-400 active:text-red-600 bg-red-50 rounded-2xl"
                        >
                          <Trash2 size={32} />
                        </button>
                        <Play size={40} className="text-blue-500 ml-4" />
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* 阅读器视图 (全屏) */}
          {view === 'reader' && currentScore && (
            <motion.div key="reader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-white z-50 flex flex-col">
              {/* 阅读器顶部栏 */}
              <div className="h-20 bg-gray-50 border-b-2 border-gray-200 flex items-center justify-between px-8">
                <button 
                  onClick={() => setView(currentPlaylist ? 'playlistDetail' : 'library')}
                  className="px-6 py-2 bg-white border-2 border-gray-300 rounded-xl text-xl font-bold active:bg-gray-100"
                >
                  退出阅读
                </button>
                <h2 className="text-2xl font-bold truncate max-w-[50%]">{currentScore.title}</h2>
                <button onClick={() => toggleFavorite(currentScore.id)}>
                  <Star size={36} className={currentScore.isFavorite ? "text-yellow-500 fill-yellow-500" : "text-gray-300"} />
                </button>
              </div>

              {/* 乐谱内容 */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 bg-gray-200 flex justify-center scroll-smooth"
              >
                <div className="max-w-4xl w-full bg-white shadow-2xl">
                  {currentScore.type === 'pdf' ? (
                    <div className="flex flex-col items-center justify-center p-20 text-gray-400">
                      <FileText size={100} className="mb-4" />
                      <p className="text-2xl">PDF 预览 (请在真实 iPad 上查看)</p>
                      <p className="mt-2 text-lg">由于浏览器限制，PDF 将以文件形式加载</p>
                      <iframe src={currentScore.pages[currentPage]} className="w-full h-[800px] mt-10 border-none" />
                    </div>
                  ) : (
                    <img 
                      src={currentScore.pages[currentPage]} 
                      className="w-full" 
                      referrerPolicy="no-referrer" 
                    />
                  )}
                </div>
              </div>

              {/* 阅读器控制栏 (超大按钮) */}
              <div className="bg-white border-t-4 border-gray-100 p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between px-4">
                  {/* 翻页控制 */}
                  <div className="flex items-center gap-6">
                    <button 
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      className="w-24 h-24 bg-blue-500 text-white rounded-2xl shadow-lg flex items-center justify-center disabled:opacity-30 active:bg-blue-600"
                    >
                      <ChevronLeft size={48} strokeWidth={3} />
                    </button>
                    <span className="text-3xl font-bold text-gray-400">{currentPage + 1} / {currentScore.pages.length}</span>
                    <button 
                      disabled={currentPage === currentScore.pages.length - 1}
                      onClick={() => setCurrentPage(p => Math.min(currentScore.pages.length - 1, p + 1))}
                      className="w-24 h-24 bg-blue-500 text-white rounded-2xl shadow-lg flex items-center justify-center disabled:opacity-30 active:bg-blue-600"
                    >
                      <ChevronRight size={48} strokeWidth={3} />
                    </button>
                  </div>

                  {/* 自动滚动开关 */}
                  <div className="flex items-center gap-6 bg-gray-100 px-8 py-4 rounded-3xl">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-gray-400 mb-1 uppercase">自动滚动</span>
                      <button 
                        onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isAutoScrolling ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}
                      >
                        {isAutoScrolling ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                      </button>
                    </div>
                    <div className="flex flex-col w-40">
                      <div className="flex justify-between text-xl font-bold mb-1">
                        <span>🐢 慢</span>
                        <span>快 🐇</span>
                      </div>
                      <input 
                        type="range" min="1" max="10" value={scrollSpeed} 
                        onChange={(e) => setScrollSpeed(Number(e.target.value))}
                        className="w-full h-4 accent-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 歌单导航 (仅在歌单模式下显示) */}
                {currentPlaylist && (
                  <div className="flex items-center justify-center gap-10 border-t-2 border-gray-100 pt-4">
                    <button 
                      onClick={prevSong}
                      className="flex items-center gap-3 text-2xl font-bold text-gray-400 active:text-blue-500"
                    >
                      <SkipBack size={32} /> 上一首
                    </button>
                    <div className="h-8 w-1 bg-gray-200" />
                    <button 
                      onClick={nextSong}
                      className="flex items-center gap-3 text-2xl font-bold text-gray-400 active:text-blue-500"
                    >
                      下一首 <SkipForward size={32} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* 底部导航栏 (标签页) */}
      {view !== 'reader' && (
        <div className="h-28 bg-white border-t-4 border-gray-100 flex items-center justify-around px-4 z-40">
          <button 
            onClick={() => { setView('library'); setIsManageMode(false); }}
            className={`flex flex-col items-center gap-1 ${view === 'library' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <Library size={44} />
            <span className="text-xl font-bold">乐谱库</span>
          </button>
          <button 
            onClick={() => { setView('playlists'); setIsManageMode(false); }}
            className={`flex flex-col items-center gap-1 ${view === 'playlists' || view === 'playlistDetail' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <ListMusic size={44} />
            <span className="text-xl font-bold">歌单</span>
          </button>
          <button 
            onClick={() => { setView('favorites'); setIsManageMode(false); }} 
            className={`flex flex-col items-center gap-1 ${view === 'favorites' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <Star size={44} />
            <span className="text-xl font-bold">收藏</span>
          </button>
        </div>
      )}

      {/* 导入悬浮按钮 */}
      {view === 'library' && !isManageMode && (
        <button 
          onClick={() => setShowImportModal(true)}
          className="fixed bottom-36 right-10 w-28 h-28 bg-red-500 text-white rounded-full shadow-2xl flex flex-col items-center justify-center active:scale-90 transition-all z-40"
        >
          <Plus size={50} strokeWidth={3} />
          <span className="text-xl font-bold">导入</span>
        </button>
      )}

      {/* 导入弹窗 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-10">
          <div className="bg-white rounded-[40px] p-12 w-full max-w-2xl flex flex-col gap-8">
            <h2 className="text-4xl font-bold text-center">导入乐谱</h2>
            <div className="grid grid-cols-1 gap-6">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-6 p-10 bg-blue-500 text-white rounded-3xl shadow-xl active:bg-blue-600"
              >
                <Upload size={60} />
                <span className="text-3xl font-bold">选择本地文件 (PDF/图片)</span>
              </button>
              <p className="text-center text-gray-400 text-xl">支持从 iPad 文件夹或相册导入</p>
            </div>
            <button onClick={() => setShowImportModal(false)} className="mt-4 py-6 bg-gray-100 rounded-2xl text-3xl font-bold text-gray-500">取消</button>
          </div>
        </div>
      )}

      {/* 创建歌单弹窗 */}
      {showCreatePlaylistModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-10">
          <div className="bg-white rounded-[40px] p-12 w-full max-w-2xl flex flex-col gap-8">
            <h2 className="text-4xl font-bold text-center">创建新歌单</h2>
            <input 
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="请输入歌单名称..."
              className="w-full text-3xl p-6 bg-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500"
            />
            <div className="flex gap-4">
              <button 
                onClick={() => setShowCreatePlaylistModal(false)} 
                className="flex-1 py-6 bg-gray-100 rounded-2xl text-3xl font-bold text-gray-500 active:bg-gray-200"
              >
                取消
              </button>
              <button 
                onClick={handleCreatePlaylist} 
                disabled={newPlaylistName.trim() === ''}
                className="flex-1 py-6 bg-green-500 text-white rounded-2xl text-3xl font-bold disabled:opacity-50 active:bg-green-600"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 加入歌单弹窗 */}
      {showAddToPlaylistModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-10">
          <div className="bg-white rounded-[40px] p-12 w-full max-w-2xl flex flex-col gap-6">
            <h2 className="text-4xl font-bold text-center mb-4">加入到歌单</h2>
            <div className="max-h-[50vh] overflow-y-auto flex flex-col gap-4">
              {playlists.length === 0 ? (
                <div className="py-10 text-center text-gray-400">
                  <p className="text-2xl mb-4">您还没有创建任何歌单</p>
                  <button 
                    onClick={() => {
                      setShowAddToPlaylistModal(null);
                      setShowCreatePlaylistModal(true);
                    }}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl text-xl font-bold"
                  >
                    去创建歌单
                  </button>
                </div>
              ) : (
                playlists.map(p => {
                  const isAdded = p.sheetMusicIds.includes(showAddToPlaylistModal);
                return (
                  <button 
                    key={p.id} 
                    onClick={() => handleAddToPlaylist(p.id)}
                    className="p-8 bg-gray-50 rounded-2xl text-3xl font-bold text-left flex justify-between items-center active:bg-blue-50"
                  >
                    <span className={isAdded ? 'text-gray-400' : 'text-gray-900'}>{p.title}</span>
                    {isAdded && <CheckCircle2 className="text-green-500" size={40} />}
                  </button>
                );
              }))}
            </div>
            <button onClick={() => setShowAddToPlaylistModal(null)} className="mt-4 py-6 bg-gray-100 rounded-2xl text-3xl font-bold text-gray-500">取消</button>
          </div>
        </div>
      )}

      {/* 设置弹窗 */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-10">
          <div className="bg-white rounded-[40px] p-12 w-full max-w-2xl flex flex-col gap-8">
            <h2 className="text-4xl font-bold text-center">设置</h2>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    message: "确定要清除所有数据吗？此操作不可恢复。",
                    onConfirm: () => {
                      setScores([]);
                      setPlaylists([]);
                      setShowSettingsModal(false);
                      showToast("数据已清除");
                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    }
                  });
                }}
                className="p-8 bg-red-50 text-red-600 rounded-2xl text-3xl font-bold text-center active:bg-red-100"
              >
                清除所有数据
              </button>
              <div className="p-8 bg-gray-50 rounded-2xl text-center text-gray-500">
                <p className="text-2xl font-bold mb-2">关于 Simple Sheet Music Reader</p>
                <p className="text-xl">版本 1.0.0</p>
              </div>
            </div>
            <button onClick={() => setShowSettingsModal(false)} className="mt-4 py-6 bg-gray-100 rounded-2xl text-3xl font-bold text-gray-500">关闭</button>
          </div>
        </div>
      )}

      {/* 确认弹窗 */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-10">
          <div className="bg-white rounded-[40px] p-12 w-full max-w-2xl flex flex-col gap-8">
            <h2 className="text-4xl font-bold text-center text-gray-900">{confirmDialog.message}</h2>
            <div className="flex gap-4 mt-4">
              <button 
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} 
                className="flex-1 py-6 bg-gray-100 rounded-2xl text-3xl font-bold text-gray-500 active:bg-gray-200"
              >
                取消
              </button>
              <button 
                onClick={confirmDialog.onConfirm} 
                className="flex-1 py-6 bg-red-500 text-white rounded-2xl text-3xl font-bold active:bg-red-600"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
