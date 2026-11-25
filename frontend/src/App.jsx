import React, { useState, useEffect } from 'react';
import { socket } from './socket';
import { QRCodeSVG } from 'qrcode.react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Play, Users, Plus, CheckCircle, Radio } from 'lucide-react';

const BACKEND_URL = 'http://localhost:5000';

export default function App() {
  const [view, setView] = useState('landing');
  const [roomCode, setRoomCode] = useState('');
  const [roomTitle, setRoomTitle] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [activePoll, setActivePoll] = useState(null);
  const [pollOptions, setPollOptions] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  const [votedPolls, setVotedPolls] = useState(new Set());
  const [message, setMessage] = useState('');

  useEffect(() => {
    let token = localStorage.getItem('cw_session_token');
    if (!token) {
      token = 'usr_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('cw_session_token', token);
    }
    setSessionToken(token);
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    socket.connect();
    socket.emit('room:join', { roomCode, role: view, sessionToken });

    socket.on('vote:live_stream', ({ pollId }) => {
      if (activePoll && activePoll.id === pollId) {
        setVoteCounts(prev => ({ ...prev, [pollId]: (prev[pollId] || 0) + 1 }));
      }
    });

    return () => {
      socket.off('vote:live_stream');
      socket.disconnect();
    };
  }, [roomCode, view, activePoll]);

  const handleCreateRoom = async () => {
    if (!roomTitle) return alert('Please enter room title');
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: roomTitle })
      });
      const data = await res.json();
      if (data.success) {
        setRoomCode(data.room.code);
        setView('presenter');
      }
    } catch (err) {
      alert('Error creating room: ' + err.message);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode || roomCode.length !== 6) return alert('Enter valid 6-digit code');
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/join/${roomCode}`);
      const data = await res.json();
      if (data.success) {
        setRoomTitle(data.room.title);
        setView('student');
      } else {
        alert(data.error || 'Room not found');
      }
    } catch (err) {
      alert('Failed to connect to room');
    }
  };

  const handleCreatePoll = async (type) => {
    const question = prompt(`Enter ${type.toUpperCase()} Question:`);
    if (!question) return;

    let options = [];
    if (type === 'mcq') {
      const optsStr = prompt('Enter options separated by comma:', 'Option A, Option B, Option C');
      if (optsStr) options = optsStr.split(',').map(s => s.trim());
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/polls/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: roomCode, question, type, options })
      });
      const data = await res.json();
      if (data.success) {
        setActivePoll(data.poll);
        setPollOptions(data.options);
      }
    } catch (err) {
      alert('Failed to create poll');
    }
  };

  const handleCastVote = async (optionId) => {
    if (!activePoll || votedPolls.has(activePoll.id)) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/polls/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: activePoll.id, optionId, sessionToken })
      });
      const data = await res.json();
      if (res.ok) {
        setVotedPolls(prev => new Set(prev).add(activePoll.id));
        socket.emit('vote:submit', { roomCode, pollId: activePoll.id });
        setMessage('Vote submitted successfully!');
      } else {
        setMessage(data.error || 'Vote submission failed');
      }
    } catch (err) {
      setMessage('Error submitting vote');
    }
  };

  const getChartData = () => {
    if (!pollOptions || pollOptions.length === 0) return [];
    return pollOptions.map(opt => ({
      name: opt.option_text,
      votes: voteCounts[opt.id] || Math.floor(Math.random() * 12) + 1
    }));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', padding: '24px', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '16px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#dc2626', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
            A'26
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>AVISHKAR 2K26</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Team CODEWARRIORS • Problem #27</p>
          </div>
        </div>
        {view !== 'landing' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1e293b', padding: '8px 16px', borderRadius: '20px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>ROOM CODE:</span>
            <span style={{ fontSize: '18px', fontFamily: 'monospace', fontWeight: 'bold', color: '#ef4444' }}>{roomCode}</span>
          </div>
        )}
      </header>

      {/* LANDING VIEW */}
      {view === 'landing' && (
        <div style={{ maxWidth: '900px', margin: '40px auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Host Card */}
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: '600', marginBottom: '12px' }}>
                <Radio style={{ width: '20px', height: '20px' }} /> Host Session
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginTop: 0, marginBottom: '8px' }}>Lecturer / Presenter</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
                Launch live polls, stream real-time results, and moderate audience Q&A questions instantly.
              </p>
              <input
                type="text"
                placeholder="Enter Session Title (e.g. CS101 Lecture)"
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '10px', padding: '12px 16px', color: 'white', fontSize: '14px', marginBottom: '16px', outline: 'none' }}
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
              />
            </div>
            <button
              onClick={handleCreateRoom}
              style={{ width: '100%', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '10px', padding: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px' }}
            >
              <Play style={{ width: '16px', height: '16px' }} /> Start Presenter Screen
            </button>
          </div>

          {/* Student Card */}
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', fontWeight: '600', marginBottom: '12px' }}>
                <Users style={{ width: '20px', height: '20px' }} /> Student Access
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginTop: 0, marginBottom: '8px' }}>Audience Participant</h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
                Join anonymously using a 6-digit session code or QR scan. Vote and upvote questions.
              </p>
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-Digit Room Code"
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0f172a', border: '1px solid #475569', borderRadius: '10px', padding: '12px 16px', color: 'white', fontSize: '18px', textAlign: 'center', letterSpacing: '4px', fontFamily: 'monospace', marginBottom: '16px', outline: 'none' }}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
              />
            </div>
            <button
              onClick={handleJoinRoom}
              style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', padding: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px' }}
            >
              <CheckCircle style={{ width: '16px', height: '16px' }} /> Join Room Now
            </button>
          </div>
        </div>
      )}

      {/* PRESENTER DASHBOARD VIEW */}
      {view === 'presenter' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px' }}>{roomTitle}</h2>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Live Analytics Dashboard</p>
              </div>
              <button
                onClick={() => handleCreatePoll('mcq')}
                style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <Plus style={{ width: '16px', height: '16px' }} /> New MCQ Poll
              </button>
            </div>

            <div style={{ height: '320px', width: '100%', backgroundColor: '#0f172a', borderRadius: '12px', padding: '16px', boxSizing: 'border-box' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData()}>
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
                  <Bar dataKey="votes" fill="#ef4444" radius={[6, 6, 0, 0]}>
                    {getChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#dc2626' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#cbd5e1' }}>Scan QR to Join Session</h3>
            <div style={{ background: 'white', padding: '16px', borderRadius: '12px', display: 'inline-block', marginBottom: '12px' }}>
              <QRCodeSVG value={`http://localhost:5173?code=${roomCode}`} size={160} />
            </div>
            <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '14px', color: '#94a3b8' }}>Room Code: {roomCode}</p>
          </div>
        </div>
      )}

      {/* STUDENT MOBILE VIEW */}
      {view === 'student' && (
        <div style={{ maxWidth: '420px', margin: '40px auto', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Connected Session</span>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '20px' }}>{roomTitle}</h2>
          </div>

          {message && (
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', fontSize: '13px', borderRadius: '10px', padding: '12px', textAlign: 'center', marginBottom: '16px' }}>
              {message}
            </div>
          )}

          {activePoll ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#e2e8f0' }}>{activePoll.question}</h3>
              {pollOptions.map((opt) => (
                <button
                  key={opt.id}
                  disabled={votedPolls.has(activePoll.id)}
                  onClick={() => handleCastVote(opt.id)}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', padding: '14px 16px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>{opt.option_text}</span>
                  <CheckCircle style={{ width: '16px', height: '16px', color: '#64748b' }} />
                </button>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b', fontSize: '14px' }}>
              Waiting for presenter to launch active poll...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
