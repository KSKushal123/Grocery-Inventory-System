import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bot, Loader2, Mic, MicOff, Send, Volume2, VolumeX, X } from 'lucide-react';
import * as api from '../api';
import './AIBot.css';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const routeCommands = [
  { match: ['inventory', 'dashboard', 'home', 'products', 'stock'], path: '/', label: 'Inventory' },
  { match: ['distributor', 'distributors', 'supplier', 'suppliers'], path: '/profile', label: 'Distributors' },
  { match: ['shops', 'nearby shops', 'stores'], path: '/shops', label: 'Shops' },
  { match: ['invoice', 'new invoice', 'create invoice', 'bill'], path: '/new-invoice', label: 'New Invoice' },
  { match: ['owner', 'owners', 'business owner', 'profile'], path: '/owners', label: 'Business Owner' },
];

function createMessage(role, text) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    text,
  };
}

function numberAfter(text, key) {
  const match = text.match(new RegExp(`(?:${key})\\s+(\\d+(?:\\.\\d+)?)`, 'i'));
  return match ? Number(match[1]) : null;
}

function textAfter(text, key) {
  const match = text.match(new RegExp(`${key}\\s+(.+)$`, 'i'));
  return match ? match[1].trim() : '';
}

function extractProductPayload(command) {
  const quantity = numberAfter(command, 'quantity|qty') ?? 1;
  const price = numberAfter(command, 'price|rate') ?? 0;
  const categoryMatch = command.match(/\bcategory\s+([a-z &]+?)(?:\s+(?:quantity|qty|price|rate|description)\b|$)/i);
  const descriptionMatch = command.match(/\bdescription\s+(.+)$/i);
  const nameMatch = command.match(/(?:add|create)\s+(?:a\s+|new\s+)?(?:product|item)\s+(.+?)(?:\s+(?:quantity|qty|price|rate|category|description)\b|$)/i);

  if (!nameMatch?.[1]?.trim()) return null;

  return {
    name: nameMatch[1].trim(),
    description: descriptionMatch?.[1]?.trim() || '',
    category: categoryMatch?.[1]?.trim() || 'Other',
    quantity,
    price,
    image: '',
  };
}

