/**
 * MedQuery — Healthcare Conversational Assistant
 * Frontend Controller with Fetch REST API, Web Audio UI Feedback,
 * Web Speech Voice Dictation & Text-to-Speech Synthesis.
 */

(function () {
  'use strict';

  // DOM Elements
  const messagesStream = document.getElementById('messagesStream');
  const emptyState = document.getElementById('emptyState');
  const chatForm = document.getElementById('chatForm');
  const messageInput = document.getElementById('messageInput');
  const charCounter = document.getElementById('charCounter');
  const btnSend = document.getElementById('btnSend');
  const btnSendText = document.getElementById('btnSendText');
  const btnSendIcon = document.getElementById('btnSendIcon');
  const sendSpinner = document.getElementById('sendSpinner');
  const messageCounterBadge = document.getElementById('messageCounterBadge');

  // Header Actions & Audio
  const btnDemo = document.getElementById('btnDemo');
  const btnPrint = document.getElementById('btnPrint');
  const btnClear = document.getElementById('btnClear');
  const btnAudioToggle = document.getElementById('btnAudioToggle');
  const iconAudioOn = document.getElementById('iconAudioOn');
  const iconAudioOff = document.getElementById('iconAudioOff');

  // Voice Input Elements
  const btnVoiceInput = document.getElementById('btnVoiceInput');
  const micIcon = document.getElementById('micIcon');
  const micStatusText = document.getElementById('micStatusText');

  // Analytics Elements
  const latestTimestamp = document.getElementById('latestTimestamp');
  const latestIntent = document.getElementById('latestIntent');
  const latestConfidence = document.getElementById('latestConfidence');
  const latestUrgency = document.getElementById('latestUrgency');
  const latestUrgencyText = document.getElementById('latestUrgencyText');
  const latestTone = document.getElementById('latestTone');
  const latestTermsCount = document.getElementById('latestTermsCount');
  const latestKeywordsList = document.getElementById('latestKeywordsList');

  const statTotalMessages = document.getElementById('statTotalMessages');
  const statUserMessages = document.getElementById('statUserMessages');
  const statAssistantMessages = document.getElementById('statAssistantMessages');
  const statKeywordMentions = document.getElementById('statKeywordMentions');

  const mostCommonIntentLabel = document.getElementById('mostCommonIntentLabel');
  const intentDistributionList = document.getElementById('intentDistributionList');

  const urgencyRoutineCount = document.getElementById('urgencyRoutineCount');
  const urgencyRoutineBar = document.getElementById('urgencyRoutineBar');
  const urgencyAttentionCount = document.getElementById('urgencyAttentionCount');
  const urgencyAttentionBar = document.getElementById('urgencyAttentionBar');
  const urgencyUrgentCount = document.getElementById('urgencyUrgentCount');
  const urgencyUrgentBar = document.getElementById('urgencyUrgentBar');

  const toneDistributionList = document.getElementById('toneDistributionList');
  const topKeywordsCloud = document.getElementById('topKeywordsCloud');
  const uniqueKeywordsLabel = document.getElementById('uniqueKeywordsLabel');

  // Modals
  const analysisModalBackdrop = document.getElementById('analysisModalBackdrop');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalDismissBtn = document.getElementById('modalDismissBtn');
  const modalBody = document.getElementById('modalBody');

  const confirmModalBackdrop = document.getElementById('confirmModalBackdrop');
  const confirmCloseBtn = document.getElementById('confirmCloseBtn');
  const confirmCancelBtn = document.getElementById('confirmCancelBtn');
  const confirmExecuteBtn = document.getElementById('confirmExecuteBtn');

  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  // Print Targets
  const printDate = document.getElementById('printDate');
  const printSessionId = document.getElementById('printSessionId');
  const printMetricsSummary = document.getElementById('printMetricsSummary');
  const printConversationSection = document.getElementById('printConversationSection');

  // Runtime State
  let currentMessages = [];
  let isSending = false;
  let audioEnabled = true;
  let speechRecognition = null;
  let isRecognizing = false;
  let currentSpeakingUtterance = null;

  // Web Audio Context Synthesizer (Zero External Dependencies)
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playSound(type) {
    if (!audioEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'receive') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.07); // E5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'urgent') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // ==========================================================================
  // Initialization & Event Binding
  // ==========================================================================

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    initSpeechRecognition();
    fetchConversationAndDashboard();
  });

  function bindEvents() {
    // Chat Form Submit
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSend();
    });

    // Enter Key Handler (Shift + Enter for new line)
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // Char counter
    messageInput.addEventListener('input', () => {
      const len = messageInput.value.length;
      charCounter.textContent = `${len} / 2000`;
    });

    // Audio Mute Toggle
    btnAudioToggle.addEventListener('click', () => {
      audioEnabled = !audioEnabled;
      if (audioEnabled) {
        iconAudioOn.classList.remove('hidden');
        iconAudioOff.classList.add('hidden');
        playSound('click');
        showToast('Audio feedback enabled', 'info');
      } else {
        iconAudioOn.classList.add('hidden');
        iconAudioOff.classList.remove('hidden');
        showToast('Audio feedback muted', 'info');
      }
    });

    // Voice Dictation
    btnVoiceInput.addEventListener('click', toggleVoiceDictation);

    // Suggested Chips
    const chips = document.querySelectorAll('.suggested-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        playSound('click');
        const query = chip.getAttribute('data-query');
        if (query) {
          messageInput.value = query;
          charCounter.textContent = `${query.length} / 2000`;
          messageInput.focus();
        }
      });
    });

    // Header Action Buttons
    btnDemo.addEventListener('click', () => {
      playSound('click');
      handleRestoreDemo();
    });

    btnClear.addEventListener('click', () => {
      playSound('click');
      openModal(confirmModalBackdrop);
    });

    btnPrint.addEventListener('click', () => {
      playSound('click');
      prepareAndTriggerPrint();
    });

    // Modal Close Triggers
    modalCloseBtn.addEventListener('click', () => closeModal(analysisModalBackdrop));
    modalDismissBtn.addEventListener('click', () => closeModal(analysisModalBackdrop));
    confirmCloseBtn.addEventListener('click', () => closeModal(confirmModalBackdrop));
    confirmCancelBtn.addEventListener('click', () => closeModal(confirmModalBackdrop));
    confirmExecuteBtn.addEventListener('click', handleClearConfirmed);

    // Close on backdrop click & ESC key
    window.addEventListener('click', (e) => {
      if (e.target === analysisModalBackdrop) closeModal(analysisModalBackdrop);
      if (e.target === confirmModalBackdrop) closeModal(confirmModalBackdrop);
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal(analysisModalBackdrop);
        closeModal(confirmModalBackdrop);
      }
    });
  }

  // ==========================================================================
  // Web Speech API: Voice Dictation & Text-to-Speech
  // ==========================================================================

  function initSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      speechRecognition = new SpeechRec();
      speechRecognition.continuous = false;
      speechRecognition.interimResults = false;
      speechRecognition.lang = 'en-US';

      speechRecognition.onstart = () => {
        isRecognizing = true;
        btnVoiceInput.classList.add('listening');
        micStatusText.textContent = 'Listening...';
        showToast('Microphone active. Speak your symptoms now...', 'info');
      };

      speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          messageInput.value = (messageInput.value ? messageInput.value + ' ' : '') + transcript;
          charCounter.textContent = `${messageInput.value.length} / 2000`;
          playSound('click');
        }
      };

      speechRecognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        stopVoiceDictation();
        showToast(`Voice input notice: ${event.error}`, 'warning');
      };

      speechRecognition.onend = () => {
        stopVoiceDictation();
      };
    } else {
      btnVoiceInput.title = 'Voice dictation is supported in Chrome, Edge, and Safari';
    }
  }

  function toggleVoiceDictation() {
    if (!speechRecognition) {
      showToast('Voice dictation is supported in modern browsers like Chrome, Edge, and Safari.', 'warning');
      return;
    }

    if (isRecognizing) {
      speechRecognition.stop();
      stopVoiceDictation();
    } else {
      try {
        speechRecognition.start();
      } catch (err) {
        stopVoiceDictation();
      }
    }
  }

  function stopVoiceDictation() {
    isRecognizing = false;
    btnVoiceInput.classList.remove('listening');
    micStatusText.textContent = 'Voice Dictate';
  }

  function speakText(text, btnElement) {
    if (!('speechSynthesis' in window)) {
      showToast('Text-to-speech is not supported in this browser.', 'warning');
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      if (currentSpeakingUtterance === text) {
        currentSpeakingUtterance = null;
        if (btnElement) btnElement.classList.remove('speaking');
        return;
      }
    }

    const cleanText = text.replace(/[*_#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    currentSpeakingUtterance = text;

    if (btnElement) btnElement.classList.add('speaking');

    utterance.onend = () => {
      currentSpeakingUtterance = null;
      if (btnElement) btnElement.classList.remove('speaking');
    };

    utterance.onerror = () => {
      currentSpeakingUtterance = null;
      if (btnElement) btnElement.classList.remove('speaking');
    };

    window.speechSynthesis.speak(utterance);
  }

  // ==========================================================================
  // API Calls & State Sync
  // ==========================================================================

  async function fetchConversationAndDashboard() {
    try {
      const [convRes, dashRes] = await Promise.all([
        fetch('/api/conversation'),
        fetch('/api/dashboard')
      ]);

      if (convRes.ok && dashRes.ok) {
        const convData = await convRes.json();
        const dashData = await dashRes.json();
        currentMessages = convData.messages || [];
        renderConversation(currentMessages);
        updateDashboard(dashData);
      }
    } catch (err) {
      console.warn('Initial data load notice:', err.message);
    }
  }

  async function handleSend() {
    if (isSending) return;
    const text = messageInput.value.trim();
    if (!text) {
      showToast('Please enter a symptom or health inquiry before sending.', 'warning');
      return;
    }

    playSound('click');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to process inquiry.', 'error');
        setLoading(false);
        return;
      }

      if (data.urgency === 'Urgent') {
        playSound('urgent');
      } else {
        playSound('receive');
      }

      messageInput.value = '';
      charCounter.textContent = '0 / 2000';

      // Refresh full conversation & dashboard
      await fetchConversationAndDashboard();
      scrollToBottom();
    } catch (err) {
      showToast('Network error connecting to Flask backend.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRestoreDemo() {
    try {
      const res = await fetch('/api/demo', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        currentMessages = data.conversation || [];
        renderConversation(currentMessages);
        updateDashboard(data.dashboard);
        playSound('receive');
        showToast('Sample clinical conversation restored with analytics!', 'success');
        scrollToBottom();
      } else {
        showToast(data.error || 'Error restoring demo.', 'error');
      }
    } catch (err) {
      showToast('Failed to contact server.', 'error');
    }
  }

  async function handleClearConfirmed() {
    try {
      const res = await fetch('/api/conversation/clear', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        currentMessages = [];
        renderConversation([]);
        const dashRes = await fetch('/api/dashboard');
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          updateDashboard(dashData);
        }
        closeModal(confirmModalBackdrop);
        playSound('click');
        showToast('Conversation cleared and analytics reset.', 'success');
      } else {
        showToast(data.error || 'Failed to clear conversation.', 'error');
      }
    } catch (err) {
      showToast('Failed to contact server.', 'error');
    }
  }

  // ==========================================================================
  // UI Rendering
  // ==========================================================================

  function renderConversation(messages) {
    messageCounterBadge.textContent = `${messages.length} Message${messages.length === 1 ? '' : 's'}`;

    if (!messages || messages.length === 0) {
      emptyState.classList.remove('hidden');
      const existingBubbles = messagesStream.querySelectorAll('.message-bubble');
      existingBubbles.forEach(b => b.remove());
      return;
    }

    emptyState.classList.add('hidden');

    const existingBubbles = messagesStream.querySelectorAll('.message-bubble');
    existingBubbles.forEach(b => b.remove());

    messages.forEach(msg => {
      const el = createMessageElement(msg);
      messagesStream.appendChild(el);
    });
  }

  function createMessageElement(msg) {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble message-${msg.sender}`;
    bubble.id = `bubble_${msg.id}`;

    if (msg.sender === 'user') {
      bubble.innerHTML = `
        <div class="bubble-header">
          <span>You</span> • <span>${escapeHtml(msg.timestamp || '')}</span>
        </div>
        <div class="bubble-content">
          ${escapeHtml(msg.text)}
        </div>
      `;
    } else {
      const analysis = msg.analysis || {};
      const urgencyClass = (analysis.urgency || 'routine').toLowerCase().replace(' ', '-');
      const intentDisplay = formatIntentName(analysis.intent || 'Guidance');

      let urgencyBanner = '';
      if (analysis.urgency === 'Urgent') {
        urgencyBanner = `
          <div class="urgency-alert-banner urgent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:18px;height:18px;">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Emergency Guidance: High-risk indicators detected. Please seek immediate professional or emergency care.</span>
          </div>
        `;
      } else if (analysis.urgency === 'Needs Attention') {
        urgencyBanner = `
          <div class="urgency-alert-banner attention">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:18px;height:18px;">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Clinical Attention Advisory: Moderate or persistent symptoms warranting physician review.</span>
          </div>
        `;
      }

      let nextStepsHtml = '';
      if (msg.next_steps && msg.next_steps.length > 0) {
        const items = msg.next_steps.map(s => `<li>${escapeHtml(s)}</li>`).join('');
        nextStepsHtml = `
          <div class="next-steps-card">
            <div class="next-steps-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:15px;height:15px;">
                <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              Evidence-Based Next Steps
            </div>
            <ul class="next-steps-list">${items}</ul>
          </div>
        `;
      }

      bubble.innerHTML = `
        <div class="assistant-card">
          <div class="assistant-header-bar">
            <div class="assistant-title-group">
              <div class="assistant-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <span class="assistant-title">${escapeHtml(msg.title || 'MedQuery Clinical Guidance')}</span>
            </div>
            <span class="assistant-timestamp">${escapeHtml(msg.timestamp || '')}</span>
          </div>
          ${urgencyBanner}
          <div class="assistant-body">
            <p>${escapeHtml(msg.text).replace(/\n/g, '<br>')}</p>
            ${nextStepsHtml}
          </div>
          <div class="assistant-footer-bar">
            <div class="metadata-pills-row">
              <span class="pill pill-intent" title="Detected Intent">Intent: ${escapeHtml(intentDisplay)}</span>
              <span class="pill pill-urgency ${urgencyClass}" title="Conservative Urgency Tier">${escapeHtml(analysis.urgency || 'Routine')}</span>
              <span class="pill pill-tone" title="Detected Emotional Tone">Tone: ${escapeHtml(analysis.tone || 'Neutral')}</span>
            </div>
            <div class="assistant-actions-group">
              <button class="btn-card-action btn-speech" title="Read guidance aloud via Speech Synthesis">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
                <span>Read</span>
              </button>
              <button class="btn-card-action btn-copy" title="Copy response to clipboard">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <span>Copy</span>
              </button>
              <button class="btn-card-action btn-inspect" data-msg-id="${msg.id}" title="Inspect full NLP pipeline details">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <span>Inspect NLP</span>
              </button>
            </div>
          </div>
        </div>
      `;

      // Event handlers for card action buttons
      const btnInspect = bubble.querySelector('.btn-inspect');
      if (btnInspect) {
        btnInspect.addEventListener('click', () => {
          playSound('click');
          openInspectionModal(msg);
        });
      }

      const btnSpeech = bubble.querySelector('.btn-speech');
      if (btnSpeech) {
        btnSpeech.addEventListener('click', () => {
          speakText(msg.text, btnSpeech);
        });
      }

      const btnCopy = bubble.querySelector('.btn-copy');
      if (btnCopy) {
        btnCopy.addEventListener('click', () => {
          const textToCopy = `${msg.text}\n\n${(msg.next_steps || []).join('\n')}`;
          navigator.clipboard.writeText(textToCopy).then(() => {
            playSound('click');
            showToast('Guidance copied to clipboard!', 'success');
          });
        });
      }
    }

    return bubble;
  }

  function updateDashboard(dash) {
    if (!dash) return;

    // Overview counters
    animateCounter(statTotalMessages, dash.total_messages || 0);
    animateCounter(statUserMessages, dash.user_messages || 0);
    animateCounter(statAssistantMessages, dash.assistant_messages || 0);
    animateCounter(statKeywordMentions, dash.total_keyword_mentions || 0);

    // Latest Analysis Card
    latestTimestamp.textContent = dash.session_started ? 'Updated just now' : 'Awaiting inquiry';
    latestIntent.textContent = formatIntentName(dash.latest_intent || 'None yet');
    latestConfidence.textContent = dash.latest_confidence ? `${Math.round(dash.latest_confidence * 100)}%` : '—';

    const currentUrg = dash.current_urgency || 'Routine';
    latestUrgencyText.textContent = currentUrg;
    latestUrgency.className = `urgency-tag ${currentUrg.toLowerCase().replace(' ', '-')}`;

    latestTone.textContent = dash.current_tone || 'Neutral';
    latestTone.className = `tone-tag ${(dash.current_tone || 'neutral').toLowerCase()}`;

    const latestKws = dash.latest_keywords || [];
    latestTermsCount.textContent = `${latestKws.length} term${latestKws.length === 1 ? '' : 's'}`;

    // Latest Keywords List
    latestKeywordsList.innerHTML = '';
    if (latestKws.length > 0) {
      latestKws.forEach(term => {
        const chip = document.createElement('span');
        chip.className = 'term-chip symptom';
        chip.textContent = term;
        latestKeywordsList.appendChild(chip);
      });
    } else {
      latestKeywordsList.innerHTML = '<span class="empty-terms-notice">No medical terms detected yet</span>';
    }

    // Most common intent
    mostCommonIntentLabel.textContent = `Most common: ${formatIntentName(dash.most_common_intent || '—')}`;

    // Intent distribution
    renderIntentDistribution(dash.intent_distribution);

    // Urgency meters
    const urgDist = dash.urgency_distribution || {};
    const routine = urgDist['Routine'] || { count: 0, percentage: 0 };
    const attention = urgDist['Needs Attention'] || { count: 0, percentage: 0 };
    const urgent = urgDist['Urgent'] || { count: 0, percentage: 0 };

    urgencyRoutineCount.textContent = `${routine.count} (${routine.percentage}%)`;
    urgencyRoutineBar.style.width = `${routine.percentage}%`;

    urgencyAttentionCount.textContent = `${attention.count} (${attention.percentage}%)`;
    urgencyAttentionBar.style.width = `${attention.percentage}%`;

    urgencyUrgentCount.textContent = `${urgent.count} (${urgent.percentage}%)`;
    urgencyUrgentBar.style.width = `${urgent.percentage}%`;

    // Tone distribution
    renderToneDistribution(dash.tone_distribution);

    // Keyword cloud
    renderKeywordCloud(dash.top_keywords, dash.total_unique_keywords);
  }

  function renderIntentDistribution(dist) {
    if (!dist || Object.keys(dist).length === 0) {
      intentDistributionList.innerHTML = '<p class="empty-distribution-notice">Send inquiries to generate real-time intent analytics.</p>';
      return;
    }

    intentDistributionList.innerHTML = '';
    Object.entries(dist).forEach(([intent, data]) => {
      const item = document.createElement('div');
      item.className = 'dist-bar-item';
      item.innerHTML = `
        <div class="dist-bar-header">
          <span class="dist-bar-name">${formatIntentName(intent)}</span>
          <span class="dist-bar-stat">${data.count} (${data.percentage}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill intent" style="width: ${data.percentage}%;"></div>
        </div>
      `;
      intentDistributionList.appendChild(item);
    });
  }

  function renderToneDistribution(dist) {
    if (!dist || Object.keys(dist).length === 0) {
      toneDistributionList.innerHTML = '<p class="empty-distribution-notice">Send inquiries to analyze emotional tone.</p>';
      return;
    }

    toneDistributionList.innerHTML = '';
    Object.entries(dist).forEach(([tone, data]) => {
      if (data.count === 0) return;
      const item = document.createElement('div');
      item.className = 'dist-bar-item';
      item.innerHTML = `
        <div class="dist-bar-header">
          <span class="dist-bar-name">${tone}</span>
          <span class="dist-bar-stat">${data.count} (${data.percentage}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill tone" style="width: ${data.percentage}%;"></div>
        </div>
      `;
      toneDistributionList.appendChild(item);
    });

    if (toneDistributionList.children.length === 0) {
      toneDistributionList.innerHTML = '<p class="empty-distribution-notice">Send inquiries to analyze emotional tone.</p>';
    }
  }

  function renderKeywordCloud(topKeywords, totalUnique) {
    uniqueKeywordsLabel.textContent = `${totalUnique || 0} unique term${totalUnique === 1 ? '' : 's'}`;
    if (!topKeywords || topKeywords.length === 0) {
      topKeywordsCloud.innerHTML = '<p class="empty-distribution-notice">Extracted health terms will appear here.</p>';
      return;
    }

    topKeywordsCloud.innerHTML = '';
    topKeywords.forEach(item => {
      const badge = document.createElement('span');
      badge.className = 'kw-freq-badge';
      badge.innerHTML = `
        <span>${escapeHtml(item.term)}</span>
        <span class="kw-freq-count">${item.count}</span>
      `;
      topKeywordsCloud.appendChild(badge);
    });
  }

  // ==========================================================================
  // NLP Inspection Modal
  // ==========================================================================

  function openInspectionModal(assistantMsg) {
    const analysis = assistantMsg.analysis || {};
    const userMsg = currentMessages.find(m => m.id === assistantMsg.analysis_ref) || {};

    const tokens = analysis.tokens || [];
    const filteredTokens = analysis.filtered_tokens || [];
    const keywords = analysis.keywords || [];
    const termDetails = analysis.term_details || {};

    let tokensBadges = tokens.map(t => {
      const isKw = keywords.some(k => k.includes(t));
      return `<span class="token-badge ${isKw ? 'keyword' : ''}">${escapeHtml(t)}</span>`;
    }).join(' ') || '<span class="text-muted text-sm">None</span>';

    let kwBadges = keywords.map(kw => {
      const cat = termDetails[kw] || 'symptom';
      return `<span class="term-chip ${cat}"><strong>${escapeHtml(kw)}</strong> [${cat}]</span>`;
    }).join(' ') || '<span class="text-muted text-sm">No health taxonomy terms detected</span>';

    modalBody.innerHTML = `
      <div class="modal-section">
        <span class="modal-section-title">Raw Clinical Inquiry</span>
        <div class="modal-text-box">
          "${escapeHtml(userMsg.text || 'N/A')}"
        </div>
      </div>

      <div class="modal-section">
        <span class="modal-section-title">Pipeline Stage 1: Tokenization & Stop-Word Filtering</span>
        <div class="token-list">
          ${tokensBadges}
        </div>
        <p class="text-muted text-sm mt-2">
          Total extracted word tokens: <strong>${tokens.length}</strong> | Retained tokens after health-context filter: <strong>${filteredTokens.length}</strong>
        </p>
      </div>

      <div class="modal-section">
        <span class="modal-section-title">Pipeline Stage 2: Healthcare Taxonomy Match</span>
        <div class="keywords-chip-list">
          ${kwBadges}
        </div>
      </div>

      <div class="modal-section">
        <span class="modal-section-title">Pipeline Stage 3: Intent Classification</span>
        <div class="modal-text-box">
          <strong>Identified Intent:</strong> ${formatIntentName(analysis.intent || 'unknown')}<br>
          <strong>Model Confidence:</strong> ${Math.round((analysis.confidence || 0) * 100)}%
        </div>
      </div>

      <div class="modal-section">
        <span class="modal-section-title">Pipeline Stage 4: Conservative Urgency Triage</span>
        <div class="modal-text-box">
          <strong>Assigned Tier:</strong> <span class="urgency-tag ${(analysis.urgency || 'routine').toLowerCase().replace(' ', '-')}">${analysis.urgency || 'Routine'}</span><br>
          <strong>Triage Rationale:</strong> ${escapeHtml(analysis.urgency_rationale || 'General educational inquiry.')}
        </div>
      </div>

      <div class="modal-section">
        <span class="modal-section-title">Pipeline Stage 5: Emotional Tone & Sentiment</span>
        <div class="modal-text-box">
          <strong>Detected Tone:</strong> <span class="tone-tag ${(analysis.tone || 'neutral').toLowerCase()}">${analysis.tone || 'Neutral'}</span><br>
          <strong>Affective Markers:</strong> ${escapeHtml(analysis.tone_rationale || 'Objective inquiry.')}
        </div>
      </div>
    `;

    openModal(analysisModalBackdrop);
  }

  // ==========================================================================
  // Print Summary Preparation
  // ==========================================================================

  function prepareAndTriggerPrint() {
    if (currentMessages.length === 0) {
      showToast('No conversation history to print. Send an inquiry or restore demo first.', 'warning');
      return;
    }

    const now = new Date();
    printDate.textContent = now.toLocaleString();
    printSessionId.textContent = `MQ-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const userCount = currentMessages.filter(m => m.sender === 'user').length;
    const assistantCount = currentMessages.filter(m => m.sender === 'assistant').length;

    printMetricsSummary.innerHTML = `
      <div class="print-metric-box">
        <span class="print-metric-label">Total Exchanges</span>
        <span class="print-metric-val">${currentMessages.length}</span>
      </div>
      <div class="print-metric-box">
        <span class="print-metric-label">User Inquiries</span>
        <span class="print-metric-val">${userCount}</span>
      </div>
      <div class="print-metric-box">
        <span class="print-metric-label">Guidance Responses</span>
        <span class="print-metric-val">${assistantCount}</span>
      </div>
      <div class="print-metric-box">
        <span class="print-metric-label">Triage Urgency Status</span>
        <span class="print-metric-val">${latestUrgencyText.textContent || 'Routine'}</span>
      </div>
    `;

    let html = '';
    for (let i = 0; i < currentMessages.length; i += 2) {
      const userMsg = currentMessages[i];
      const assistantMsg = currentMessages[i + 1];
      if (!userMsg) break;

      const analysis = (assistantMsg && assistantMsg.analysis) ? assistantMsg.analysis : {};
      const intentName = formatIntentName(analysis.intent || 'General');
      const urgency = analysis.urgency || 'Routine';
      const kws = (analysis.keywords || []).join(', ') || 'None';

      let nextStepsText = '';
      if (assistantMsg && assistantMsg.next_steps && assistantMsg.next_steps.length > 0) {
        nextStepsText = `
          <div class="print-next-steps">
            <strong>Evidence-Based Next Steps:</strong>
            <ul>
              ${assistantMsg.next_steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      html += `
        <div class="print-entry">
          <div class="print-user-q">User Inquiry [${userMsg.timestamp}]: ${escapeHtml(userMsg.text)}</div>
          <div class="print-meta-pills">
            <span><strong>Intent:</strong> ${intentName}</span>
            <span><strong>Urgency:</strong> ${urgency}</span>
            <span><strong>Tone:</strong> ${analysis.tone || 'Neutral'}</span>
            <span><strong>Terms:</strong> ${kws}</span>
          </div>
          <div class="print-assistant-r">
            <strong>Guidance:</strong> ${assistantMsg ? escapeHtml(assistantMsg.text) : 'N/A'}
            ${nextStepsText}
          </div>
        </div>
      `;
    }

    printConversationSection.innerHTML = html;
    window.print();
  }

  // ==========================================================================
  // Helper Utilities
  // ==========================================================================

  function openModal(modalEl) {
    modalEl.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }

  function closeModal(modalEl) {
    modalEl.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }

  function setLoading(loading) {
    isSending = loading;
    btnSend.disabled = loading;
    messageInput.disabled = loading;

    if (loading) {
      btnSendText.classList.add('hidden');
      btnSendIcon.classList.add('hidden');
      sendSpinner.classList.remove('hidden');
    } else {
      btnSendText.classList.remove('hidden');
      btnSendIcon.classList.remove('hidden');
      sendSpinner.classList.add('hidden');
      messageInput.focus();
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesStream.scrollTop = messagesStream.scrollHeight;
    }, 60);
  }

  function formatIntentName(intent) {
    if (!intent) return '—';
    return intent
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  function animateCounter(element, target) {
    if (!element) return;
    const start = parseInt(element.textContent, 10) || 0;
    if (start === target) {
      element.textContent = target;
      return;
    }

    const duration = 400;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.round(start + (target - start) * ease);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target;
      }
    }

    requestAnimationFrame(update);
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px) scale(0.95)';
      toast.style.transition = 'all 220ms ease';
      setTimeout(() => toast.remove(), 250);
    }, 3800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

})();
