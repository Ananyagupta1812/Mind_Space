import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FileText, Mic, Video, Send, StopCircle } from 'lucide-react';
import API from '../api/axios';

export default function Journal() {
  const [activeTab, setActiveTab] = useState('text');
  const [textEntry, setTextEntry] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pastEntries, setPastEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // Fetch past entries on mount
  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoadingEntries(true);
    try {
      const response = await API.get('/journals');
      setPastEntries(response.data);
    } catch (err) {
      console.error('Failed to fetch journals:', err);
    } finally {
      setLoadingEntries(false);
    }
  };

  const startRecording = async (type) => {
    try {
      const constraints = type === 'audio'
        ? { audio: true }
        : { audio: true, video: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, {
          type: type === 'audio' ? 'audio/webm' : 'video/webm'
        });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert('Please allow microphone/camera access to record.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textEntry.trim()) return;
    setLoading(true);
    try {
      await API.post('/journals/text', { content: textEntry });
      setSubmitted(true);
      fetchEntries();
    } catch (err) {
      alert('Failed to save journal entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMediaSubmit = async () => {
    if (!recordedBlob) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', recordedBlob, `recording.${activeTab === 'audio' ? 'webm' : 'webm'}`);
      formData.append('type', activeTab);

      const response = await API.post('/journals/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setTranscription(response.data.transcription || 'Transcription complete.');
      setSubmitted(true);
      fetchEntries();
    } catch (err) {
      alert('Failed to transcribe. Please check your OpenAI API key.');
    } finally {
      setLoading(false);
    }
  };

  const resetEntry = () => {
    setTextEntry('');
    setRecordedBlob(null);
    setTranscription('');
    setSubmitted(false);
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment === 'positive') return 'text-emerald-400';
    if (sentiment === 'negative') return 'text-red-400';
    return 'text-yellow-400';
  };

  const getSentimentEmoji = (sentiment) => {
    if (sentiment === 'positive') return '😊';
    if (sentiment === 'negative') return '😔';
    return '😐';
  };

  const tabs = [
    { id: 'text', label: 'Text', icon: FileText },
    { id: 'audio', label: 'Audio', icon: Mic },
    { id: 'video', label: 'Video', icon: Video },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Journal</h1>
            <p className="text-gray-400 mt-1">Express yourself freely</p>
          </div>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition"
          >
            📅 Past Entries
          </button>
        </div>

        {/* Calendar + Past Entries */}
        {showCalendar && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
            <h2 className="text-white font-semibold mb-3">Browse Past Entries</h2>
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
            />
            <div className="mt-4 space-y-3">
              {loadingEntries ? (
                <p className="text-gray-400 text-sm">Loading entries...</p>
              ) : pastEntries.length === 0 ? (
                <p className="text-gray-400 text-sm">No entries yet. Start journalling!</p>
              ) : (
                pastEntries.map((entry) => (
                  <div key={entry.id} className="bg-gray-800 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400 text-xs">
                        {new Date(entry.createdAt).toDateString()} — {entry.type}
                      </span>
                      <span className={`text-xs font-medium ${getSentimentColor(entry.sentiment)}`}>
                        {getSentimentEmoji(entry.sentiment)} {entry.sentiment}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm line-clamp-2">{entry.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Main Journal Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); resetEntry(); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
                    ${activeTab === tab.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Success Message */}
          {submitted && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg px-4 py-3 mb-4 text-sm">
              ✅ Journal entry saved successfully!
              <button onClick={resetEntry} className="ml-3 underline text-emerald-300">
                Write another
              </button>
            </div>
          )}

          {/* TEXT TAB */}
          {activeTab === 'text' && !submitted && (
            <div>
              <textarea
                value={textEntry}
                onChange={(e) => setTextEntry(e.target.value)}
                placeholder="What's on your mind today? Write freely..."
                rows={8}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500 transition resize-none text-sm leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-gray-600 text-xs">{textEntry.length} characters</span>
                <button
                  onClick={handleTextSubmit}
                  disabled={!textEntry.trim() || loading}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </div>
          )}

          {/* AUDIO TAB */}
          {activeTab === 'audio' && !submitted && (
            <div className="flex flex-col items-center py-6 gap-4">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all
                ${isRecording
                  ? 'bg-red-500/20 border-2 border-red-500 animate-pulse'
                  : 'bg-gray-800 border-2 border-gray-700'
                }`}>
                <Mic className={`w-10 h-10 ${isRecording ? 'text-red-400' : 'text-gray-400'}`} />
              </div>

              <p className="text-gray-400 text-sm">
                {isRecording ? '🔴 Recording...' : recordedBlob ? '✅ Recording ready' : 'Click to start recording'}
              </p>

              <div className="flex gap-3">
                {!isRecording && !recordedBlob && (
                  <button
                    onClick={() => startRecording('audio')}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                  >
                    Start Recording
                  </button>
                )}
                {isRecording && (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                  >
                    <StopCircle className="w-4 h-4" />
                    Stop
                  </button>
                )}
                {recordedBlob && !isRecording && (
                  <>
                    <button
                      onClick={() => setRecordedBlob(null)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition"
                    >
                      Re-record
                    </button>
                    <button
                      onClick={handleMediaSubmit}
                      disabled={loading}
                      className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                    >
                      <Send className="w-4 h-4" />
                      {loading ? 'Transcribing...' : 'Save & Transcribe'}
                    </button>
                  </>
                )}
              </div>

              {transcription && (
                <div className="w-full bg-gray-800 rounded-xl p-4 mt-2">
                  <p className="text-gray-400 text-xs mb-2 font-medium">TRANSCRIPTION</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{transcription}</p>
                </div>
              )}
            </div>
          )}

          {/* VIDEO TAB */}
          {activeTab === 'video' && !submitted && (
            <div className="flex flex-col items-center py-6 gap-4">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all
                ${isRecording
                  ? 'bg-red-500/20 border-2 border-red-500 animate-pulse'
                  : 'bg-gray-800 border-2 border-gray-700'
                }`}>
                <Video className={`w-10 h-10 ${isRecording ? 'text-red-400' : 'text-gray-400'}`} />
              </div>

              <p className="text-gray-400 text-sm">
                {isRecording ? '🔴 Recording...' : recordedBlob ? '✅ Recording ready' : 'Click to start recording'}
              </p>

              <div className="flex gap-3">
                {!isRecording && !recordedBlob && (
                  <button
                    onClick={() => startRecording('video')}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                  >
                    Start Recording
                  </button>
                )}
                {isRecording && (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                  >
                    <StopCircle className="w-4 h-4" />
                    Stop
                  </button>
                )}
                {recordedBlob && !isRecording && (
                  <>
                    <button
                      onClick={() => setRecordedBlob(null)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition"
                    >
                      Re-record
                    </button>
                    <button
                      onClick={handleMediaSubmit}
                      disabled={loading}
                      className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                    >
                      <Send className="w-4 h-4" />
                      {loading ? 'Transcribing...' : 'Save & Transcribe'}
                    </button>
                  </>
                )}
              </div>

              {transcription && (
                <div className="w-full bg-gray-800 rounded-xl p-4 mt-2">
                  <p className="text-gray-400 text-xs mb-2 font-medium">TRANSCRIPTION</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{transcription}</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}