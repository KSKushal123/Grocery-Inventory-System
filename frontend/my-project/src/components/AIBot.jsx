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

const clickCommandAliases = [
  {
    command: ['save invoice', 'create invoice', 'invoice'],
    label: 'invoice create',
    path: '/new-invoice',
    eventName: 'ai:create-invoice',
    buttonLabels: ['create', 'save invoice', 'create invoice'],
  },
  {
    command: ['create product', 'add product', 'product'],
    label: 'product create',
    path: '/',
    buttonLabels: ['add product', 'update product', 'create product'],
  },
  {
    command: ['create distributor', 'add distributor', 'distributor'],
    label: 'distributor create',
    path: '/profile',
    buttonLabels: ['add new distributor', 'save', 'create distributor'],
  },
  {
    command: ['create shop', 'add shop', 'shop'],
    label: 'shop create',
    path: '/shops',
    buttonLabels: ['add new shop', 'save', 'create shop'],
  },
  {
    command: ['create owner', 'save owner', 'owner'],
    label: 'owner save',
    path: '/owners',
    buttonLabels: ['save', 'edit', 'create owner'],
  },
  {
    command: ['save'],
    label: 'save',
    buttonLabels: ['save', 'create', 'add product', 'update product'],
  },
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

function normalizeCommand(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function findClickCommand(command) {
  const normalized = normalizeCommand(command)
    .replace(/^(please\s+)?(click|press|tap|hit|select)\s+(on\s+)?/, '')
    .replace(/\s+button$/, '')
    .trim();

  return clickCommandAliases.find(action => action.command.some(alias => normalized === alias));
}

function clickButtonByLabels(labels) {
  const normalizedLabels = labels.map(normalizeCommand);
  const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
  const button = buttons.find(element => {
    if (element.closest('.ai-bot') || element.disabled) return false;

    const text = normalizeCommand([
      element.textContent,
      element.getAttribute('title'),
      element.getAttribute('aria-label'),
      element.value,
    ].filter(Boolean).join(' '));

    return normalizedLabels.some(label => text === label || text.includes(label));
  });

  if (!button) return false;
  button.click();
  return true;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildDateFromTerms(terms) {
  const netDays = terms.match(/net\s*(\d+)/i);
  if (!netDays) return '';

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + Number(netDays[1]));
  return formatDate(dueDate);
}

function valueAfter(text, key, stopWords) {
  const stopPattern = stopWords.length ? `(?=\\s+(?:${stopWords.join('|')})\\b|$)` : '$';
  const match = text.match(new RegExp(`\\b(?:${key})(?:\\s+(?:is|as|=|:))?\\s+(.+?)${stopPattern}`, 'i'));
  return match?.[1]?.trim() || '';
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

function extractInvoicePayload(command) {
  const invoiceKeywords = [
    'shop',
    'for',
    'customer',
    'invoice number',
    'invoice no',
    'order number',
    'order no',
    'manager',
    'sales manager',
    'distributor',
    'terms',
    'item',
    'product',
    'quantity',
    'qty',
    'price',
    'rate',
    'notes',
    'note',
  ];

  const shopName = valueAfter(command, 'shop(?:\\s+name)?|for|customer(?:\\s+name)?', invoiceKeywords.filter(word => !['shop', 'for', 'customer'].includes(word)));
  const invoiceNumber = valueAfter(command, 'invoice\\s*(?:number|no)', invoiceKeywords);
  const orderNumber = valueAfter(command, 'order\\s*(?:number|no)', invoiceKeywords);
  const salesManager = valueAfter(command, 'sales\\s+manager|manager', invoiceKeywords);
  const distributor = valueAfter(command, 'distributor', invoiceKeywords);
  const rawTerms = valueAfter(command, 'terms', invoiceKeywords);
  const itemName = valueAfter(command, 'item|product', invoiceKeywords.filter(word => !['item', 'product'].includes(word)));
  const customerNotes = valueAfter(command, 'notes?|customer\\s+notes?', []);
  const quantity = numberAfter(command, 'quantity|qty') ?? 1;
  const price = numberAfter(command, 'price|rate') ?? 0;
  const terms = rawTerms ? rawTerms.replace(/\bnet\s+(\d+)\b/i, 'Net $1') : '';

  if (!shopName && !itemName && !invoiceNumber && !orderNumber && !salesManager && !distributor && !terms && !customerNotes && !/\b(quantity|qty|price|rate)\b/i.test(command)) return null;

  return {
    formData: {
      shopName,
      invoiceNumber,
      orderNumber,
      salesManager,
      distributor,
      terms,
      invoiceDate: formatDate(new Date()),
      dueDate: terms ? buildDateFromTerms(terms) : '',
      customerNotes,
    },
    lineItems: (itemName || /\b(quantity|qty|price|rate)\b/i.test(command))
      ? [{ description: itemName, quantity, price, amount: quantity * price }]
      : [],
  };
}

function getTranscript(event) {
  return Array.from(event.results)
    .slice(event.resultIndex)
    .map(result => result[0]?.transcript || '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
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
    createMessage('bot', 'Hi, I can help you navigate, create products, draft invoices, check stock, and search inventory. Use the mic or type a command.'),
  ]);

  const supportsVoice = Boolean(SpeechRecognition);

  const examples = useMemo(() => [
    'Open new invoice',
    'Create invoice for City Supermarket item rice quantity 2 price 55 terms Net 30',
    'create invoice shop name is City Supermarket invoice number INV-0001 sales manager Alice Johnson distributor Halguru Distributor terms Net 30 item popcorn quantity 200',
    'Add product rice quantity 20 price 55 category Pantry',
    'Show low stock',
    'click on save invoice button',
    'click on create product button',
    'click on create distributor button',
    'click on create shop button',
    'click on create owner button', 
    'click on save button',
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

  const runClickCommand = useCallback((action) => {
    const clickAction = () => {
      if (action.eventName) {
        window.dispatchEvent(new CustomEvent(action.eventName));
        return true;
      }

      return clickButtonByLabels(action.buttonLabels);
    };

    if (action.path && location.pathname !== action.path) {
      navigate(action.path);
      window.setTimeout(() => {
        if (!clickAction()) {
          addBotMessage(`I opened ${action.label}, but I could not find that button yet.`);
        }
      }, 200);
      return `Opening ${action.label} and clicking the button.`;
    }

    if (clickAction()) {
      return `Clicked the ${action.label} button.`;
    }

    return `I could not find the ${action.label} button on this page.`;
  }, [addBotMessage, location.pathname, navigate]);

  const setPendingInvoice = useCallback((payload) => {
    localStorage.setItem('aiPendingInvoice', JSON.stringify(payload));
    goTo('/new-invoice');
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('ai:set-invoice', { detail: payload }));
    }, 100);
  }, [goTo]);

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
        addBotMessage('You can ask me to open pages, create a product, draft an invoice, search inventory, show stock summary, show low stock, or show out of stock products.');
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

      const clickAction = findClickCommand(command);
      if (clickAction) {
        addBotMessage(runClickCommand(clickAction));
        return;
      }

      if (location.pathname === '/new-invoice' && /^\s*(create|save|submit|finish)\s+(this\s+)?(invoice|bill)(\s+(now|please))?\s*$/.test(lower)) {
        window.dispatchEvent(new CustomEvent('ai:create-invoice'));
        addBotMessage('Creating the invoice now. If the form asks for a missing required field, tell me that field by voice and I will fill it.');
        return;
      }

      if (/\b(create|make|draft|prepare|generate)\b.*\b(invoice|bill)\b|\bnew\s+(invoice|bill)\b.*\b(for|shop|item|product)\b|\b(invoice|bill)\b.*\b(for|shop|item|product)\b/.test(lower) || (location.pathname === '/new-invoice' && /\b(shop\s+name|customer|invoice\s+(?:number|no)|order\s+(?:number|no)|sales\s+manager|manager|distributor|terms|item|product|quantity|qty|price|rate|notes?)\b/.test(lower))) {
        const payload = extractInvoicePayload(command);
        if (!payload) {
          addBotMessage('Please say it like: create invoice for City Supermarket item rice quantity 2 price 55 distributor Fresh Foods terms Net 30.');
          return;
        }
        setPendingInvoice(payload);
        addBotMessage(`Drafting invoice${payload.formData.shopName ? ` for ${payload.formData.shopName}` : ''}. Please review it and click Create when ready.`);
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
  }, [addBotMessage, goTo, handleInventorySummary, handleStockList, location.pathname, refreshInventory, runClickCommand, setInventorySearch, setPendingInvoice]);

  useEffect(() => {
    if (!supportsVoice) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onresult = (event) => {
      const transcript = getTranscript(event);
      if (transcript) {
        setInput('');
        runCommand(transcript);
      }
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        addBotMessage('Microphone access is blocked. Please ensure you have granted microphone permissions in your browser and that the application is running over a secure connection (HTTPS).');
      } else if (event.error === 'no-speech') {
        addBotMessage('No speech was detected. Please try speaking again.');
      } else if (event.error === 'network') {
        addBotMessage('Speech recognition network error. This usually occurs if you are using Brave, Opera, Vivaldi, or Chromium (which block Google speech servers for privacy), or if a firewall/VPN is blocking it. Please try using Google Chrome or Microsoft Edge, or type your command instead.');
      } else {
        addBotMessage('I could not hear that clearly. Please try again or type the command.');
      }
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
    try {
      recognitionRef.current?.start();
    } catch {
      setIsListening(false);
      addBotMessage('I am already listening. Please speak your command now.');
    }
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
