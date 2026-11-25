import React, { useState, useEffect, useCallback } from 'react';
import { socket } from './socket';
import { QRCodeSVG } from 'qrcode.react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  Play,
  Users,
  Plus,
  CheckCircle,
  Radio,
  ThumbsUp,
  Pin,
  Check,
  Star,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  Copy,
  LogOut,
  Send,
  Download,
  Sun,
  Moon
} from 'lucide-react';
import confetti from 'canvas-confetti';

const BACKEND_URL = '';

const TEAM_INFO = {
  name: 'Code warriors',
  id: 'AV26-756772BCAB',
  members: 'KC Spoorti • Deeksha B • Lekha R • Sanjana HR'
};

export default function App() {
  const [page, setPage] = useState('portal');
  const [activeTab, setActiveTab] = useState('polls');
  const [roomCode, setRoomCode] = useState('');
  const [roomTitle, setRoomTitle] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [projectorLight, setProjectorLight] = useState(false);

  const [activePoll, setActivePoll] = useState({
    id: 'poll-01',
    question: "Rate today's live presentation & WebSocket responsiveness:",
    type: 'rating',
    status: 'active'
  });
  const [pollOptions, setPollOptions] = useState([]);
  const [voteCounts, setVoteCounts] = useState({ 'opt-1': 22, 'opt-2': 18, 'opt-3': 8, 'opt-4': 4 });
  const [ratingVotes, setRatingVotes] = useState([5, 5, 4, 5, 5, 3, 4, 5]);
  const [wordList, setWordList] = useState(['Interactive', 'Fast', 'Scalable', 'Interactive', 'Real-time', 'Fast', 'Innovative']);
  const [votedPolls, setVotedPolls] = useState(new Set());

  const [selectedRating, setSelectedRating] = useState(0);
  const [wordInput, setWordInput] = useState('');
  const [showPollModal, setShowPollModal] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollType, setNewPollType] = useState('mcq');
  const [newPollOptionsStr, setNewPollOptionsStr] = useState('Socket.io Engine, Redis Lock Buffer, PostgreSQL DB, React UI');

  const [questions, setQuestions] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [upvotedQuestions, setUpvotedQuestions] = useState(new Set());
  const [qaFilter, setQaFilter] = useState('all');

  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
    window.clearTimeout(window.__cwToastTimer);
    window.__cwToastTimer = window.setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, 3500);
  }, []);

  const fetchActivePoll = useCallback(async (code) => {
    if (!code) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/polls/active/${code}`);
      const data = await res.json();
      if (data.success && data.poll) {
        setActivePoll(data.poll);
        setPollOptions(Array.isArray(data.options) ? data.options : []);
      }
    } catch (err) {
      console.error('Failed to load active poll:', err);
    }
  }, []);

  const fetchQuestions = useCallback(async (code) => {
    if (!code) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/questions/${code}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        setQuestions(data.questions);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    }
  }, []);

  useEffect(() => {
    let token = localStorage.getItem('cw_session_token');
    if (!token) {
      token = 'usr_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('cw_session_token', token);
    }
    setSessionToken(token);

    const params = new URLSearchParams(window.location.search);
    const codeParam = (params.get('code') || '').trim();
    const roleParam = (params.get('role') || '').trim().toLowerCase();

    if (codeParam) {
      setRoomCode(codeParam);
      setRoomTitle('AVISHKAR 2K26 Keynote Presentation');
      setPage(roleParam === 'host' ? 'host_page' : 'join_page');
      fetchQuestions(codeParam);
      fetchActivePoll(codeParam);
    } else if (roleParam === 'host') {
      setPage('host_setup');
    } else if (roleParam === 'join') {
      setPage('join_page');
    }
  }, [fetchQuestions, fetchActivePoll]);

  const navigateToPage = (nextPage, codeOverride) => {
    const codeToUse = codeOverride !== undefined ? codeOverride : roomCode;
    const url = new URL(window.location.href);
    if (nextPage === 'host_page' && codeToUse) {
      url.searchParams.set('role', 'host');
      url.searchParams.set('code', codeToUse);
    } else if (nextPage === 'join_page') {
      url.searchParams.set('role', 'join');
      if (codeToUse) url.searchParams.set('code', codeToUse);
    } else {
      url.searchParams.delete('role');
      url.searchParams.delete('code');
    }
    window.history.replaceState({}, '', url.toString());
    setPage(nextPage);
  };

  useEffect(() => {
    const isRoomActive = (page === 'host_page' || page === 'join_page') && Boolean(roomCode);
    if (!isRoomActive) return;

    socket.connect();
    socket.emit('room:join', { roomCode, role: page === 'host_page' ? 'host' : 'join', sessionToken });

    const onPollCreated = ({ poll, options }) => {
      if (!poll) return;
      setActivePoll(poll);
      setPollOptions(Array.isArray(options) ? options : []);
      setVoteCounts({});
      setRatingVotes([]);
      setWordList([]);
      setSelectedRating(0);
      showToast(`New ${String(poll.type || 'poll').toUpperCase()} poll launched!`, 'info');
    };

    const onVoteStream = (data) => {
      if (!data) return;
      if (data.optionId) {
        setVoteCounts((prev) => ({ ...prev, [data.optionId]: (prev[data.optionId] || 0) + 1 }));
      }
      if (data.ratingVal) {
        setRatingVotes((prev) => [...prev, data.ratingVal]);
      }
      if (data.wordVal) {
        setWordList((prev) => [...prev, data.wordVal]);
      }
    };

    const onNewQuestion = (q) => {
      if (!q) return;
      setQuestions((prev) => (prev.some((item) => item.id === q.id) ? prev : [q, ...prev]));
    };

    const onQuestionChanged = ({ questionId, upvotes, status }) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, upvotes, ...(status && { status }) } : q))
      );
    };

    const onPollEnded = () => {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      showToast('Poll ended! Top response celebrated.', 'success');
    };

    socket.on('poll:created', onPollCreated);
    socket.on('vote:live_stream', onVoteStream);
    socket.on('question:new_item', onNewQuestion);
    socket.on('question:item_changed', onQuestionChanged);
    socket.on('poll:ended_event', onPollEnded);

    return () => {
      socket.off('poll:created', onPollCreated);
      socket.off('vote:live_stream', onVoteStream);
      socket.off('question:new_item', onNewQuestion);
      socket.off('question:item_changed', onQuestionChanged);
      socket.off('poll:ended_event', onPollEnded);
      socket.disconnect();
    };
  }, [page, roomCode, sessionToken, showToast]);

  const handleStartHostSession = async (e) => {
    e.preventDefault();
    const title = roomTitle.trim() || 'AVISHKAR 2K26 Keynote Session';
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      const data = await res.json();
      const code = data.room && data.room.code ? data.room.code : '756772';
      setRoomCode(code);
      setRoomTitle(title);
      setActiveTab('polls');
      navigateToPage('host_page', code);
      fetchQuestions(code);
      fetchActivePoll(code);
      showToast(`Host Room ${code} is live`, 'success');
    } catch {
      const fallbackCode = '756772';
      setRoomCode(fallbackCode);
      setRoomTitle(title);
      setActiveTab('polls');
      navigateToPage('host_page', fallbackCode);
      showToast('Host Room started in fallback mode', 'info');
    }
  };

  const handleJoinClassroom = async (e) => {
    e.preventDefault();
    const cleanCode = (roomCode || '').trim();
    if (cleanCode.length !== 6) {
      return showToast('Enter a valid 6-digit room code (e.g. 756772)', 'warning');
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/join/${cleanCode}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        return showToast(data.error || 'Room code not found', 'error');
      }
      setRoomCode(cleanCode);
      setRoomTitle((data.room && data.room.title) || 'AVISHKAR 2K26 Presentation');
      setActiveTab('polls');
      navigateToPage('join_page', cleanCode);
      fetchQuestions(cleanCode);
      fetchActivePoll(cleanCode);
      showToast(`Joined Room ${cleanCode}`, 'success');
    } catch {
      return showToast('Unable to reach server. Check backend & tunnel.', 'error');
    }
  };

  const handleCreatePollSubmit = async (e) => {
    e.preventDefault();
    if (!newPollQuestion.trim()) {
      return showToast('Enter a poll question first', 'warning');
    }
    const options =
      newPollType === 'mcq'
        ? newPollOptionsStr
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    try {
      const res = await fetch(`${BACKEND_URL}/api/polls/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: roomCode, question: newPollQuestion.trim(), type: newPollType, options })
      });
      const data = await res.json();
      if (data.success && data.poll) {
        setActivePoll(data.poll);
        setPollOptions(Array.isArray(data.options) ? data.options : []);
        setVoteCounts({});
        setRatingVotes([]);
        setWordList([]);
        setSelectedRating(0);
        setNewPollQuestion('');
        setShowPollModal(false);
        showToast(`Launched ${newPollType.toUpperCase()} poll`, 'success');
      }
    } catch {
      showToast('Could not create poll', 'error');
    }
  };

  const handleCastVote = async (optionId = null, ratingVal = null, wordVal = null) => {
    if (!activePoll) return;
    if (votedPolls.has(activePoll.id)) {
      return showToast('Duplicate vote blocked — Session token locked!', 'warning');
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/polls/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: activePoll.id, optionId, ratingVal, wordVal, sessionToken })
      });
      const data = await res.json();
      if (res.ok) {
        setVotedPolls((prev) => new Set(prev).add(activePoll.id));
        socket.emit('vote:submit', { roomCode, pollId: activePoll.id, optionId, ratingVal, wordVal });
        showToast('Vote recorded!', 'success');
      } else {
        showToast(data.error || 'Duplicate vote blocked — Session token locked!', 'warning');
      }
    } catch {
      showToast('Network error submitting vote', 'error');
    }
  };

  const handleEndPoll = () => {
    socket.emit('poll:end', { roomCode, pollId: activePoll?.id });
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
    showToast('Poll completed with celebration!', 'success');
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestionText.trim()) {
      return showToast('Type your question before posting', 'warning');
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/questions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomCode,
          authorName: authorName.trim() || 'Anonymous',
          content: newQuestionText.trim(),
          sessionToken
        })
      });
      const data = await res.json();
      if (data.success && data.question) {
        socket.emit('question:submit', { roomCode, question: data.question });
        setNewQuestionText('');
        showToast('Question posted to Q&A feed', 'success');
      }
    } catch {
      showToast('Failed to post question', 'error');
    }
  };

  const handleUpvoteQuestion = async (qId) => {
    if (upvotedQuestions.has(qId)) {
      return showToast('Already upvoted this question', 'warning');
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/questions/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: qId, sessionToken })
      });
      const data = await res.json();
      if (data.success && data.question) {
        setUpvotedQuestions((prev) => new Set(prev).add(qId));
        socket.emit('question:upvote', { roomCode, questionId: qId, upvotes: data.question.upvotes });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleModerateStatus = async (qId, targetStatus) => {
    const currentQ = questions.find((item) => item.id === qId);
    const nextStatus = currentQ && currentQ.status === targetStatus ? 'pending' : targetStatus;
    try {
      const res = await fetch(`${BACKEND_URL}/api/questions/${qId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success && data.question) {
        socket.emit('question:upvote', {
          roomCode,
          questionId: qId,
          upvotes: data.question.upvotes,
          status: nextStatus
        });
        showToast(`Question set to ${nextStatus}`, 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const joinShareUrl = `${window.location.origin}/?role=join&code=${roomCode}`;

  const copyJoinLink = () => {
    navigator.clipboard?.writeText(joinShareUrl);
    showToast('Joiner link copied to clipboard', 'success');
  };

  const getMcqChartData = () => {
    if (pollOptions.length > 0) {
      return pollOptions.map((opt) => ({ name: opt.option_text, votes: voteCounts[opt.id] || 0 }));
    }
    return [
      { name: 'Socket.io Engine', votes: voteCounts['opt-1'] || 22 },
      { name: 'Redis Lock Buffer', votes: voteCounts['opt-2'] || 18 },
      { name: 'PostgreSQL DB', votes: voteCounts['opt-3'] || 8 },
      { name: 'React UI', votes: voteCounts['opt-4'] || 4 }
    ];
  };

  const getAverageRating = () => {
    if (ratingVotes.length === 0) return '0.0';
    return (ratingVotes.reduce((a, b) => a + b, 0) / ratingVotes.length).toFixed(1);
  };

  const getWordFrequencies = () => {
    const freq = {};
    wordList.forEach((w) => {
      const key = String(w || '').trim();
      if (key) freq[key] = (freq[key] || 0) + 1;
    });
    return Object.entries(freq)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);
  };

  const sortedQuestions = [...questions].sort((a, b) => {
    if (a.status === 'pinned' && b.status !== 'pinned') return -1;
    if (b.status === 'pinned' && a.status !== 'pinned') return 1;
    return (b.upvotes || 0) - (a.upvotes || 0);
  });

  const handleExportSessionCsv = () => {
    const rows = [
      ['Section', 'Label', 'Value/Count', 'Status'],
      ['Session', 'Team ID', TEAM_INFO.id, TEAM_INFO.name],
      ['Session', 'Room Code', roomCode || 'N/A', roomTitle || 'AVISHKAR 2K26'],
      ['Poll', activePoll?.question || 'Poll', activePoll?.type || 'mcq', activePoll?.status || 'active']
    ];

    if (activePoll?.type === 'mcq') {
      getMcqChartData().forEach((item) => rows.push(['MCQ Option', item.name, item.votes, 'Live']));
    } else if (activePoll?.type === 'rating') {
      rows.push(['Rating Average', `${getAverageRating()} / 5.0`, ratingVotes.length, 'Submissions']);
    } else if (activePoll?.type === 'wordcloud') {
      getWordFrequencies().forEach((item) => rows.push(['Word Cloud', item.word, item.count, 'Frequency']));
    }

    sortedQuestions.forEach((q) => {
      rows.push(['Q&A Question', q.author_name || 'Anonymous', q.upvotes || 0, q.status || 'pending']);
      rows.push(['Q&A Content', q.content || '', '', '']);
    });

    const csvText = rows
      .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `avishkar-session-${roomCode || 'summary'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Session CSV exported!', 'success');
  };

  const shellSurface = projectorLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100';
  const cardSurface = projectorLight
    ? 'bg-white border-slate-300 text-slate-900 shadow-sm'
    : 'bg-slate-900 border-slate-800 text-slate-100';
  const innerSurface = projectorLight
    ? 'bg-slate-50 border-slate-200 text-slate-900'
    : 'bg-slate-950 border-slate-800 text-slate-100';

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${shellSurface}`}>
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl ${
            toast.type === 'error'
              ? 'bg-red-950/95 border-red-500/60 text-red-100'
              : toast.type === 'warning'
              ? 'bg-amber-950/95 border-amber-500/60 text-amber-100'
              : 'bg-emerald-950/95 border-emerald-500/60 text-emerald-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      <header className={`border-b px-5 py-3.5 ${projectorLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900/80'}`}>
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigateToPage('portal', '')}
            className="flex items-center gap-3 text-left group"
          >
            <span className="w-10 h-10 rounded-lg bg-red-600 text-white font-bold flex items-center justify-center text-sm shadow">
              AV&apos;26
            </span>
            <span>
              <span className="block text-base font-bold tracking-tight">
                AVISHKAR 2K26 • <span className="text-red-500">{TEAM_INFO.id}</span>
              </span>
              <span className={`block text-xs ${projectorLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {TEAM_INFO.name} — {TEAM_INFO.members}
              </span>
            </span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {page === 'host_page' && (
              <>
                <button
                  type="button"
                  onClick={() => setProjectorLight((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    projectorLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  {projectorLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  {projectorLight ? 'Dark Mode' : 'Projector Mode'}
                </button>
                <button
                  type="button"
                  onClick={handleExportSessionCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </>
            )}

            {page !== 'portal' && (
              <>
                {roomCode && (
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${
                      projectorLight
                        ? 'bg-slate-100 border-slate-300 text-slate-800'
                        : 'bg-slate-800 border-slate-700 text-slate-200'
                    }`}
                  >
                    ROOM <strong className="text-red-500 text-sm">{roomCode}</strong>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => navigateToPage('portal', '')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    projectorLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" /> Home
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-8">
        <div className="max-w-6xl mx-auto">
          {page === 'portal' && (
            <div className="max-w-4xl mx-auto pt-6">
              <div className="text-center mb-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-2">
                  Problem #27 • Live Classroom Polling &amp; Q&amp;A
                </p>
                <h1 className="text-3xl font-bold text-white mb-2">Choose Your Portal</h1>
                <p className="text-sm text-slate-400">
                  Separate dedicated screens for session presenters and mobile/web participants.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 flex flex-col justify-between">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center mb-4">
                      <Radio className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Host Page</h2>
                    <p className="text-sm text-slate-400 leading-relaxed mb-6">
                      Create a room, display a scannable QR code, run MCQ, 5-Star Rating, or Word Cloud polls, and pin or resolve audience questions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateToPage('host_setup')}
                    className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition"
                  >
                    <Play className="w-4 h-4" /> Open Host Page
                  </button>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 flex flex-col justify-between">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-4">
                      <Users className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Joiner Page</h2>
                    <p className="text-sm text-slate-400 leading-relaxed mb-6">
                      Enter a 6-digit room code or scan the presenter QR code to vote once per poll and ask or upvote questions in real time.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateToPage('join_page')}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle className="w-4 h-4" /> Open Joiner Page
                  </button>
                </div>
              </div>
            </div>
          )}

          {page === 'host_setup' && (
            <div className="max-w-md mx-auto pt-6">
              <button
                type="button"
                onClick={() => navigateToPage('portal')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-4"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Portal Selection
              </button>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Host Setup</span>
                <h2 className="text-2xl font-bold text-white mt-1 mb-2">Start a Presenter Room</h2>
                <p className="text-sm text-slate-400 mb-6">
                  Name your session to generate a room code, QR code, and dedicated host dashboard.
                </p>

                <form onSubmit={handleStartHostSession} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Session Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AVISHKAR 2K26 Live Demo"
                      value={roomTitle}
                      onChange={(e) => setRoomTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition"
                  >
                    Launch Host Dashboard
                  </button>
                </form>
              </div>
            </div>
          )}

          {page === 'host_page' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className={`lg:col-span-8 border rounded-2xl p-6 space-y-6 ${cardSurface}`}>
                <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-4 ${projectorLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-500">Host View</span>
                    <h2 className="text-xl font-bold">{roomTitle || 'AVISHKAR 2K26 Session'}</h2>
                  </div>

                  <div className={`flex items-center gap-2 p-1 rounded-xl border ${innerSurface}`}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('polls')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                        activeTab === 'polls' ? 'bg-red-600 text-white' : projectorLight ? 'text-slate-600' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Polls
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('qa')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                        activeTab === 'qa' ? 'bg-red-600 text-white' : projectorLight ? 'text-slate-600' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Q&amp;A ({questions.length})
                    </button>
                  </div>
                </div>

                {activeTab === 'polls' ? (
                  <div className="space-y-5">
                    <div className={`flex flex-wrap items-center justify-between gap-3 border rounded-xl p-4 ${innerSurface}`}>
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-red-500">
                          {activePoll.type} poll
                        </span>
                        <h3 className="text-base font-semibold mt-0.5">{activePoll.question}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleEndPoll}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> End Poll
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPollModal(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5" /> New Poll
                        </button>
                      </div>
                    </div>

                    {activePoll.type === 'mcq' && (
                      <div className={`h-72 w-full border rounded-xl p-4 ${innerSurface}`}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getMcqChartData()}>
                            <XAxis dataKey="name" stroke={projectorLight ? '#334155' : '#94a3b8'} fontSize={12} />
                            <YAxis stroke={projectorLight ? '#334155' : '#94a3b8'} fontSize={12} allowDecimals={false} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: projectorLight ? '#ffffff' : '#0f172a',
                                borderColor: projectorLight ? '#cbd5e1' : '#334155',
                                color: projectorLight ? '#0f172a' : '#f8fafc'
                              }}
                            />
                            <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                              {getMcqChartData().map((entry, idx) => (
                                <Cell key={entry.name} fill={idx % 2 === 0 ? '#dc2626' : '#ef4444'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {activePoll.type === 'rating' && (
                      <div className={`border rounded-xl p-8 text-center ${innerSurface}`}>
                        <div className="text-4xl font-bold text-amber-500 mb-2">{getAverageRating()} / 5.0</div>
                        <div className="flex justify-center gap-2 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-7 h-7 ${
                                star <= Math.round(Number(getAverageRating()))
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-500'
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs ${projectorLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {ratingVotes.length} total rating responses
                        </p>
                      </div>
                    )}

                    {activePoll.type === 'wordcloud' && (
                      <div className={`border rounded-xl p-6 min-h-60 flex flex-wrap gap-3 items-center justify-center ${innerSurface}`}>
                        {getWordFrequencies().length === 0 ? (
                          <p className="text-sm text-slate-500">No word submissions yet.</p>
                        ) : (
                          getWordFrequencies().map(({ word, count }) => (
                            <span
                              key={word}
                              style={{ fontSize: `${Math.min(14 + count * 4, 30)}px` }}
                              className={`px-4 py-1.5 rounded-full border font-semibold ${
                                projectorLight
                                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                                  : 'bg-slate-900 border-slate-700 text-blue-300'
                              }`}
                            >
                              {word} <span className="text-xs opacity-75 ml-1">×{count}</span>
                            </span>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 pb-1">
                      <span className={`text-xs ${projectorLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        Click Pin or Check again to undo
                      </span>
                      <div className={`flex items-center gap-1.5 p-1 rounded-lg border ${innerSurface}`}>
                        {['all', 'pinned', 'pending', 'answered'].map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setQaFilter(tab)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize ${
                              qaFilter === tab ? 'bg-red-600 text-white' : projectorLight ? 'text-slate-600' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    {sortedQuestions.filter((item) => (qaFilter === 'all' ? true : item.status === qaFilter)).length === 0 ? (
                      <p className="text-sm text-slate-500 py-6 text-center">No questions in this filter.</p>
                    ) : (
                      sortedQuestions
                        .filter((item) => (qaFilter === 'all' ? true : item.status === qaFilter))
                        .map((q) => (
                          <div
                            key={q.id}
                            className={`rounded-xl p-4 border flex items-center justify-between gap-4 ${innerSurface}`}
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-blue-500">{q.author_name}</span>
                                {q.status === 'pinned' && (
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-600 text-white">
                                    Pinned
                                  </span>
                                )}
                                {q.status === 'answered' && (
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-700 text-white">
                                    Answered
                                  </span>
                                )}
                              </div>
                              <p className="text-sm">{q.content}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg text-red-500 ${projectorLight ? 'bg-slate-200' : 'bg-slate-900'}`}>
                                ▲ {q.upvotes || 0}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleModerateStatus(q.id, 'pinned')}
                                title="Pin / Unpin Question"
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                              >
                                <Pin className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleModerateStatus(q.id, 'answered')}
                                title="Mark Answered / Reopen"
                                className="p-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}

                {/* Architecture Layer Status Strip */}
                <div className={`pt-4 border-t flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium ${projectorLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'}`}>
                  <span>⚡ Real-Time Layer: Socket.io Active</span>
                  <span>🛡️ Double-Vote Guard: Session Token Locked</span>
                  <span>🗄️ Architecture: React + Node/Express + PostgreSQL/Redis</span>
                </div>
              </div>

              <div className={`lg:col-span-4 border rounded-2xl p-6 text-center space-y-4 ${cardSurface}`}>
                <h3 className="text-sm font-semibold">Joiner QR &amp; Code</h3>
                <div className="bg-white p-3.5 rounded-2xl inline-block border border-slate-200">
                  <QRCodeSVG value={joinShareUrl} size={164} />
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-wider ${projectorLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Room Code
                  </p>
                  <p className="text-2xl font-mono font-bold text-red-500 tracking-widest">{roomCode}</p>
                </div>
                <button
                  type="button"
                  onClick={copyJoinLink}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 border ${
                    projectorLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Joiner Link
                </button>
              </div>
            </div>
          )}

          {page === 'join_page' && (
            <div className="max-w-md mx-auto">
              {!roomCode ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Joiner Page</span>
                  <h2 className="text-2xl font-bold text-white mt-1 mb-2">Enter Classroom Code</h2>
                  <p className="text-sm text-slate-400 mb-6">
                    Type the 6-digit code shown on the host screen (demo code: <strong className="text-slate-200">756772</strong>).
                  </p>
                  <form onSubmit={handleJoinClassroom} className="space-y-4">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="756772"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition"
                    >
                      Join Session
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                        Joiner View
                      </span>
                      <h2 className="text-lg font-bold text-white">{roomTitle || 'Live Session'}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRoomCode('')}
                      className="text-xs text-slate-400 hover:text-white underline"
                    >
                      Change Code
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab('polls')}
                      className={`py-2 rounded-lg text-xs font-semibold transition ${
                        activeTab === 'polls' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Vote Poll
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('qa');
                        fetchQuestions(roomCode);
                      }}
                      className={`py-2 rounded-lg text-xs font-semibold transition ${
                        activeTab === 'qa' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Q&amp;A Feed ({questions.length})
                    </button>
                  </div>

                  {activeTab === 'polls' ? (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-100">{activePoll.question}</h3>

                      {activePoll.type === 'mcq' && (
                        <div className="space-y-4">
                          {!votedPolls.has(activePoll.id) ? (
                            <div className="space-y-2.5">
                              {(pollOptions.length > 0
                                ? pollOptions
                                : [
                                    { id: 'opt-1', option_text: 'Socket.io Engine' },
                                    { id: 'opt-2', option_text: 'Redis Lock Buffer' },
                                    { id: 'opt-3', option_text: 'PostgreSQL DB' },
                                    { id: 'opt-4', option_text: 'React UI' }
                                  ]
                              ).map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleCastVote(opt.id, null, null)}
                                  className="w-full px-4 py-3 rounded-xl bg-slate-950 hover:border-blue-500 border border-slate-800 text-left text-sm text-white flex items-center justify-between transition"
                                >
                                  <span>{opt.option_text}</span>
                                  <CheckCircle className="w-4 h-4 text-slate-500" />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4" /> Vote Submitted — Live Results
                              </p>
                              <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={getMcqChartData()}>
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                                    <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                                    <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                                      {getMcqChartData().map((entry, idx) => (
                                        <Cell key={entry.name} fill={idx % 2 === 0 ? '#2563eb' : '#60a5fa'} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activePoll.type === 'rating' && (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-center space-y-4">
                          <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                disabled={votedPolls.has(activePoll.id)}
                                onClick={() => setSelectedRating(star)}
                                className="p-1 disabled:opacity-50"
                              >
                                <Star
                                  className={`w-8 h-8 ${
                                    star <= selectedRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            disabled={votedPolls.has(activePoll.id) || selectedRating === 0}
                            onClick={() => handleCastVote(null, selectedRating, null)}
                            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-sm"
                          >
                            {votedPolls.has(activePoll.id) ? 'Rating Submitted' : 'Submit Rating'}
                          </button>
                        </div>
                      )}

                      {activePoll.type === 'wordcloud' && (
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Type a single word (e.g. Fast)"
                            value={wordInput}
                            disabled={votedPolls.has(activePoll.id)}
                            onChange={(e) => setWordInput(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                          />
                          <button
                            type="button"
                            disabled={votedPolls.has(activePoll.id) || !wordInput.trim()}
                            onClick={() => {
                              const val = wordInput.trim();
                              setWordInput('');
                              handleCastVote(null, null, val);
                            }}
                            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-sm"
                          >
                            {votedPolls.has(activePoll.id) ? 'Word Submitted' : 'Submit Word'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <form onSubmit={handleSubmitQuestion} className="space-y-2.5">
                        <input
                          type="text"
                          placeholder="Your name (optional)"
                          value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                        <textarea
                          placeholder="Ask a question..."
                          value={newQuestionText}
                          onChange={(e) => setNewQuestionText(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs h-20 resize-none focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="submit"
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> Post Question
                        </button>
                      </form>

                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {sortedQuestions.map((q) => (
                          <div
                            key={q.id}
                            className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3"
                          >
                            <div>
                              <span className="text-[11px] font-semibold text-blue-400 block">{q.author_name}</span>
                              <p className="text-xs text-slate-200 mt-0.5">{q.content}</p>
                            </div>
                            <button
                              type="button"
                              disabled={upvotedQuestions.has(q.id)}
                              onClick={() => handleUpvoteQuestion(q.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs text-slate-200 inline-flex items-center gap-1 shrink-0"
                            >
                              <ThumbsUp className="w-3 h-3" /> {q.upvotes || 0}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showPollModal && page === 'host_page' && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Create New Poll</h3>
            <form onSubmit={handleCreatePollSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Poll Type
                </label>
                <select
                  value={newPollType}
                  onChange={(e) => setNewPollType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="rating">5-Star Rating</option>
                  <option value="wordcloud">Word Cloud</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Question
                </label>
                <input
                  type="text"
                  placeholder="Enter poll question..."
                  value={newPollQuestion}
                  onChange={(e) => setNewPollQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                />
              </div>

              {newPollType === 'mcq' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Options (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={newPollOptionsStr}
                    onChange={(e) => setNewPollOptionsStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                  />
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPollModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
                >
                  Launch Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