function AIBot() {
  const navigate = useNavigate();
  const location = useLocation();
  const recognitionRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    createMessage('bot', 'Hi, I can help you navigate, create products, check stock, search inventory, and open invoices. Use the mic or type a command.'),
  ]);

  const supportsVoice = Boolean(SpeechRecognition);

  const examples = useMemo(() => [
    'Open new invoice',
    'Add product rice quantity 20 price 55 category Pantry',
    'Show low stock',
    'Search inventory milk',
  ], []);

  const speak = useCallback((text) => {
    if (!isSpeaking || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking]);

  const addBotMessage = useCallback((text) => {
    setMessages(prev => [...prev, createMessage('bot', text)]);
    speak(text);
  }, [speak]);

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, createMessage('user', text)]);
  };

  const goTo = useCallback((path) => {
    if (location.pathname !== path) {
      navigate(path);
    }
  }, [location.pathname, navigate]);

  const setInventorySearch = useCallback((term) => {
    localStorage.setItem('aiPendingInventorySearch', term);
    goTo('/');
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('ai:set-inventory-search', { detail: term }));
    }, 100);
  }, [goTo]);

  const refreshInventory = useCallback(() => {
    window.dispatchEvent(new CustomEvent('ai:refresh-inventory'));
  }, []);

  const handleInventorySummary = useCallback(async () => {
    const response = await api.getItems();
    const items = response.data || [];
    const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const totalValue = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0);
    addBotMessage(`You have ${items.length} products, ${totalQuantity} items in stock, and total inventory value is ₹${totalValue}.`);
  }, [addBotMessage]);

  const handleStockList = useCallback(async (type) => {
    const response = await api.getItems();
    const items = response.data || [];
    const filtered = type === 'out'
      ? items.filter(item => Number(item.quantity || 0) === 0)
      : items.filter(item => Number(item.quantity || 0) > 0 && Number(item.quantity || 0) <= 20);

    if (filtered.length === 0) {
      addBotMessage(type === 'out' ? 'No products are out of stock.' : 'No products are low stock right now.');
      return;
    }

    const names = filtered.slice(0, 6).map(item => `${item.name} (${item.quantity})`).join(', ');
    addBotMessage(`${type === 'out' ? 'Out of stock' : 'Low stock'} products: ${names}${filtered.length > 6 ? ', and more.' : '.'}`);
  }, [addBotMessage]);

  const runCommand = useCallback(async (rawCommand) => {
    const command = rawCommand.trim();
    if (!command) return;

    setIsOpen(true);
    setInput('');
    addUserMessage(command);
    setIsThinking(true);

    try {
      const lower = command.toLowerCase();

      if (lower.includes('help') || lower.includes('what can you do')) {
        addBotMessage('You can ask me to open pages, create a product, search inventory, show stock summary, show low stock, or show out of stock products.');
        return;
      }

      if (lower.includes('search')) {
        const term = textAfter(command, 'search(?: inventory| product| item)?');
        if (!term) {
          addBotMessage('Tell me what to search for, like: search inventory milk.');
          return;
        }
        setInventorySearch(term);
        addBotMessage(`Searching inventory for ${term}.`);
        return;
      }

      if (lower.includes('stock summary') || lower.includes('inventory summary') || lower.includes('total stock')) {
        await handleInventorySummary();
        return;
      }

      if (lower.includes('low stock')) {
        await handleStockList('low');
        return;
      }

      if (lower.includes('out of stock')) {
        await handleStockList('out');
        return;
      }

      if (/\b(add|create)\b.*\b(product|item)\b/.test(lower)) {
        const payload = extractProductPayload(command);
        if (!payload) {
          addBotMessage('Please say it like: add product rice quantity 20 price 55 category Pantry.');
          return;
        }
        await api.createItem(payload);
        refreshInventory();
        goTo('/');
        addBotMessage(`Created product ${payload.name} with quantity ${payload.quantity} and price ₹${payload.price}.`);
        return;
      }

      const route = routeCommands.find(item => item.match.some(word => lower.includes(word)) && /\b(open|go|show|take|create|new)\b/.test(lower));
      if (route) {
        goTo(route.path);
        addBotMessage(`Opening ${route.label}.`);
        return;
      }

      if (lower.includes('print') && location.pathname === '/new-invoice') {
        addBotMessage('Use the Print button after creating the invoice. I will not auto-print without your click.');
        return;
      }

      addBotMessage('I did not understand that yet. Try commands like open shops, create invoice, show low stock, or add product rice quantity 20 price 55.');
    } catch (error) {
      console.error('AI bot command failed:', error);
      addBotMessage(error.response?.data?.detail || 'I could not complete that action. Please check the backend and try again.');
    } finally {
      setIsThinking(false);
    }
  }, [addBotMessage, goTo, handleInventorySummary, handleStockList, location.pathname, refreshInventory, setInventorySearch]);

  useEffect(() => {
    if (!supportsVoice) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0]?.transcript || '')
        .join(' ')
        .trim();
      if (transcript) {
        setInput(transcript);
        runCommand(transcript);
      }
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      addBotMessage('I could not hear that clearly. Please try again or type the command.');
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [addBotMessage, runCommand, supportsVoice]);

  const handleSubmit = (event) => {
    event.preventDefault();
    runCommand(input);
  };

  const toggleListening = () => {
    if (!supportsVoice) {
      addBotMessage('Voice recognition is not supported in this browser. Please type your command.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    setIsOpen(true);
    setIsListening(true);
    recognitionRef.current?.start();
  };

  return (
    <div className="ai-bot">
      {isOpen && (
        <section className="ai-bot-panel" aria-label="AI assistant">
          <div className="ai-bot-header">
            <div className="ai-bot-title">
              <span className="ai-bot-avatar"><Bot size={18} /></span>
              <div>
                <h2>AI Assistant</h2>
                <p>{isListening ? 'Listening...' : 'Ready for commands'}</p>
              </div>
            </div>
            <div className="ai-bot-actions">
              <button type="button" onClick={() => setIsSpeaking(prev => !prev)} title={isSpeaking ? 'Mute voice replies' : 'Speak replies'}>
                {isSpeaking ? <Volume2 size={17} /> : <VolumeX size={17} />}
              </button>
              <button type="button" onClick={() => setIsOpen(false)} title="Close assistant">
                <X size={17} />
              </button>
            </div>
          </div>

          <div className="ai-bot-messages">
            {messages.map(message => (
              <div key={message.id} className={`ai-bot-message ${message.role}`}>
                {message.text}
              </div>
            ))}
            {isThinking && (
              <div className="ai-bot-message bot thinking">
                <Loader2 size={15} /> Working on it
              </div>
            )}
          </div>

          <div className="ai-bot-examples">
            {examples.map(example => (
              <button key={example} type="button" onClick={() => runCommand(example)}>
                {example}
              </button>
            ))}
          </div>

          <form className="ai-bot-form" onSubmit={handleSubmit}>
            <button type="button" className={isListening ? 'listening' : ''} onClick={toggleListening} title="Voice command">
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Tell me what to do..."
            />
            <button type="submit" title="Send command">
              <Send size={18} />
            </button>
          </form>
        </section>
      )}

      <button type="button" className="ai-bot-fab" onClick={() => setIsOpen(prev => !prev)} title="Open AI assistant">
        <Bot size={24} />
      </button>
    </div>
  );
}

export default AIBot;
