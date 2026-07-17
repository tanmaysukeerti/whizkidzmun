import React, { useState } from 'react';
import BoomerangVideoBg from './components/BoomerangVideoBg';
import { AlertTriangle, LogOut, Maximize, Menu, X, Play, Radio, Monitor, Settings, Keyboard } from 'lucide-react';
import { ViewState } from './types';
import RollCall from './components/RollCall';
import GSL from './components/GSL';
import RoundRobin from './components/RoundRobin';
import Caucus from './components/Caucus';
import Voting from './components/Voting';
import Crisis from './components/Crisis';
import SetupModal from './components/SetupModal';
import ShortcutsHelp from './components/ShortcutsHelp';
import { useCommittee } from './committee/CommitteeContext';
import NowSpeakingBanner from './committee/NowSpeakingBanner';
import TimerAlerts from './committee/TimerAlerts';
import { useChairKeys } from './committee/useChairKeys';
import { toggleFullscreen, useIdleCursor, useWakeLock } from './committee/usePolish';
import { useAuth } from './auth/AuthContext';

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { state, actions, connected, readOnly } = useCommittee();
  const { logout, displayName } = useAuth();

  const activeView = state.session.activeView;
  const committee = state.session.committee;
  const setActiveView = (view: ViewState) => actions.setView(view);

  useChairKeys({
    enabled: !readOnly && !setupOpen && !helpOpen,
    activeView,
    caucusMode: state.session.caucus.mode,
    timers: state.session.timers,
    actions,
    onToggleHelp: () => setHelpOpen((v) => !v),
  });

  // Projector polish: never let the screen sleep mid-session; on the projector
  // feed, also hide the cursor after a few idle seconds.
  useWakeLock(true);
  useIdleCursor(readOnly);

  const navItems: { id: ViewState; label: string }[] = [
    { id: 'HOME', label: 'Overwatch' },
    { id: 'ROLL_CALL', label: 'Roll Call' },
    { id: 'GSL', label: 'GSL' },
    { id: 'ROUND_ROBIN', label: 'Round Robin' },
    { id: 'CAUCUS', label: 'Caucus' },
    { id: 'VOTING', label: 'Voting Matrix' },
  ];

  return (
    <div className="relative w-full min-h-screen sm:h-screen overflow-hidden bg-[#010828] text-[#EFF4FF] font-sans">
      <TimerAlerts />
      <NowSpeakingBanner />
      {setupOpen && !readOnly && <SetupModal onClose={() => setSetupOpen(false)} />}
      {helpOpen && <ShortcutsHelp onClose={() => setHelpOpen(false)} />}
      {activeView === 'CRISIS' && <Crisis />}

      <div className="grid-bg"></div>
      <div className="scanline"></div>
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(111,255,0,0.05)_0%,transparent_70%)]"></div>

      {/* Background Anchor Attachment */}
      <BoomerangVideoBg
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_131941_d136af49-e243-493a-be14-6ff3f24e09e6.mp4"
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
      />

      {/* Layer 1: Command Level Navigation Bar */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 md:px-10 py-4 sm:py-6">
        {/* Left Frame Title Node */}
        <div
          className={`flex items-center space-x-2 z-40 ${readOnly ? '' : 'cursor-pointer'}`}
          onClick={readOnly ? undefined : () => setActiveView('HOME')}
        >
          <span className="font-grotesk text-2xl tracking-tighter uppercase">WHIZKIDZ.MUN</span>
          <sup className="text-[10px] ml-0.5 mt-1">TM</sup>
        </div>

        {/* Middle Capsule (Desktop Viewport only) */}
        <div className="hidden lg:flex bg-[#010828]/70 backdrop-blur-md rounded-full pl-6 pr-1 py-1 border border-[#EFF4FF]/20 items-center space-x-6 z-40">
          <div className="flex space-x-4 text-xs font-bold uppercase tracking-widest">
            {navItems.map(item => (
              <span
                key={item.id}
                onClick={readOnly ? undefined : () => setActiveView(item.id)}
                className={`transition-colors ${readOnly ? '' : 'cursor-pointer hover:text-[#6FFF00]'} ${activeView === item.id ? 'text-[#6FFF00]' : `opacity-40 ${readOnly ? '' : 'hover:opacity-100'}`}`}
              >
                {item.label}
              </span>
            ))}
          </div>
          <div
            className="flex items-center gap-2 bg-[#EFF4FF]/5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter"
            title={connected ? 'Live-synced across all screens' : 'Reconnecting…'}
          >
            <Radio className={`w-3 h-3 ${connected ? 'text-[#6FFF00]' : 'text-red-500 animate-pulse'}`} />
            {connected ? 'Live Sync' : 'Offline'}
          </div>
        </div>

        {/* Right Utility Operations (Desktop) */}
        <div className="hidden lg:flex items-center space-x-6 text-[10px] font-bold uppercase tracking-widest z-40">
          {readOnly ? (
            <>
              <div
                onClick={toggleFullscreen}
                className="flex items-center opacity-60 hover:opacity-100 hover:text-[#6FFF00] cursor-pointer transition-all"
                title="Toggle fullscreen"
              >
                <Maximize className="w-3 h-3 mr-2" />
                Fullscreen
              </div>
              <div className="flex items-center gap-2 text-[#6FFF00] border border-[#6FFF00]/40 px-4 py-1.5 rounded-full">
                <Monitor className="w-3 h-3" />
                Projector Feed
              </div>
            </>
          ) : (
            <>
              <div
                onClick={() => setSetupOpen(true)}
                className="flex items-center opacity-60 hover:opacity-100 hover:text-[#6FFF00] cursor-pointer transition-all"
                title="Committee setup — name, topic, roster"
              >
                <Settings className="w-3 h-3 mr-2" />
                Setup
              </div>
              <div
                onClick={toggleFullscreen}
                className="flex items-center opacity-60 hover:opacity-100 hover:text-[#6FFF00] cursor-pointer transition-all"
                title="Toggle fullscreen ( F )"
              >
                <Maximize className="w-3 h-3 mr-2" />
                Fullscreen
              </div>
              <div
                onClick={() => setHelpOpen(true)}
                className="flex items-center opacity-60 hover:opacity-100 hover:text-[#6FFF00] cursor-pointer transition-all"
                title="Keyboard shortcuts ( ? )"
              >
                <Keyboard className="w-3 h-3 mr-2" />
                Keys
              </div>
              <a
                href="?role=projector"
                target="_blank"
                rel="noreferrer"
                className="flex items-center opacity-60 hover:opacity-100 hover:text-[#6FFF00] cursor-pointer transition-all"
                title="Open a read-only projector view in a new tab"
              >
                <Monitor className="w-3 h-3 mr-2" />
                Projector
              </a>
              <div
                onClick={() => setActiveView('CRISIS')}
                className="flex items-center opacity-60 hover:opacity-100 hover:text-red-500 cursor-pointer transition-all"
              >
                <AlertTriangle className="w-3 h-3 mr-2" />
                Crisis
              </div>
              <div
                onClick={logout}
                className="flex items-center opacity-60 hover:opacity-100 hover:text-[#6FFF00] cursor-pointer transition-all"
                title={displayName ? `Signed in as ${displayName}` : undefined}
              >
                <LogOut className="w-3 h-3 mr-2" />
                Sign Out
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        {!readOnly && (
          <button
            className="lg:hidden relative z-50 w-10 h-10 flex items-center justify-center border border-[#EFF4FF]/20 bg-[#010828]/50 backdrop-blur-sm transition-colors hover:bg-[#EFF4FF]/10"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
          >
            <Menu className={`absolute w-5 h-5 transition-all duration-300 ${menuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
            <X className={`absolute w-5 h-5 transition-all duration-300 ${menuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
          </button>
        )}
        {readOnly && (
          <div className="lg:hidden flex items-center gap-4 text-[#6FFF00] text-[10px] font-bold uppercase tracking-widest z-40">
            <button onClick={toggleFullscreen} aria-label="Toggle fullscreen" className="opacity-70">
              <Maximize className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Projector
            </div>
          </div>
        )}
      </header>

      {/* Layer 2: Interactive Mobile Drawer Layout Shell */}
      {!readOnly && (
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Interactive Overlay */}
        <div className="absolute inset-0 bg-[#010828]/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />

        {/* Drawer Mechanism */}
        <div className={`absolute top-0 right-0 bottom-0 w-[85%] max-w-sm bg-[#010828] border-l border-[#EFF4FF]/20 shadow-2xl flex flex-col pt-24 px-8 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>

          <nav className="flex flex-col gap-8">
            {navItems.map((item, i) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setMenuOpen(false);
                }}
                className={`text-left text-xl font-grotesk uppercase tracking-tight transition-all duration-500 hover:text-[#6FFF00] ${menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'} ${activeView === item.id ? 'text-[#6FFF00]' : 'text-[#EFF4FF]'}`}
                style={{ transitionDelay: menuOpen ? `${150 + i * 70}ms` : '0ms' }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-12 flex flex-col gap-6 font-bold uppercase tracking-widest text-xs">
            <button
              onClick={() => {
                setSetupOpen(true);
                setMenuOpen(false);
              }}
              className={`flex items-center gap-3 transition-all duration-500 hover:text-[#6FFF00] opacity-60 ${menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
              style={{ transitionDelay: menuOpen ? `${150 + navItems.length * 70}ms` : '0ms' }}
            >
              <Settings className="w-5 h-5" />
              Committee Setup
            </button>
            <button
              onClick={() => {
                setActiveView('CRISIS');
                setMenuOpen(false);
              }}
              className={`flex items-center gap-3 transition-all duration-500 hover:text-red-500 opacity-60 ${menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
              style={{ transitionDelay: menuOpen ? `${150 + navItems.length * 70}ms` : '0ms' }}
            >
              <AlertTriangle className="w-5 h-5" />
              Crisis
            </button>
            <button
              onClick={() => {
                logout();
                setMenuOpen(false);
              }}
              className={`flex items-center gap-3 transition-all duration-500 hover:text-[#6FFF00] opacity-60 ${menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
              style={{ transitionDelay: menuOpen ? `${150 + (navItems.length + 1) * 70}ms` : '0ms' }}
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
            <div
              className={`mt-6 flex items-center justify-center gap-2 border border-[#EFF4FF]/20 text-[#EFF4FF] font-black uppercase px-6 py-3 text-sm rounded-full transition-all duration-500 ${menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              style={{ transitionDelay: menuOpen ? `${150 + (navItems.length + 2) * 70}ms` : '0ms' }}
            >
              <Radio className={`w-4 h-4 ${connected ? 'text-[#6FFF00]' : 'text-red-500 animate-pulse'}`} />
              {connected ? 'Live Sync Active' : 'Offline'}
            </div>
          </div>
        </div>
      </div>
      )}

      <div className="absolute font-condiment text-[#6FFF00] opacity-60 rotate-[-15deg] text-[1.2rem] pointer-events-none z-20 top-32 md:top-40 left-10 md:left-[15%]">Classified Access</div>
      <div className="hidden sm:block absolute font-condiment text-[#6FFF00] opacity-60 rotate-[12deg] text-[1.2rem] pointer-events-none z-20 bottom-48 right-[12%]">Session 44.B</div>

      {/* Main View Router */}
      {activeView === 'HOME' && (
        <>
          {/* Layer 3: Primary Screen Heading (Hero Display Panel) */}
          <main className="relative z-10 flex flex-col items-center text-center pt-32 sm:pt-40 md:pt-44 px-4 sm:px-6 w-full pointer-events-none h-full">
            <h1
              className="font-grotesk uppercase text-[4rem] sm:text-[5.25rem] xl:text-[6.5rem] flex flex-col items-center leading-[0.95] max-w-4xl"
              style={{ letterSpacing: '-0.035em' }}
            >
              <span className="block drop-shadow-lg">{committee.name} //</span>
              <span className="block text-[#85AB8B] drop-shadow-lg">{committee.topic}</span>
            </h1>

            <p className="font-mono text-[10px] uppercase tracking-[0.2em] max-w-md mt-6 opacity-60 leading-relaxed">
              Real-time debate processing, speaker queue synchronization, and encrypted resolution analytics.
            </p>
            <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.2em] mt-5 text-[#6FFF00] font-bold text-center max-w-md px-4 drop-shadow-[0_0_10px_rgba(111,255,0,0.4)]">
              System Architect — Tanmay Sukeerti M
            </p>

            <div className="mt-8 md:mt-12 flex space-x-4">
              <div className="w-px h-12 md:h-16 bg-[#EFF4FF]/20"></div>
              <div className="w-px h-12 md:h-16 bg-[#EFF4FF]/20 mt-4"></div>
              <div className="w-px h-12 md:h-16 bg-[#EFF4FF]/20"></div>
            </div>
          </main>

          {/* Layer 4: Bottom-Left Operations Metric Card */}
          <section className="absolute left-4 right-4 sm:right-auto sm:left-6 md:left-10 bottom-6 sm:bottom-8 md:bottom-10 z-20 max-w-sm border border-[#EFF4FF]/20 p-5 sm:p-6 bg-[#010828]/80 backdrop-blur-md">
            <div className="flex items-center mb-4">
              <div className="w-2 h-2 rounded-full bg-[#6FFF00] animate-pulse mr-2 shadow-[0_0_8px_#6FFF00]" />
              <span className="font-mono text-[10px] tracking-widest text-[#6FFF00] uppercase font-bold">CORE NODE ACTIVATED</span>
            </div>
            <p className="text-xs text-[#EFF4FF] opacity-80 leading-relaxed mb-6">
              Tactical monitoring of Section 4 amendment flow. Real-time data validation in progress. Security protocols operating at peak efficiency.
            </p>
            {!readOnly && (
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveView('VOTING')}
                  className="flex-1 bg-[#3d5638] hover:bg-[#2d4228] transition-colors border border-[#6FFF00]/20 text-[#EFF4FF] font-black uppercase py-2 px-3 tracking-widest text-[10px]"
                >
                  Deploy Resolution
                </button>
                <button
                  onClick={() => setActiveView('ROLL_CALL')}
                  className="flex-1 bg-transparent hover:bg-[#EFF4FF]/10 transition-colors border border-[#EFF4FF]/20 text-[#EFF4FF] font-black uppercase py-2 px-3 tracking-widest text-[10px]"
                >
                  Access Vault
                </button>
              </div>
            )}
          </section>

          {/* Layer 5: Bottom-Right Video Metrics Controller */}
          <section className="absolute right-4 sm:right-6 md:right-10 bottom-24 sm:bottom-8 md:bottom-10 z-20 flex flex-col items-end">
            <div className="flex items-center space-x-3 md:space-x-4 bg-[#010828]/60 backdrop-blur-sm p-3 border border-[#EFF4FF]/10 rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 rounded-full border border-[#EFF4FF]/20 cursor-pointer hover:bg-[#EFF4FF]/10 transition-colors group">
                <Play className="w-3 h-3 fill-current text-[#EFF4FF] group-hover:text-[#6FFF00] transition-colors ml-0.5" />
              </div>
              <div className="flex flex-col items-end">
                <span className="font-mono text-[10px] opacity-40 uppercase tracking-widest mb-1">System Timestamp</span>
                <span className="font-mono text-xs font-bold text-[#6FFF00] tracking-widest uppercase">
                  Live Node Status: {connected ? '100%' : 'RECONNECTING'}
                </span>
              </div>
            </div>
            <div className="mt-4 font-mono text-[9px] opacity-30 text-right uppercase">Buffer Index: 0x8F92 - Latency: 4ms</div>
          </section>
        </>
      )}

      {activeView === 'ROLL_CALL' && <RollCall />}
      {activeView === 'GSL' && <GSL />}
      {activeView === 'ROUND_ROBIN' && <RoundRobin />}
      {activeView === 'CAUCUS' && <Caucus />}
      {activeView === 'VOTING' && <Voting />}

    </div>
  );
}
