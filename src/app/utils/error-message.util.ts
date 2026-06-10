/**
 * Extrait un message d'erreur lisible en français pour les notifications.
 */
export function getErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
  const httpError = error as {
    status?: number;
    message?: string;
    error?: { message?: string; errors?: Record<string, string> };
    userMessage?: string;
  };

  if (httpError?.userMessage) {
    return httpError.userMessage;
  }

  const apiMessage = httpError?.error?.message;
  if (apiMessage && !isTechnicalEnglishMessage(apiMessage)) {
    return apiMessage;
  }

  const validationErrors = httpError?.error?.errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const messages = Object.values(validationErrors).filter(Boolean);
    if (messages.length) {
      return messages.join('. ');
    }
  }

  if (httpError?.status === 0) {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion internet.';
  }
  if (httpError?.status === 401) {
    return 'Email ou mot de passe incorrect';
  }
  if (httpError?.status === 403) {
    return apiMessage || 'Accès non autorisé';
  }
  if (httpError?.status === 404) {
    return 'Ressource introuvable';
  }
  if (httpError?.status && httpError.status >= 500) {
    return 'Erreur serveur. Réessayez dans quelques instants.';
  }

  if (apiMessage) {
    return translateKnownEnglishMessage(apiMessage);
  }

  if (httpError?.message && !isTechnicalEnglishMessage(httpError.message)) {
    return translateKnownEnglishMessage(httpError.message);
  }

  return fallback;
}

function isTechnicalEnglishMessage(message: string): boolean {
  return (
    /^Http failure/i.test(message) ||
    /^Network Error/i.test(message) ||
    /^Unknown Error/i.test(message) ||
    /^OK$/i.test(message)
  );
}

function translateKnownEnglishMessage(message: string): string {
  const exact: Record<string, string> = {
    'Bad credentials': 'Email ou mot de passe incorrect',
    'Access Denied': 'Accès non autorisé',
    Forbidden: 'Accès non autorisé',
    Unauthorized: 'Non autorisé',
    'Internal Server Error': 'Erreur serveur. Réessayez dans quelques instants.',
    'Not Found': 'Ressource introuvable'
  };
  if (exact[message]) {
    return exact[message];
  }

  if (/must not be null/i.test(message)) {
    return 'Un champ obligatoire est manquant';
  }
  if (/must not be blank/i.test(message)) {
    return 'Un champ obligatoire est vide';
  }
  if (/must be a valid email/i.test(message)) {
    return 'Adresse e-mail invalide';
  }

  return message;
}
