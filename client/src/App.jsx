import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import UrlInput from './components/UrlInput';
import VideoCard from './components/VideoCard';
import PipelineTracker from './components/PipelineTracker';
import LogTerminal from './components/LogTerminal';
import NotesViewer from './components/NotesViewer';
import { fetchYoutubeMetadata, startNoteGeneration, getTaskStatus, streamTaskLogs } from './services/server/api';
import { Sparkles, Video, Terminal, Layers, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [url, setUrl] = useState('');
  
  // Metadata state
  const [metadata, setMetadata] = useState(null);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [metaError, setMetaError] = useState(null);

  // Note generation state
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState('IDLE'); // IDLE | PROCESSING | COMPLETED | FAILED
  const [taskResult, setTaskResult] = useState(null);
  const [taskError, setTaskError] = useState(null);

  // Terminal & Logs state
  const [logs, setLogs] = useState([]);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const eventSourceRef = useRef(null);

  // Polling ref
  const pollIntervalRef = useRef(null);

  // Handler: Fetch Metadata
  const handleFetchMetadata = async (targetUrl = url) => {
    if (!targetUrl) return;
    setIsLoadingMeta(true);
    setMetaError(null);
    try {
      const data = await fetchYoutubeMetadata(targetUrl);
      setMetadata(data);
    } catch (err) {
      setMetaError(err.message || 'Failed to fetch video metadata');
      setMetadata(null);
    } finally {
      setIsLoadingMeta(false);
    }
  };

  // Handler: Start Note Generation
  const handleGenerateNotes = async (targetUrl = url) => {
    if (!targetUrl) return;

    // Reset task state
    setTaskId(null);
    setTaskStatus('PROCESSING');
    setTaskResult(null);
    setTaskError(null);
    setLogs([]);
    setIsTerminalOpen(true); // Open terminal automatically on generate

    // If metadata isn't fetched yet, fetch it concurrently
    if (!metadata) {
      handleFetchMetadata(targetUrl);
    }

    try {
      const response = await startNoteGeneration(targetUrl);
      const newTaskId = response.task_id;
      setTaskId(newTaskId);

      // Start SSE Log Streaming
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      const es = streamTaskLogs(
        newTaskId,
        (logLine) => {
          setLogs((prev) => [...prev, logLine]);
        },
        (err) => {
          console.warn('SSE log stream error or disconnected:', err);
        },
        () => {
          console.log('SSE log stream completed.');
        }
      );
      eventSourceRef.current = es;

      // Start Polling Status every 2 seconds
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusData = await getTaskStatus(newTaskId);
          if (statusData.status === 'COMPLETED') {
            setTaskStatus('COMPLETED');
            setTaskResult(statusData.result);
            if (statusData.metadata) setMetadata(statusData.metadata);
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
            }
            clearInterval(pollIntervalRef.current);
          } else if (statusData.status === 'FAILED') {
            setTaskStatus('FAILED');
            setTaskError(statusData.error || 'Notes generation failed.');
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
            }
            clearInterval(pollIntervalRef.current);
          }
        } catch (pollErr) {
          console.error('Task status poll error:', pollErr);
        }
      }, 2000);

    } catch (err) {
      setTaskStatus('FAILED');
      setTaskError(err.message || 'Failed to dispatch note generation task');
    }
  };

  const handleLoadMockData = () => {
    // Populate with mock video metadata
    setMetadata({
      title: 'Attention Is All You Need (Transformer Architecture Explained)',
      author: 'NotesMaker AI Labs',
      length: 1240,
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
      description: 'A deep dive into the seminal paper that introduced the Transformer network architecture.'
    });

    // Populate with mock log pipeline steps
    setLogs([
      'Task 777-mock-data: Starting mock study notes generation...',
      '[stage: metadata] Transcript & Metadata Generator node started.',
      '[stage: metadata] Fetching video metadata and transcript...',
      '[stage: metadata] Transcript & Metadata Generator node completed.',
      '[stage: transcript] Transcript Merger node started.',
      '[stage: transcript] Paragraph segmentation successfully finished.',
      '[stage: transcript] Transcript Merger node completed.',
      '[stage: orchestrator] Starting Orchestrator node.',
      '[stage: orchestrator] Generating curriculum outline and planning...',
      '[stage: orchestrator] Orchestrator node completed successfully.',
      '[stage: section_writer] Starting parallel Section Workers...',
      '[stage: section_writer] [Section 1] Generating introduction & self-attention overview...',
      '[stage: section_writer] [Section 2] Synthesizing multi-head attention math details...',
      '[stage: section_writer] Section Worker completed for all sections.',
      '[stage: reducer] Starting Reducer node.',
      '[stage: reducer] Synthesis & Final Assembly completed successfully. Total sections merged: 2.',
      '[STREAM_FINISHED]'
    ]);

    setTaskStatus('COMPLETED');
    setTaskResult({
      draft_notes: {
        title: 'Attention Is All You Need (Transformer Architecture Explained)',
        content: `### 1. Introduction to the Transformer
The **Transformer** is a landmark neural network architecture introduced in 2017. Unlike previous sequence-to-sequence models (such as LSTMs and GRUs) that processed input sequentially, the Transformer relies entirely on **Self-Attention Mechanisms** to capture global dependencies.

Key advantages include:
- **Parallelization**: Computations across different sequence steps can be executed concurrently.
- **Constant Path Length**: Signals travel a constant distance between any two input positions.

### 2. Self-Attention Mechanics
Self-attention maps a query vector ($Q$) and a set of key ($K$) and value ($V$) vectors to an output. The matrix representation is defined mathematically as:

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$

Where:
- $Q, K, V$ are projection matrices.
- $d_k$ is the scaling dimension factor.

### 3. Multi-Head Attention (MHA)
Instead of performing a single attention function, Multi-Head Attention projects the queries, keys, and values $h$ times with different linear projections:

\`\`\`python
# Multi-head attention simulation code block
import torch
import torch.nn as nn

class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, num_heads):
        super().__init__()
        self.num_heads = num_heads
        self.d_k = d_model // num_heads
        self.q_linear = nn.Linear(d_model, d_model)
        self.k_linear = nn.Linear(d_model, d_model)
        self.v_linear = nn.Linear(d_model, d_model)
        
    def forward(self, q, k, v):
        # linear projection and scaling mechanics
        print("Executing self-attention layers...")
        return v
\`\`\`
`,
        sections: [
          {
            section_id: 1,
            title: 'Introduction & Self-Attention',
            content: 'Self-attention maps a query vector ($Q$) and a set of key ($K$) and value ($V$) vectors.',
            references: [
              { title: 'Attention Is All You Need Paper (ArXiv)', url: 'https://arxiv.org/abs/1706.03762' }
            ]
          },
          {
            section_id: 2,
            title: 'Multi-Head Attention Layers',
            content: 'Multi-head projects queries, keys and values dynamically.',
            references: [
              { title: 'The Annotated Transformer (Harvard)', url: 'https://nlp.seas.harvard.edu/2018/04/03/attention.html' }
            ]
          }
        ]
      },
      lecture_outline: {
        title: 'Transformer Architecture Fundamentals',
        difficulty: 'Intermediate',
        lecture_type: 'Technical Seminar',
        overview: 'Overview of Self-Attention, Positional Encoding, and Feed-Forward sublayers.',
        learning_objectives: [
          'Understand the difference between Recurrent models and Self-Attention layers',
          'Calculate scaled dot-product attention mechanics',
          'Implement multi-head projection splitting'
        ],
        topic_hierarchy: [
          { title: 'Sequence to Sequence Limits', bullets: ['RNN bottlenecks', 'Lack of parallel processing'] },
          { title: 'Dot-Product Attention Scaling', bullets: ['Softmax stability', 'Dimension scaling factor'] }
        ],
        concepts: ['Self-Attention', 'Dot-Product Scaling', 'Multi-Head Projection']
      }
    });
  };

  // Clear metadata and errors when URL is empty
  useEffect(() => {
    if (url.trim() === '') {
      setMetadata(null);
      setMetaError(null);
    }
  }, [url]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col selection:bg-zinc-800 relative overflow-hidden">
      {/* Smooth White Ambient Light Blobs */}
      <div className="fixed -top-24 -left-24 w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] bg-gradient-to-br from-white/25 via-zinc-200/10 to-transparent rounded-full blur-[75px] pointer-events-none z-0 opacity-100"></div>
      <div className="fixed -top-24 -right-24 w-[400px] sm:w-[650px] h-[400px] sm:h-[650px] bg-gradient-to-bl from-white/20 via-zinc-300/10 to-transparent rounded-full blur-[85px] pointer-events-none z-0 opacity-50"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[200px] bg-white/[0.08] rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Top Header Navbar */}
      <Header
        onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
        logCount={logs.length}
        isGenerating={taskStatus === 'PROCESSING'}
      />

      {/* Main Split Layout Container */}
      <div className={`flex-1 w-full flex flex-col lg:flex-row gap-6 px-4 sm:px-8 pb-16 pt-20 sm:pt-24 transition-all duration-300 ${
        isTerminalOpen ? 'max-w-[1700px] mx-auto' : 'max-w-7xl mx-auto'
      }`}>
        {/* Part 1: Notes Generation UI (Upper part on phone, Left part on desktop) */}
        <main className={`flex-1 min-w-0 w-full transition-all duration-300 ${
          isTerminalOpen ? 'pb-[20vh] lg:pb-0 lg:pr-[440px] xl:pr-[500px]' : ''
        }`}>
          {/* Hero Banner Title */}
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              Powered by Multi-Agent LangGraph Architecture
            </div> */}
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-50">
              Transform Any YouTube Video into{' '}
              <span className="bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
                Structured Study Notes
              </span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Extract transcripts, generate deep lecture outlines, perform online research, and assemble publication-grade notes automatically.
            </p>
          </div>

          {/* Input Search & Presets Component */}
          <UrlInput
            url={url}
            setUrl={setUrl}
            onFetchMetadata={handleFetchMetadata}
            onGenerateNotes={handleGenerateNotes}
            onLoadMockData={handleLoadMockData}
            isLoadingMeta={isLoadingMeta}
            isGenerating={taskStatus === 'PROCESSING'}
          />

          {/* Error Messages */}
          {metaError && (
            <div className="max-w-4xl mx-auto mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <div>
                <span className="font-bold">Metadata Fetch Error:</span> {metaError}
              </div>
            </div>
          )}
          
          {/* Video Card Preview */}
          {url !== '' && (
            <VideoCard
              metadata={metadata}
              onStartGeneration={handleGenerateNotes}
              isGenerating={taskStatus === 'PROCESSING'}
            />
          )}

          {/* Pipeline Step Tracker */}
          {(taskStatus !== 'IDLE' || taskId) && (
            <PipelineTracker
              status={taskStatus}
              logs={logs}
              error={taskError}
            />
          )}

          {/* Results Notes & Outline Viewer */}
          {taskResult && (
            <NotesViewer result={taskResult} />
          )}

          {/* Empty state prompt if idle */}
          {taskStatus === 'IDLE' && !metadata && (
            <div className="max-w-3xl mx-auto text-center py-12 px-6 rounded-xl bg-zinc-950 border border-zinc-800 my-8 space-y-4 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center mx-auto">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-200">
                Ready to process your first video
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Paste a YouTube lecture URL above or click one of the quick demo presets to generate notes, outline, and streaming logs.
              </p>
            </div>
          )}
        </main>

        {/* Part 2: Real-time Streaming Terminal (Right Part on Windows/Desktop) */}
        <LogTerminal
          logs={logs}
          isOpen={isTerminalOpen}
          onClose={() => setIsTerminalOpen(false)}
          onClear={() => setLogs([])}
        />
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black py-6 text-center text-xs text-zinc-500">
        <p>NotesMaker AI - All Rights Reserved</p>
      </footer>
    </div>
  );
}
