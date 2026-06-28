import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface ChatMessage {
  id: number;
  from: 'bot' | 'user';
  text: string;
}

interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}

@Component({
  selector: 'app-landing-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './landing-chatbot.component.html',
  styleUrl: './landing-chatbot.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingChatbotComponent implements OnInit, OnDestroy {
  @Input() whatsappLink = '';
  @Input() contactEmail = '';

  @ViewChild('messagesViewport') messagesViewport?: ElementRef<HTMLDivElement>;

  isOpen = false;
  isTyping = false;
  draft = '';
  speechSupported = false;
  speakingMessageId: number | null = null;
  private messageSeq = 0;
  private typingTimer: ReturnType<typeof setTimeout> | null = null;
  private frenchVoice: SpeechSynthesisVoice | null = null;
  private voicesChangedHandler?: () => void;

  messages: ChatMessage[] = [];
  hasWelcomed = false;

  readonly quickQuestions = [
    "C'est quoi Stock SaaS ?",
    'À qui s\'adresse l\'application ?',
    'Y a-t-il un essai gratuit ?',
    'Paiement Wave / Orange Money',
    'Comment m\'inscrire ?'
  ];

  private readonly faqEntries: FaqEntry[] = [
    {
      id: 'about',
      question: "C'est quoi Stock SaaS ?",
      answer:
        'Stock SaaS est une plateforme en ligne de gestion de stock et de facturation, pensée pour les entreprises au Sénégal. ' +
        'Vous suivez vos produits, entrepôts, mouvements, inventaires et factures depuis un seul compte, en FCFA.',
      keywords: ['stock saas', 'c est quoi', "c'est quoi", 'but', 'objectif', 'plateforme', 'application', 'faire', 'sert']
    },
    {
      id: 'audience',
      question: "À qui s'adresse l'application ?",
      answer:
        'Aux boutiques, supérettes, quincailleries, pharmacies, grossistes, restaurants et toute structure qui gère du stock. ' +
        'Idéal si vous avez un ou plusieurs points de vente ou entrepôts (Dakar, Thiès, régions…).',
      keywords: ['qui', 'pour qui', 'cible', 'boutique', 'entreprise', 'secteur', 'magasin']
    },
    {
      id: 'features',
      question: 'Quelles sont les fonctionnalités ?',
      answer:
        'Stock en temps réel, alertes de rupture, entrepôts multiples, mouvements (entrées/sorties/transferts), inventaires, ' +
        'facturation PDF, clients/partenaires, rôles admin et gestionnaire, tableau de bord.',
      keywords: ['fonction', 'feature', 'faire', 'possibilite', 'outil', 'module']
    },
    {
      id: 'trial',
      question: 'Y a-t-il un essai gratuit ?',
      answer:
        'Oui. Vous bénéficiez d\'un mois d\'essai gratuit pour tester toutes les fonctionnalités, sans engagement.',
      keywords: ['essai', 'gratuit', 'trial', 'mois', 'tester', 'demo']
    },
    {
      id: 'payment',
      question: 'Paiement Wave / Orange Money',
      answer:
        'Oui. Après l\'essai, l\'abonnement se règle par Wave ou Orange Money depuis votre téléphone. Tous les tarifs sont en FCFA.',
      keywords: ['wave', 'orange', 'money', 'payer', 'paiement', 'fcfa', 'tarif', 'abonnement']
    },
    {
      id: 'warehouses',
      question: 'Plusieurs magasins ou entrepôts ?',
      answer:
        'Oui. Créez plusieurs entrepôts et suivez le stock de chaque site. Le rôle gestionnaire peut être limité à certains entrepôts.',
      keywords: ['entrepot', 'magasin', 'depot', 'multi', 'site', 'gestionnaire']
    },
    {
      id: 'register',
      question: "Comment m'inscrire ?",
      answer:
        'Cliquez sur « Créer un compte » en haut de la page. Renseignez votre entreprise, validez votre compte par e-mail, ' +
        'puis définissez votre mot de passe pour commencer.',
      keywords: ['inscri', 'compte', 'creer', 'register', 'demarrer', 'commencer']
    },
    {
      id: 'support',
      question: 'Comment contacter le support ?',
      answer: '', // filled dynamically
      keywords: ['support', 'contact', 'aide', 'whatsapp', 'email', 'humain']
    }
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    this.speechSupported = true;
    const loadVoices = (): void => {
      this.frenchVoice = this.pickFrenchVoice();
      this.cdr.markForCheck();
    };
    loadVoices();
    this.voicesChangedHandler = loadVoices;
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
  }

  ngOnDestroy(): void {
    this.stopSpeech();
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    if (this.voicesChangedHandler && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.removeEventListener('voiceschanged', this.voicesChangedHandler);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen && !this.hasWelcomed) {
      this.hasWelcomed = true;
      this.pushBotMessage(
        'Bonjour 👋 Je suis l\'assistant Stock SaaS. Posez-moi une question sur la plateforme ou choisissez une suggestion ci-dessous.'
      );
    }
    this.cdr.markForCheck();
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 50);
    }
  }

  close(): void {
    this.stopSpeech();
    this.isOpen = false;
    this.cdr.markForCheck();
  }

  toggleMessageAudio(msg: ChatMessage): void {
    if (!this.speechSupported) {
      return;
    }
    if (this.speakingMessageId === msg.id) {
      this.stopSpeech();
      return;
    }
    this.speakText(msg.text, msg.id);
  }

  isSpeakingMessage(messageId: number): boolean {
    return this.speakingMessageId === messageId;
  }

  askQuestion(question: string): void {
    const trimmed = question.trim();
    if (!trimmed || this.isTyping) {
      return;
    }
    this.draft = '';
    this.pushUserMessage(trimmed);
    this.replyWithDelay(this.resolveAnswer(trimmed));
  }

  onSubmit(): void {
    this.askQuestion(this.draft);
  }

  trackByMessageId(_index: number, msg: ChatMessage): number {
    return msg.id;
  }

  private pushUserMessage(text: string): void {
    this.messages = [...this.messages, { id: ++this.messageSeq, from: 'user', text }];
    this.cdr.markForCheck();
    this.scrollToBottom();
  }

  private pushBotMessage(text: string): void {
    const id = ++this.messageSeq;
    this.messages = [...this.messages, { id, from: 'bot', text }];
    this.cdr.markForCheck();
    this.scrollToBottom();
  }

  private replyWithDelay(answer: string): void {
    this.isTyping = true;
    this.cdr.markForCheck();
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    this.typingTimer = setTimeout(() => {
      this.isTyping = false;
      this.pushBotMessage(answer);
      this.typingTimer = null;
    }, 650 + Math.min(answer.length * 8, 900));
  }

  private resolveAnswer(question: string): string {
    const normalized = this.normalize(question);

    const supportEntry = this.faqEntries.find(e => e.id === 'support');
    if (supportEntry) {
      const parts: string[] = ['Par WhatsApp ou e-mail :'];
      if (this.whatsappLink) {
        parts.push('WhatsApp disponible depuis le pied de page.');
      }
      if (this.contactEmail) {
        parts.push(`E-mail : ${this.contactEmail}.`);
      }
      parts.push('Nous répondons aux horaires de Dakar (GMT).');
      supportEntry.answer = parts.join(' ');
    }

    let best: FaqEntry | null = null;
    let bestScore = 0;

    for (const entry of this.faqEntries) {
      const score = this.matchScore(normalized, entry);
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }

    if (best && bestScore >= 2) {
      return best.answer;
    }

    return (
      'Je n\'ai pas trouvé de réponse précise à cette question. ' +
      'Voici ce que je peux vous expliquer : le but de Stock SaaS, les fonctionnalités, l\'essai gratuit, ' +
      'les paiements Wave/Orange Money ou l\'inscription. Choisissez une suggestion ou reformulez votre question.'
    );
  }

  private matchScore(normalizedQuestion: string, entry: FaqEntry): number {
    let score = 0;
    const normalizedFaqQ = this.normalize(entry.question);

    if (normalizedQuestion === normalizedFaqQ) {
      return 100;
    }
    if (normalizedQuestion.includes(normalizedFaqQ) || normalizedFaqQ.includes(normalizedQuestion)) {
      score += 10;
    }

    for (const keyword of entry.keywords) {
      if (normalizedQuestion.includes(this.normalize(keyword))) {
        score += 3;
      }
    }

    return score;
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private scrollToBottom(): void {
    const el = this.messagesViewport?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }

  private speakText(text: string, messageId: number): void {
    if (!this.speechSupported || typeof window === 'undefined') {
      return;
    }

    const spoken = this.sanitizeForSpeech(text);
    if (!spoken) {
      return;
    }

    this.stopSpeech(false);

    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.lang = 'fr-FR';
    if (this.frenchVoice) {
      utterance.voice = this.frenchVoice;
    }
    utterance.rate = 0.96;
    utterance.pitch = 1;

    utterance.onend = () => {
      if (this.speakingMessageId === messageId) {
        this.speakingMessageId = null;
        this.cdr.markForCheck();
      }
    };
    utterance.onerror = () => {
      if (this.speakingMessageId === messageId) {
        this.speakingMessageId = null;
        this.cdr.markForCheck();
      }
    };

    this.speakingMessageId = messageId;
    this.cdr.markForCheck();
    window.speechSynthesis.speak(utterance);
  }

  private stopSpeech(markCheck = true): void {
    if (!this.speechSupported || typeof window === 'undefined') {
      return;
    }
    window.speechSynthesis.cancel();
    this.speakingMessageId = null;
    if (markCheck) {
      this.cdr.markForCheck();
    }
  }

  private pickFrenchVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find(v => v.lang.toLowerCase() === 'fr-fr') ??
      voices.find(v => v.lang.toLowerCase().startsWith('fr')) ??
      null
    );
  }

  private sanitizeForSpeech(text: string): string {
    return text
      .replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '')
      .replace(/«|»/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
